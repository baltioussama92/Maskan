package com.maskan.api.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class PaymentMethodResponse {
    String id;
    String cardholderName;
    String brand;
    String last4;
    Integer expMonth;
    Integer expYear;
    Boolean isDefault;
    Instant createdAt;
}
