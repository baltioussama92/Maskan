package com.maskan.api.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "payment_methods")
public class PaymentMethod {

    @Id
    private String id;

    private String userId;

    private String cardholderName;

    private String brand;

    private String last4;

    private Integer expMonth;

    private Integer expYear;

    @Builder.Default
    private Boolean isDefault = Boolean.FALSE;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
