package com.maskan.api.entity;

public enum BookingStatus {
    PENDING,
    AWAITING_PAYMENT,
    AWAITING_CHECKIN,
    PAID_AWAITING_CHECKIN,
    CONFIRMED,
    ACCEPTED,      // Legacy status stored in DB — treated as CONFIRMED
    CANCELLED,
    REJECTED,
    COMPLETED
}

