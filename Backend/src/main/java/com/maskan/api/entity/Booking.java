package com.maskan.api.entity;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
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
@CompoundIndexes({
    @CompoundIndex(name = "booking_listing_status_dates", def = "{ 'listingId': 1, 'status': 1, 'checkInDate': 1, 'checkOutDate': 1 }"),
    @CompoundIndex(name = "booking_guest_status_checkout", def = "{ 'guestId': 1, 'status': 1, 'checkOutDate': 1 }")
})
public class Booking {

    @Id
    private String id;

    @NotNull
    @Indexed
    private String listingId;

    @NotNull
    @Indexed
    private String guestId;

    @NotNull
    @Indexed
    private LocalDate checkInDate;

    @NotNull
    @Indexed
    private LocalDate checkOutDate;

    @NotNull
    @Builder.Default
    @Indexed
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

    private BigDecimal refundAmount;

    private BigDecimal cancellationPenalty;

    private String cancellationType;

    private Instant cancelledAt;

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

