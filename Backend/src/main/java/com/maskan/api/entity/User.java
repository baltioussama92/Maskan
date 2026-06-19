package com.maskan.api.entity;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @NotBlank
    private String name;

    private String username;

    private String phone;

    private String bio;

    private String city;

    @Email
    @NotBlank
    @Indexed(unique = true)
    private String email;

    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private Role role;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Boolean isVerified = Boolean.FALSE;

    @Builder.Default
    private Boolean banned = Boolean.FALSE;

    @Builder.Default
    private List<String> wishlistListingIds = List.of();

    @Builder.Default
    private Boolean emailVerified = Boolean.FALSE;

    @Builder.Default
    private Boolean phoneVerified = Boolean.FALSE;

    @Builder.Default
    private String identityStatus = "not_verified";

    @Builder.Default
    private Integer verificationLevel = 0;

    @Builder.Default
    private Integer trustScore = 0;

    @Builder.Default
    private String avatar = "";

    @Builder.Default
    private UserPreferences preferences = new UserPreferences();

    private String rejectionReason;

    @Builder.Default
    private List<String> governmentIdFiles = List.of();

    @Builder.Default
    private List<String> otherAttachmentFiles = List.of();

    private String selfieFile;

    private Instant identitySubmittedAt;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFullName() {
        return name;
    }

    public void setFullName(String fullName) {
        this.name = fullName;
    }
}

