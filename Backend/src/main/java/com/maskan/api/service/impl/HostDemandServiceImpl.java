package com.maskan.api.service.impl;

import com.maskan.api.entity.HostDemand;
import com.maskan.api.entity.NotificationType;
import com.maskan.api.entity.Role;
import com.maskan.api.entity.User;
import com.maskan.api.exception.NotFoundException;
import com.maskan.api.repository.HostDemandRepository;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.HostDemandService;
import com.maskan.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class HostDemandServiceImpl implements HostDemandService {

    private final HostDemandRepository hostDemandRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final MongoTemplate mongoTemplate;

    private static final Path UPLOAD_DIR = Paths.get("uploads", "host-demands");

    @Override
    public HostDemand submitDemand(String userId, String fullName, String email, String phone, String proposedLocation, Double proposedPricePerNight, MultipartFile idDocument, List<MultipartFile> housePictures) {
        String idDocumentUrl = saveFile(idDocument);
        List<String> housePictureUrls = new ArrayList<>();
        if (housePictures != null) {
            for (MultipartFile pic : housePictures) {
                if (!pic.isEmpty()) {
                    housePictureUrls.add(saveFile(pic));
                }
            }
        }

        HostDemand demand = HostDemand.builder()
                .userId(userId)
                .fullName(fullName)
                .email(normalizeEmail(email))
                .phone(phone)
                .submittedDate(Instant.now())
                .idDocumentUrl(idDocumentUrl)
                .idStatus("PENDING")
                .proposedLocation(proposedLocation)
                .proposedPricePerNight(proposedPricePerNight)
                .housePictures(housePictureUrls)
                .status("PENDING")
                .build();

        HostDemand savedDemand = hostDemandRepository.save(demand);
        markUserHostApplicationPending(userId);
        return savedDemand;
    }

    @Override
    public List<HostDemand> getAllDemands(String status) {
        if (StringUtils.hasText(status)) {
            return hostDemandRepository.findByStatus(status.toUpperCase(Locale.ROOT));
        }
        return hostDemandRepository.findAll();
    }

    @Override
    public HostDemand getDemandById(String id) {
        return hostDemandRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Host demand not found"));
    }

    /**
     * Approves or rejects a host demand and keeps the linked user document in sync.
     * Each MongoDB update is a single atomic write; both must succeed before returning.
     */
    @Override
    public HostDemand updateStatus(String id, String status) {
        if (!StringUtils.hasText(status)) {
            throw new IllegalArgumentException("Status is required");
        }

        HostDemand demand = getDemandById(id);
        String upperStatus = status.trim().toUpperCase(Locale.ROOT);

        return switch (upperStatus) {
            case "APPROVED" -> approveDemand(demand);
            case "REJECTED" -> rejectDemand(demand);
            default -> throw new IllegalArgumentException("Unsupported status: " + status);
        };
    }

    private HostDemand approveDemand(HostDemand demand) {
        User user = resolveDemandUser(demand);

        long usersUpdated = mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(user.getId())),
                new Update()
                        .set("role", Role.HOST)
                        .set("identityStatus", "approved")
                        .set("verificationLevel", 3)
                        .set("isVerified", Boolean.TRUE)
                        .unset("rejectionReason"),
                User.class
        ).getModifiedCount();

        if (usersUpdated == 0 && user.getRole() != Role.HOST) {
            throw new IllegalStateException(
                    "Failed to upgrade user " + user.getId() + " to HOST while approving demand " + demand.getId()
            );
        }

        long demandsUpdated = mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(demand.getId())),
                new Update()
                        .set("status", "APPROVED")
                        .set("idStatus", "VERIFIED")
                        .set("userId", user.getId()),
                HostDemand.class
        ).getModifiedCount();

        if (demandsUpdated == 0 && !"APPROVED".equalsIgnoreCase(demand.getStatus())) {
            throw new IllegalStateException(
                    "Failed to mark host demand " + demand.getId() + " as APPROVED after user upgrade"
            );
        }

        log.info("Host demand {} approved; user {} upgraded to HOST", demand.getId(), user.getId());

        notificationService.sendInternalNotification(
                user.getId(),
                "Host Application Approved",
                "Your host application has been approved. Refresh the page to activate your HOST features.",
                NotificationType.SYSTEM
        );

        return getDemandById(demand.getId());
    }

    private HostDemand rejectDemand(HostDemand demand) {
        long demandsUpdated = mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(demand.getId())),
                new Update()
                        .set("status", "REJECTED")
                        .set("idStatus", "REJECTED"),
                HostDemand.class
        ).getModifiedCount();

        if (demandsUpdated == 0 && !"REJECTED".equalsIgnoreCase(demand.getStatus())) {
            throw new IllegalStateException("Failed to mark host demand " + demand.getId() + " as REJECTED");
        }

        resolveDemandUserOptional(demand).ifPresentOrElse(
                user -> notificationService.sendInternalNotification(
                        user.getId(),
                        "Host Application Update",
                        "Your host application has been reviewed. Unfortunately, it was not approved at this time. Please contact support for more information.",
                        NotificationType.SYSTEM
                ),
                () -> log.warn("Host demand {} rejected but no linked user was found", demand.getId())
        );

        return getDemandById(demand.getId());
    }

    private void markUserHostApplicationPending(String userId) {
        if (!StringUtils.hasText(userId)) {
            return;
        }

        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(userId)),
                new Update()
                        .set("identityStatus", "pending")
                        .set("identitySubmittedAt", Instant.now()),
                User.class
        );
    }

    private User resolveDemandUser(HostDemand demand) {
        if (StringUtils.hasText(demand.getUserId())) {
            var byId = userRepository.findById(demand.getUserId());
            if (byId.isPresent()) {
                return byId.get();
            }
            log.warn("Host demand {} references missing userId {}; falling back to email lookup", demand.getId(), demand.getUserId());
        }

        if (StringUtils.hasText(demand.getEmail())) {
            return userRepository.findByEmail(normalizeEmail(demand.getEmail()))
                    .orElseThrow(() -> new NotFoundException(
                            "User not found for host demand " + demand.getId()
                                    + " (userId=" + demand.getUserId() + ", email=" + demand.getEmail() + ")"
                    ));
        }

        throw new NotFoundException("Host demand " + demand.getId() + " is not linked to any user");
    }

    private java.util.Optional<User> resolveDemandUserOptional(HostDemand demand) {
        try {
            return java.util.Optional.of(resolveDemandUser(demand));
        } catch (NotFoundException exception) {
            return java.util.Optional.empty();
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String saveFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        try {
            Files.createDirectories(UPLOAD_DIR);
            String extension = "";
            String originalName = file.getOriginalFilename();
            if (originalName != null && originalName.lastIndexOf('.') >= 0) {
                extension = originalName.substring(originalName.lastIndexOf('.'));
            }
            String generatedName = Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + extension;
            Path targetFile = UPLOAD_DIR.resolve(generatedName);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/host-demands/")
                    .path(generatedName)
                    .toUriString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }
}
