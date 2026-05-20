package com.maskan.api.controller;

import com.maskan.api.dto.HostDemandResponse;
import com.maskan.api.entity.HostVerification;
import com.maskan.api.entity.HostVerificationStatus;
import com.maskan.api.entity.User;
import com.maskan.api.repository.HostVerificationRepository;
import com.maskan.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
@RequestMapping("/api/verifications")
@RequiredArgsConstructor
public class HostVerificationController {

    private static final Path VERIFICATION_UPLOAD_ROOT = Paths.get("uploads", "verifications");

    private final UserRepository userRepository;
    private final HostVerificationRepository hostVerificationRepository;

    @PostMapping("/host")
    public ResponseEntity<HostDemandResponse> submitHostVerification(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("governmentID") MultipartFile governmentId,
            @RequestParam("selfie") MultipartFile selfie,
            @RequestParam("propertyProof") MultipartFile propertyProof,
            @RequestParam(value = "propertyImages", required = false) List<MultipartFile> propertyImages,
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(value = "acceptTerms", required = false, defaultValue = "false") boolean acceptTerms,
            @RequestParam(value = "confirmOwnership", required = false, defaultValue = "false") boolean confirmOwnership
    ) {
        User user = getCurrentUser(userDetails);

        if (governmentId == null || governmentId.isEmpty()) {
            throw new IllegalArgumentException("Government ID file is required");
        }
        if (selfie == null || selfie.isEmpty()) {
            throw new IllegalArgumentException("Selfie file is required");
        }
        if (propertyProof == null || propertyProof.isEmpty()) {
            throw new IllegalArgumentException("Property proof file is required");
        }
        if (!acceptTerms || !confirmOwnership) {
            throw new IllegalArgumentException("Ownership confirmation and terms acceptance are required");
        }

        String governmentIdPath = storeSingleFile(user.getId(), governmentId, "government-id");
        String selfiePath = storeSingleFile(user.getId(), selfie, "selfie");
        String propertyProofPath = storeSingleFile(user.getId(), propertyProof, "property-proof");
        List<String> propertyImagePaths = storeFiles(user.getId(), propertyImages, "property-image");

        List<String> attachments = new ArrayList<>();
        attachments.add(propertyProofPath);
        attachments.addAll(propertyImagePaths);

        if (StringUtils.hasText(fullName)) {
            user.setName(fullName.trim());
        }

        user.setGovernmentIdFiles(List.of(governmentIdPath));
        user.setSelfieFile(selfiePath);
        user.setOtherAttachmentFiles(attachments);
        user.setIdentityStatus("pending");
        user.setRejectionReason(null);
        user.setIdentitySubmittedAt(Instant.now());
        applyDerivedVerificationLevel(user);

        User saved = userRepository.save(user);

        HostVerification hostVerification = hostVerificationRepository.findById(saved.getId())
            .orElseGet(HostVerification::new);
        hostVerification.setId(saved.getId());
        hostVerification.setUserId(saved.getId());
        hostVerification.setStatus(HostVerificationStatus.PENDING);
        hostVerification.setGovernmentIdFiles(saved.getGovernmentIdFiles());
        hostVerification.setSelfieFile(saved.getSelfieFile());
        hostVerification.setOtherAttachmentFiles(saved.getOtherAttachmentFiles());
        hostVerification.setSubmittedAt(saved.getIdentitySubmittedAt());
        hostVerification.setReviewedAt(null);
        hostVerification.setRejectionReason(null);
        hostVerificationRepository.save(hostVerification);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(toHostDemandResponse(saved));
    }

    @GetMapping("/me")
    public ResponseEntity<HostDemandResponse> getVerificationSummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(name = "type", required = false) String type
    ) {
        if (!StringUtils.hasText(type) || !"host".equalsIgnoreCase(type.trim())) {
            throw new IllegalArgumentException("Unsupported verification type. Use type=HOST");
        }

        User user = getCurrentUser(userDetails);
        return ResponseEntity.ok(toHostDemandResponse(user));
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

    private HostDemandResponse toHostDemandResponse(User user) {
        List<String> governmentIds = user.getGovernmentIdFiles() == null ? List.of() : user.getGovernmentIdFiles();
        List<String> attachments = user.getOtherAttachmentFiles() == null ? List.of() : user.getOtherAttachmentFiles();
        List<String> housePictures = attachments.stream()
                .filter(path -> path != null && path.contains("property-image-"))
                .toList();

        List<String> documents = new ArrayList<>(governmentIds);
        if (user.getSelfieFile() != null && !user.getSelfieFile().isBlank()) {
            documents.add(user.getSelfieFile());
        }
        documents.addAll(attachments.stream()
                .filter(path -> path != null && path.contains("property-proof-"))
                .toList());

        String submittedDate = user.getIdentitySubmittedAt() != null
                ? user.getIdentitySubmittedAt().toString()
                : (user.getCreatedAt() == null ? null : user.getCreatedAt().toString());

        String status = resolveHostDemandStatus(user);
        String idVerificationStatus = switch (status) {
            case "approved" -> "verified";
            case "rejected" -> "rejected";
            default -> "pending";
        };

        String idDocument = !governmentIds.isEmpty()
                ? governmentIds.get(0)
                : (user.getSelfieFile() == null || user.getSelfieFile().isBlank() ? null : user.getSelfieFile());

        return HostDemandResponse.builder()
                .id(user.getId())
                .userId(user.getId())
                .userName(user.getName())
                .userEmail(user.getEmail())
                .userPhone(null)
                .status(status)
                .submittedDate(submittedDate)
                .documents(documents)
                .idDocument(idDocument)
                .idVerificationStatus(idVerificationStatus)
                .housePictures(housePictures)
                .proposedPrice(0)
                .proposedLocation("N/A")
                .bio(null)
                .notes(user.getRejectionReason())
                .build();
    }

    private String resolveHostDemandStatus(User user) {
        String identityStatus = user.getIdentityStatus() == null ? "" : user.getIdentityStatus().trim().toLowerCase();
        return switch (identityStatus) {
            case "approved" -> "approved";
            case "rejected" -> "rejected";
            default -> "pending";
        };
    }
}