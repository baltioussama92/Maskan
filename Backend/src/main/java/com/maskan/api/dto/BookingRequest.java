package com.maskan.api.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Value;

import java.time.LocalDate;
import com.maskan.api.entity.BookingPaymentMethod;

@Value
public class BookingRequest {
    @NotNull
    String listingId;

    @NotNull
    @FutureOrPresent
    LocalDate checkInDate;

    @NotNull
    @FutureOrPresent
    LocalDate checkOutDate;

    @Min(1)
    Integer guests;

    BookingPaymentMethod paymentMethod;

    public String getPropertyId() {
        return listingId;
    }

    public LocalDate getStartDate() {
        return checkInDate;
    }

    public LocalDate getEndDate() {
        return checkOutDate;
    }
}

