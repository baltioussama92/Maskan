package com.maskan.api.controller;

import com.maskan.api.dto.EmailRequest;
import com.maskan.api.dto.VerificationSummaryResponse;
import com.maskan.api.dto.VerifyOtpRequest;
import com.maskan.api.entity.EmailVerificationToken;
import com.maskan.api.entity.User;
import com.maskan.api.exception.EmailDeliveryException;
import com.maskan.api.exception.NotFoundException;
import com.maskan.api.repository.EmailVerificationTokenRepository;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/verifications/email")
@RequiredArgsConstructor
public class EmailVerificationController {

    private static final long OTP_EXPIRY_MINUTES = 15;

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final EmailService emailService;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody EmailRequest request
    ) {
        try {
            String authenticatedEmail = normalizeEmail(userDetails == null ? null : userDetails.getUsername());
            if (!StringUtils.hasText(authenticatedEmail)) {
                throw new UsernameNotFoundException("Authenticated user not found");
            }

            String targetEmail = normalizeEmail(request == null ? null : request.getEmail());
            if (!StringUtils.hasText(targetEmail)) {
                throw new IllegalArgumentException("Email non trouvé");
            }

            if (!authenticatedEmail.equals(targetEmail)) {
                throw new NotFoundException("Email non trouvé");
            }

            if (!userRepository.existsByEmail(targetEmail)) {
                throw new NotFoundException("Email non trouvé");
            }

            emailVerificationTokenRepository.deleteByEmail(targetEmail);

            String otpCode = emailService.generateOtpCode();
            Instant expiryDate = Instant.now().plusSeconds(OTP_EXPIRY_MINUTES * 60);

            EmailVerificationToken token = EmailVerificationToken.builder()
                    .email(targetEmail)
                    .otpCode(otpCode)
                    .expiryDate(expiryDate)
                    .build();

            emailVerificationTokenRepository.save(token);

            try {
                emailService.sendOtpHtmlEmail(targetEmail, otpCode);
            } catch (EmailDeliveryException exception) {
                emailVerificationTokenRepository.deleteByEmail(targetEmail);
                System.out.println("[EmailVerification] OTP email delivery failed for " + targetEmail + ": " + exception.getMessage());
                exception.printStackTrace();

                Map<String, Object> body = new LinkedHashMap<>();
                body.put("message", "Le serveur de messagerie a échoué à envoyer l'e-mail. Veuillez réessayer.");
                body.put("email", targetEmail);
                return ResponseEntity.badRequest().body(body);
            }

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("message", "OTP envoyé avec succès");
            body.put("email", targetEmail);
            return ResponseEntity.ok(body);
        } catch (NotFoundException exception) {
            throw exception;
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            String message = StringUtils.hasText(exception.getMessage()) ? exception.getMessage() : "Erreur inconnue";
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("message", "Erreur envoi OTP [" + exception.getClass().getSimpleName() + "]: " + message);
            body.put("errorType", exception.getClass().getName());
            return ResponseEntity.internalServerError().body(body);
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<VerificationSummaryResponse> verifyOtp(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        User user = getCurrentUser(userDetails);
        String email = normalizeEmail(user.getEmail());

        emailVerificationTokenRepository.deleteByExpiryDateBefore(Instant.now());

        EmailVerificationToken token = emailVerificationTokenRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Code expiré"));

        if (token.getExpiryDate() == null || token.getExpiryDate().isBefore(Instant.now())) {
            emailVerificationTokenRepository.deleteByEmail(email);
            throw new IllegalArgumentException("Code expiré");
        }

        // Debug logs: show stored vs received OTP for demo troubleshooting
        System.out.println("[EmailVerification] verifying for email=" + email);
        System.out.println("[EmailVerification] stored OTP=" + token.getOtpCode());
        System.out.println("[EmailVerification] received OTP=" + request.getOtp());

        if (request.getOtp() == null || !request.getOtp().equals(token.getOtpCode())) {
            throw new IllegalArgumentException("Code incorrect");
        }

        user.setEmailVerified(true);
        applyDerivedVerificationLevel(user);
        userRepository.save(user);

        emailVerificationTokenRepository.deleteByEmail(email);

        return ResponseEntity.ok(toSummary(user));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
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
