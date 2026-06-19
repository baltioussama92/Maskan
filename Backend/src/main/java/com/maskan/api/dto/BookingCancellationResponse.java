package com.maskan.api.dto;

import com.maskan.api.entity.BookingStatus;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class BookingCancellationResponse {
    String bookingId;
    BookingStatus status;
    String cancellationType;
    BigDecimal totalPrice;
    BigDecimal refundAmount;
    BigDecimal penaltyAmount;
    int daysUntilCheckIn;
    int daysSinceReservation;
    int trustScorePenalty;
    Integer guestTrustScore;
    String message;
}
