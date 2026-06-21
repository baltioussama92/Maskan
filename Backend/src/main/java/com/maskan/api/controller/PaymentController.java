package com.maskan.api.controller;

import com.maskan.api.dto.PaymentCheckoutResponse;
import com.maskan.api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "${app.cors.allowed-origin:https://maskan-app.vercel.app}")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/checkout/{bookingId}")
    @PreAuthorize("hasAnyRole('GUEST','TENANT')")
    public ResponseEntity<PaymentCheckoutResponse> checkout(@PathVariable String bookingId,
                                                            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(paymentService.checkout(bookingId, principal.getUsername()));
    }
}
