package com.maskan.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PhoneOtpVerifyRequest {

    @NotBlank
    private String reqId;

    @NotBlank
    @Pattern(regexp = "\\d{6}", message = "OTP code must be exactly 6 digits")
    private String code;
}
