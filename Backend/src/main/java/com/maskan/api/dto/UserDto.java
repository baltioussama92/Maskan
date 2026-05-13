package com.maskan.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.maskan.api.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;

@Value
@Builder
public class UserDto {
    String id;

    @NotBlank
    String fullName;

    String username;

    @Email
    @NotBlank
    String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password;

    Role role;

    Instant createdAt;
    Boolean isVerified;
    Boolean banned;
    String avatar;
    String phone;
    String bio;
    String city;
    Boolean emailVerified;
    Boolean phoneVerified;
    String identityStatus;
    Integer verificationLevel;
    String rejectionReason;
    List<String> governmentIdFiles;
    List<String> otherAttachmentFiles;
    String selfieFile;
    Instant identitySubmittedAt;
    UserPreferencesDto preferences;
}

