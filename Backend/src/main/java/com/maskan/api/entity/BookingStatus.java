package com.maskan.api.entity;

public enum BookingStatus {
    PENDING,
    AWAITING_PAYMENT,
    AWAITING_CHECKIN,
    PAID_AWAITING_CHECKIN,
    CONFIRMED,
    CANCELLED,
    REJECTED,
    COMPLETED
}

