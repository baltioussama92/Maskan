package com.maskan.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Value;

@Value
public class PaymentMethodRequest {
    @NotBlank
    String cardholderName;

    @NotBlank
    String brand;

    @NotBlank
    @Size(min = 4, max = 4, message = "last4 must be 4 digits")
    String last4;

    @Min(1)
    @Max(12)
    Integer expMonth;

    @Min(2020)
    Integer expYear;

    Boolean isDefault;
}
