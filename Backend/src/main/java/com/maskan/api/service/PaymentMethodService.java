package com.maskan.api.service;

import com.maskan.api.dto.PaymentMethodRequest;
import com.maskan.api.dto.PaymentMethodResponse;

import java.util.List;

public interface PaymentMethodService {
    List<PaymentMethodResponse> listMine(String email);
    PaymentMethodResponse create(String email, PaymentMethodRequest request);
    PaymentMethodResponse setDefault(String email, String paymentMethodId);
    void delete(String email, String paymentMethodId);
}
