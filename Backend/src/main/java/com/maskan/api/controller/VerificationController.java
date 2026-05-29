package com.maskan.api.controller;

import com.maskan.api.dto.PhoneOtpSendRequest;
import com.maskan.api.dto.PhoneOtpSendResponse;
import com.maskan.api.dto.PhoneOtpVerifyRequest;
import com.maskan.api.dto.SendOtpRequest;
import com.maskan.api.dto.VerificationSummaryResponse;
import com.maskan.api.dto.VerifyOtpRequest;
import com.maskan.api.entity.User;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.PhoneVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/verifications/guest")
@RequiredArgsConstructor
public class VerificationController {

    private static final Path VERIFICATION_UPLOAD_ROOT = Paths.get("uploads", "verifications");

    private final UserRepository userRepository;
    private final PhoneVerificationService phoneVerificationService;

    @GetMapping("/status")
    public ResponseEntity<VerificationSummaryResponse> getStatus(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        return ResponseEntity.ok(toSummary(user));
    }

    @PostMapping("/email/send-otp")
    public ResponseEntity<Void> sendEmailOtp(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody(required = false) SendOtpRequest request
    ) {
        getCurrentUser(userDetails);
        throw new IllegalArgumentException("Utilisez /api/verifications/email/send-otp");
    }

    @PostMapping("/email/verify-otp")
    public ResponseEntity<VerificationSummaryResponse> verifyEmailOtp(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        getCurrentUser(userDetails);
        throw new IllegalArgumentException("Utilisez /api/verifications/email/verify-otp");
    }

    @PostMapping("/phone/send-otp")
    public ResponseEntity<PhoneOtpSendResponse> sendPhoneOtp(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PhoneOtpSendRequest request
    ) {
        User user = getCurrentUser(userDetails);
        return ResponseEntity.ok(phoneVerificationService.sendOtp(user, request.getPhoneNumber()));
    }

    @PostMapping("/phone/verify-otp")
    public ResponseEntity<VerificationSummaryResponse> verifyPhoneOtp(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PhoneOtpVerifyRequest request
    ) {
        User user = getCurrentUser(userDetails);
        return ResponseEntity.ok(phoneVerificationService.verifyOtp(user, request.getReqId(), request.getCode()));
    }

    @PostMapping("/identity")
    public ResponseEntity<VerificationSummaryResponse> submitIdentity(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("governmentIds") List<MultipartFile> governmentIds,
            @RequestParam(value = "otherAttachments", required = false) List<MultipartFile> otherAttachments,
            @RequestParam("selfie") MultipartFile selfie
    ) {
        User user = getCurrentUser(userDetails);
        if (governmentIds == null || governmentIds.isEmpty() || governmentIds.stream().allMatch(MultipartFile::isEmpty)) {
            throw new IllegalArgumentException("At least one government ID file is required");
        }
        if (selfie == null || selfie.isEmpty()) {
            throw new IllegalArgumentException("Selfie file is required");
        }

        List<String> savedGovernmentIds = storeFiles(user.getId(), governmentIds, "government-id");
        List<String> savedAttachments = storeFiles(user.getId(), otherAttachments, "attachment");
        String savedSelfie = storeSingleFile(user.getId(), selfie, "selfie");

        user.setIdentityStatus("pending");
        user.setRejectionReason(null);
        user.setGovernmentIdFiles(savedGovernmentIds);
        user.setOtherAttachmentFiles(savedAttachments);
        user.setSelfieFile(savedSelfie);
        user.setIdentitySubmittedAt(Instant.now());
        applyDerivedVerificationLevel(user);
        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(toSummary(saved));
    }

    private List<String> storeFiles(String userId, List<MultipartFile> files, String prefix) {
        List<String> savedPaths = new ArrayList<>();
        if (files == null || files.isEmpty()) {
            return savedPaths;
        }

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            savedPaths.add(storeSingleFile(userId, file, prefix));
        }

        return savedPaths;
    }

    private String storeSingleFile(String userId, MultipartFile file, String prefix) {
        try {
            Path userFolder = VERIFICATION_UPLOAD_ROOT.resolve(userId);
            Files.createDirectories(userFolder);

            String safeOriginalName = sanitizeFilename(file.getOriginalFilename());
            String extension = "";
            int dotIndex = safeOriginalName.lastIndexOf('.');
            if (dotIndex >= 0) {
                extension = safeOriginalName.substring(dotIndex);
            }

            String filename = prefix + "-" + UUID.randomUUID() + extension;
            Path destination = userFolder.resolve(filename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            return destination.toString().replace('\\', '/');
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store uploaded file");
        }
    }

    private String sanitizeFilename(String originalName) {
        String value = StringUtils.hasText(originalName) ? originalName : "file";
        return value.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private User getCurrentUser(UserDetails userDetails) {
        if (userDetails == null || !StringUtils.hasText(userDetails.getUsername())) {
            throw new UsernameNotFoundException("Authenticated user not found");
        }

        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated user not found"));
    }

    private void applyDerivedVerificationLevel(User user) {
        String identityStatus = StringUtils.hasText(user.getIdentityStatus()) ? user.getIdentityStatus() : "not_verified";
        if ("approved".equalsIgnoreCase(identityStatus)) {
            user.setVerificationLevel(3);
            return;
        }

        if (Boolean.TRUE.equals(user.getPhoneVerified())) {
            user.setVerificationLevel(2);
            return;
        }

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            user.setVerificationLevel(1);
            return;
        }

        user.setVerificationLevel(0);
    }

    private VerificationSummaryResponse toSummary(User user) {
        String identityStatus = StringUtils.hasText(user.getIdentityStatus()) ? user.getIdentityStatus() : "not_verified";
        Integer level = user.getVerificationLevel() == null ? 0 : user.getVerificationLevel();

        return VerificationSummaryResponse.builder()
                .emailVerified(Boolean.TRUE.equals(user.getEmailVerified()))
                .phoneVerified(Boolean.TRUE.equals(user.getPhoneVerified()))
                .identityStatus(identityStatus)
                .verificationLevel(level)
                .rejectionReason(user.getRejectionReason())
                .build();
    }
}
