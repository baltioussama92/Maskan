package com.maskan.api.controller;

import com.maskan.api.dto.HostDemandResponse;
import com.maskan.api.entity.HostDemand;
import com.maskan.api.entity.HostDemandStatus;
import com.maskan.api.entity.User;
import com.maskan.api.repository.HostDemandRepository;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.util.HostDemandMediaResolver;
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
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/verifications")
@RequiredArgsConstructor
public class HostVerificationController {

    private static final Path HOST_UPLOAD_ROOT = Paths.get("uploads", "host-demands");

    private final UserRepository userRepository;
    private final HostDemandRepository hostDemandRepository;

    @PostMapping("/host")
    public ResponseEntity<HostDemandResponse> submitHostVerification(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("governmentID") MultipartFile governmentId,
            @RequestParam("selfie") MultipartFile selfie,
            @RequestParam("propertyProof") MultipartFile propertyProof,
            @RequestParam(value = "propertyImages", required = false) List<MultipartFile> propertyImages,
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "proposedLocation", required = false) String proposedLocation,
            @RequestParam(value = "proposedPricePerNight", required = false) Double proposedPricePerNight,
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

        String governmentIdPath = saveFile(governmentId);
        String selfiePath = saveFile(selfie);
        String propertyProofPath = saveFile(propertyProof);
        List<String> propertyImagePaths = saveFiles(propertyImages);

        String resolvedName = StringUtils.hasText(fullName) ? fullName.trim() : user.getName();
        String resolvedEmail = StringUtils.hasText(email) ? email.trim() : user.getEmail();
        String resolvedPhone = StringUtils.hasText(phone) ? phone.trim() : user.getPhone();
        String resolvedLocation = StringUtils.hasText(proposedLocation) ? proposedLocation.trim() : "N/A";
        double resolvedPrice = proposedPricePerNight == null ? 0.0 : proposedPricePerNight;

        HostDemand demand = HostDemand.builder()
                .userId(user.getId())
                .fullName(resolvedName)
                .email(resolvedEmail)
                .phone(resolvedPhone)
                .submittedDate(Instant.now())
                .idDocumentUrl(governmentIdPath)
                .selfieUrl(selfiePath)
                .propertyProofUrl(propertyProofPath)
                .idStatus(HostDemandStatus.PENDING)
                .proposedLocation(resolvedLocation)
                .proposedPricePerNight(resolvedPrice)
                .housePictures(propertyImagePaths)
                .status(HostDemandStatus.PENDING)
                .build();

        HostDemand saved = hostDemandRepository.save(demand);
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
        HostDemand demand = hostDemandRepository.findByUserId(user.getId()).stream()
                .max(Comparator.comparing(HostDemand::getSubmittedDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElseThrow(() -> new IllegalArgumentException("No host verification request found"));

        return ResponseEntity.ok(toHostDemandResponse(demand));
    }

    private List<String> saveFiles(List<MultipartFile> files) {
        List<String> savedPaths = new ArrayList<>();
        if (files == null || files.isEmpty()) {
            return savedPaths;
        }

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            savedPaths.add(saveFile(file));
        }

        return savedPaths;
    }

    private String saveFile(MultipartFile file) {
        try {
            Files.createDirectories(HOST_UPLOAD_ROOT);

            String safeOriginalName = sanitizeFilename(file.getOriginalFilename());
            String extension = "";
            int dotIndex = safeOriginalName.lastIndexOf('.');
            if (dotIndex >= 0) {
                extension = safeOriginalName.substring(dotIndex);
            }

            String filename = Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + extension;
            Path destination = HOST_UPLOAD_ROOT.resolve(filename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/host-demands/" + filename;
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

    private HostDemandResponse toHostDemandResponse(HostDemand demand) {
        HostDemandMediaResolver.ResolvedMedia media = HostDemandMediaResolver.resolve(demand);
        List<String> documents = new ArrayList<>();
        if (demand.getIdDocumentUrl() != null && !demand.getIdDocumentUrl().isBlank()) {
            documents.add(demand.getIdDocumentUrl());
        }
        if (media.selfieUrl() != null) {
            documents.add(media.selfieUrl());
        }
        if (media.propertyProofUrl() != null) {
            documents.add(media.propertyProofUrl());
        }
        documents.addAll(media.housePictures());

        HostDemandStatus status = (demand.getStatus() == null ? HostDemandStatus.PENDING : demand.getStatus()).normalized();
        HostDemandStatus idStatus = (demand.getIdStatus() == null ? HostDemandStatus.PENDING : demand.getIdStatus()).normalized();

        return HostDemandResponse.builder()
                .id(demand.getId())
                .userId(demand.getUserId())
                .userName(demand.getFullName())
                .userEmail(demand.getEmail())
                .userPhone(demand.getPhone())
                .status(status.name().toLowerCase())
                .submittedDate(demand.getSubmittedDate() == null ? null : demand.getSubmittedDate().toString())
                .documents(documents)
                .idDocument(demand.getIdDocumentUrl())
                .selfieUrl(media.selfieUrl())
                .propertyProofUrl(media.propertyProofUrl())
                .idVerificationStatus(idStatus == HostDemandStatus.APPROVED ? "verified"
                        : idStatus == HostDemandStatus.REJECTED ? "rejected" : "pending")
                .housePictures(media.housePictures())
                .proposedPrice(demand.getProposedPricePerNight() == null ? 0 : demand.getProposedPricePerNight())
                .proposedLocation(demand.getProposedLocation() == null ? "N/A" : demand.getProposedLocation())
                .bio(null)
                .notes(null)
                .build();
    }
}
