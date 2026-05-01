package com.maskan.api.service.impl;

import com.maskan.api.dto.AuthResponse;
import com.maskan.api.dto.LoginRequest;
import com.maskan.api.dto.RegisterRequest;
import com.maskan.api.dto.UserDto;
import com.maskan.api.entity.Role;
import com.maskan.api.entity.User;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.security.JwtService;
import com.maskan.api.service.AuthService;
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

                boolean verifiedByDefault = role == Role.GUEST;

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
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

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
}

