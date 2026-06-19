package com.maskan.api.service;

import com.maskan.api.dto.PaymentCheckoutResponse;

public interface PaymentService {
    PaymentCheckoutResponse checkout(String bookingId, String email);
    PaymentCheckoutResponse payEscrow(String bookingId, String email);
}
