package com.maskan.api.entity;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    @NotNull
    private String listingId;

    @NotNull
    private String guestId;

    @NotNull
    private LocalDate checkInDate;

    @NotNull
    private LocalDate checkOutDate;

    @NotNull
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Builder.Default
    private BookingPaymentMethod paymentMethod = BookingPaymentMethod.CARD;
    
    @Builder.Default
    private Integer guests = 1;
    
    @Builder.Default
    private Instant createdAt = Instant.now();

    private BigDecimal totalPrice;

    private String stripePaymentIntentId;

    private String checkInSecretCode;

    public LocalDate getStartDate() {
        return checkInDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.checkInDate = startDate;
    }

    public LocalDate getEndDate() {
        return checkOutDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.checkOutDate = endDate;
    }
}

