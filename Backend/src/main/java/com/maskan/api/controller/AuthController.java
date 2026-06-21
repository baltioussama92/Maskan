package com.maskan.api.controller;

import com.maskan.api.dto.AuthResponse;
import com.maskan.api.dto.LoginRequest;
import com.maskan.api.dto.RegisterRequest;
import com.maskan.api.dto.UserDto;
import com.maskan.api.dto.ForgotPasswordRequest;
import com.maskan.api.dto.VerifyPasswordOtpRequest;
import com.maskan.api.dto.ResetPasswordRequest;
import com.maskan.api.entity.EmailVerificationToken;
import com.maskan.api.repository.EmailVerificationTokenRepository;
import com.maskan.api.service.AuthService;
import com.maskan.api.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import com.maskan.api.exception.EmailDeliveryException;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${app.cors.allowed-origin:https://maskan-app.vercel.app}")
@RequiredArgsConstructor
public class AuthController {

    private static final long OTP_EXPIRY_MINUTES = 15;

    private final AuthService authService;
    private final EmailService emailService;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        String targetEmail = normalizeEmail(response.getUser() == null ? null : response.getUser().getEmail());

        if (StringUtils.hasText(targetEmail)) {
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
                emailService.sendOtpEmail(targetEmail, otpCode);
            } catch (EmailDeliveryException exception) {
                // If email delivery fails during registration, do not fail the whole request.
                // Clean up the token and log the failure so the user can request OTP later.
                emailVerificationTokenRepository.deleteByEmail(targetEmail);
                System.out.println("[AuthController] OTP email delivery failed for " + targetEmail + ": " + exception.getMessage());
                exception.printStackTrace();
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getCurrentUser(userDetails.getUsername()));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.getEmail());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyPasswordOtpRequest request) {
        try {
            authService.verifyPasswordOtp(request);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}

