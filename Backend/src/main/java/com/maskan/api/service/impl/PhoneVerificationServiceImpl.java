package com.maskan.api.service.impl;

import com.maskan.api.dto.PhoneOtpSendResponse;
import com.maskan.api.dto.VerificationSummaryResponse;
import com.maskan.api.entity.User;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.PhoneVerificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PhoneVerificationServiceImpl implements PhoneVerificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PhoneVerificationServiceImpl.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long OTP_EXPIRY_MINUTES = 15;

    private final UserRepository userRepository;
    private final Map<String, PhoneOtpEntry> otpStore = new ConcurrentHashMap<>();

    public PhoneVerificationServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public PhoneOtpSendResponse sendOtp(User user, String phoneNumber) {
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        String normalizedPhone = normalizePhone(phoneNumber);
        if (!StringUtils.hasText(normalizedPhone)) {
            throw new IllegalArgumentException("Phone number is required");
        }

        String reqId = UUID.randomUUID().toString();
        String code = generateOtpCode();
        Instant expiresAt = Instant.now().plusSeconds(OTP_EXPIRY_MINUTES * 60);

        otpStore.put(reqId, new PhoneOtpEntry(user.getId(), normalizedPhone, code, expiresAt));
        LOGGER.info("Phone OTP generated for userId={} phone={}", user.getId(), maskPhone(normalizedPhone));
        return new PhoneOtpSendResponse(reqId, "OTP sent successfully");
    }

    @Override
    public VerificationSummaryResponse verifyOtp(User user, String reqId, String code) {
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        if (!StringUtils.hasText(reqId)) {
            throw new IllegalArgumentException("Request id is required");
        }

        PhoneOtpEntry entry = otpStore.get(reqId);
        if (entry == null || !entry.userId().equals(user.getId())) {
            throw new IllegalArgumentException("OTP expired");
        }

        if (entry.expiresAt().isBefore(Instant.now())) {
            otpStore.remove(reqId);
            throw new IllegalArgumentException("OTP expired");
        }

        if (!StringUtils.hasText(code) || !code.equals(entry.code())) {
            throw new IllegalArgumentException("OTP invalid");
        }

        user.setPhone(entry.phone());
        user.setPhoneVerified(true);
        applyDerivedVerificationLevel(user);

        User saved = userRepository.save(user);
        otpStore.remove(reqId);

        return toSummary(saved);
    }

    private String generateOtpCode() {
        int code = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    private String normalizePhone(String phoneNumber) {
        if (!StringUtils.hasText(phoneNumber)) {
            return "";
        }
        return phoneNumber.trim();
    }

    private String maskPhone(String phoneNumber) {
        if (!StringUtils.hasText(phoneNumber) || phoneNumber.length() < 4) {
            return "****";
        }
        String tail = phoneNumber.substring(phoneNumber.length() - 2);
        return "****" + tail;
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

    private record PhoneOtpEntry(String userId, String phone, String code, Instant expiresAt) {
    }
}
