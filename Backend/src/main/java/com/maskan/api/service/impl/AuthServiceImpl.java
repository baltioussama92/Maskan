package com.maskan.api.service.impl;

import com.maskan.api.dto.AuthResponse;
import com.maskan.api.dto.LoginRequest;
import com.maskan.api.dto.RegisterRequest;
import com.maskan.api.dto.UserDto;
import com.maskan.api.entity.Role;
import com.maskan.api.entity.User;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.repository.EmailVerificationTokenRepository;
import com.maskan.api.security.JwtService;
import com.maskan.api.service.AuthService;
import com.maskan.api.service.EmailService;
import com.maskan.api.entity.EmailVerificationToken;
import com.maskan.api.exception.AccountBannedException;
import com.maskan.api.exception.EmailDeliveryException;
import com.maskan.api.dto.VerifyPasswordOtpRequest;
import com.maskan.api.dto.ResetPasswordRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Override
        public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

                Role role = request.getRole() == null ? Role.GUEST : request.getRole();
                if (role == Role.ADMIN) {
                        throw new IllegalArgumentException("ADMIN role cannot be assigned during self-registration");
                }

                if (request.getPassword() == null || request.getPassword().isBlank()) {
                        throw new IllegalArgumentException("Password is required");
                }

                boolean verifiedByDefault = false;

        User user = User.builder()
                                .name(request.getFullName())
                                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                                .role(role)
                                .isVerified(verifiedByDefault)
                                .createdAt(Instant.now())
                .build();

        User saved = userRepository.save(user);
        UserDetails principal = toUserDetails(saved);
        String token = jwtService.generateToken(principal);

        return AuthResponse.builder()
                .token(token)
                .role(saved.getRole())
                .user(toDto(saved))
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (Boolean.TRUE.equals(user.getBanned())) {
            throw new AccountBannedException("Your account is banned.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails principal = toUserDetails(user);
        String token = jwtService.generateToken(principal);

        return AuthResponse.builder()
                .token(token)
                .role(user.getRole())
                .user(toDto(user))
                .build();
    }

    private UserDetails toUserDetails(User user) {
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();
    }

    @Override
    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toDto(user);
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
                .build();
    }

    @Override
    public void forgotPassword(String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        
        if (!userRepository.existsByEmail(normalizedEmail)) {
            // We throw an exception that the controller can catch and turn into a 404
            throw new IllegalArgumentException("Account not found");
        }

        emailVerificationTokenRepository.deleteByEmail(normalizedEmail);

        String otpCode = emailService.generateOtpCode();
        // 15 minutes expiry to match standard
        Instant expiryDate = Instant.now().plusSeconds(15 * 60);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .email(normalizedEmail)
                .otpCode(otpCode)
                .expiryDate(expiryDate)
                .build();

        emailVerificationTokenRepository.save(token);

        try {
            emailService.sendOtpEmail(normalizedEmail, otpCode);
        } catch (EmailDeliveryException exception) {
            emailVerificationTokenRepository.deleteByEmail(normalizedEmail);
            throw new RuntimeException("Failed to send OTP email: " + exception.getMessage(), exception);
        }
    }

    @Override
    public boolean verifyPasswordOtp(VerifyPasswordOtpRequest request) {
        String normalizedEmail = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        
        EmailVerificationToken token = emailVerificationTokenRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired OTP"));

        if (token.getExpiryDate().isBefore(Instant.now())) {
            emailVerificationTokenRepository.delete(token);
            throw new IllegalArgumentException("OTP has expired");
        }

        if (!token.getOtpCode().equals(request.getOtpCode())) {
            throw new IllegalArgumentException("Invalid OTP code");
        }

        return true;
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        
        // Re-verify the OTP just to be safe
        EmailVerificationToken token = emailVerificationTokenRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired OTP"));

        if (token.getExpiryDate().isBefore(Instant.now())) {
            emailVerificationTokenRepository.delete(token);
            throw new IllegalArgumentException("OTP has expired");
        }

        if (!token.getOtpCode().equals(request.getOtpCode())) {
            throw new IllegalArgumentException("Invalid OTP code");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        emailVerificationTokenRepository.delete(token);
        
        // Optional: Send password changed alert
        try {
            emailService.sendPasswordChangedAlert(normalizedEmail);
        } catch (Exception e) {
            // Non-critical, ignore
        }
    }
}

