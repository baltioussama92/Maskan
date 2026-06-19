package com.maskan.api.service.impl;

import com.maskan.api.dto.UpdateUserProfileRequest;
import com.maskan.api.dto.UpdateMyPasswordRequest;
import com.maskan.api.dto.UserDto;
import com.maskan.api.dto.NotificationPreferencesDto;
import com.maskan.api.dto.PrivacyPreferencesDto;
import com.maskan.api.dto.UpdateUserPreferencesRequest;
import com.maskan.api.dto.UserPreferencesDto;
import com.maskan.api.entity.NotificationType;
import com.maskan.api.entity.User;
import com.maskan.api.entity.UserPreferences;
import com.maskan.api.exception.NotFoundException;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.NotificationService;
import com.maskan.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public UserDto getMe(String email) {
        User user = findByEmail(email);
        return toDto(user);
    }

    @Override
    public UserDto updateMe(String email, UpdateUserProfileRequest request) {
        User user = findByEmail(email);
        user.setName(request.getFullName());
        if (request.getUsername() != null) {
            user.setUsername(request.getUsername());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getCity() != null) {
            user.setCity(request.getCity());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        User updated = userRepository.save(user);
        return toDto(updated);
    }

    @Override
    public void updateMyPassword(String email, UpdateMyPasswordRequest request) {
        User user = findByEmail(email);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        notificationService.sendInternalNotification(
            user.getId(),
            "Security Alert",
            "Your password was changed. If this was not you, contact support immediately.",
            NotificationType.SYSTEM
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserPreferencesDto getMyPreferences(String email) {
        User user = findByEmail(email);
        return toPreferencesDto(ensurePreferences(user));
    }

    @Override
    public UserPreferencesDto updateMyPreferences(String email, UpdateUserPreferencesRequest request) {
        User user = findByEmail(email);
        UserPreferences preferences = ensurePreferences(user);

        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            preferences.setLanguage(request.getLanguage().trim());
        }
        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            preferences.setCurrency(request.getCurrency().trim());
        }

        if (request.getNotifications() != null) {
            UserPreferences.NotificationPreferences target = preferences.getNotifications();
            NotificationPreferencesDto incoming = request.getNotifications();
            if (incoming.getBookings() != null) {
                target.setBookings(incoming.getBookings());
            }
            if (incoming.getMessages() != null) {
                target.setMessages(incoming.getMessages());
            }
            if (incoming.getMarketing() != null) {
                target.setMarketing(incoming.getMarketing());
            }
            if (incoming.getNews() != null) {
                target.setNews(incoming.getNews());
            }
        }

        if (request.getPrivacy() != null) {
            UserPreferences.PrivacyPreferences target = preferences.getPrivacy();
            PrivacyPreferencesDto incoming = request.getPrivacy();
            if (incoming.getShowProfile() != null) {
                target.setShowProfile(incoming.getShowProfile());
            }
            if (incoming.getShowActivity() != null) {
                target.setShowActivity(incoming.getShowActivity());
            }
            if (incoming.getAllowMessages() != null) {
                target.setAllowMessages(incoming.getAllowMessages());
            }
        }

        user.setPreferences(preferences);
        User updated = userRepository.save(user);
        return toPreferencesDto(ensurePreferences(updated));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> searchUsers(String query, String currentUserEmail) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.isEmpty()) {
            return List.of();
        }

        User currentUser = findByEmail(currentUserEmail);
        return userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(normalized, normalized)
                .stream()
                .filter(user -> !user.getId().equals(currentUser.getId()))
                .map(this::toDto)
                .toList();
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .isVerified(user.getIsVerified())
                .banned(user.getBanned())
                .avatar(user.getAvatar())
                .phone(user.getPhone())
                .bio(user.getBio())
                .city(user.getCity())
                .emailVerified(user.getEmailVerified())
                .phoneVerified(user.getPhoneVerified())
                .identityStatus(user.getIdentityStatus())
                .verificationLevel(user.getVerificationLevel())
                .rejectionReason(user.getRejectionReason())
                .governmentIdFiles(user.getGovernmentIdFiles())
                .otherAttachmentFiles(user.getOtherAttachmentFiles())
                .selfieFile(user.getSelfieFile())
                .identitySubmittedAt(user.getIdentitySubmittedAt())
                .trustScore(user.getTrustScore() == null ? 0 : user.getTrustScore())
                .preferences(toPreferencesDto(ensurePreferences(user)))
                .build();
    }

    private UserPreferences ensurePreferences(User user) {
        UserPreferences preferences = user.getPreferences();
        if (preferences == null) {
            preferences = new UserPreferences();
        }
        if (preferences.getNotifications() == null) {
            preferences.setNotifications(new UserPreferences.NotificationPreferences());
        }
        if (preferences.getPrivacy() == null) {
            preferences.setPrivacy(new UserPreferences.PrivacyPreferences());
        }
        if (preferences.getLanguage() == null || preferences.getLanguage().isBlank()) {
            preferences.setLanguage("Francais");
        }
        if (preferences.getCurrency() == null || preferences.getCurrency().isBlank()) {
            preferences.setCurrency("DT");
        }
        return preferences;
    }

    private UserPreferencesDto toPreferencesDto(UserPreferences preferences) {
        return UserPreferencesDto.builder()
                .language(preferences.getLanguage())
                .currency(preferences.getCurrency())
                .notifications(NotificationPreferencesDto.builder()
                        .bookings(preferences.getNotifications().getBookings())
                        .messages(preferences.getNotifications().getMessages())
                        .marketing(preferences.getNotifications().getMarketing())
                        .news(preferences.getNotifications().getNews())
                        .build())
                .privacy(PrivacyPreferencesDto.builder()
                        .showProfile(preferences.getPrivacy().getShowProfile())
                        .showActivity(preferences.getPrivacy().getShowActivity())
                        .allowMessages(preferences.getPrivacy().getAllowMessages())
                        .build())
                .build();
    }
}
