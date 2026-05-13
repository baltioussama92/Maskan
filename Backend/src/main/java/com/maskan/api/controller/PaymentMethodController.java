package com.maskan.api.controller;

import com.maskan.api.dto.PaymentMethodRequest;
import com.maskan.api.dto.PaymentMethodResponse;
import com.maskan.api.service.PaymentMethodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payment-methods")
@CrossOrigin(origins = "${app.cors.allowed-origin:http://localhost:5173}")
@RequiredArgsConstructor
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PaymentMethodResponse>> listMine(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(paymentMethodService.listMine(principal.getUsername()));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaymentMethodResponse> create(@AuthenticationPrincipal UserDetails principal,
                                                        @Valid @RequestBody PaymentMethodRequest request) {
        return ResponseEntity.ok(paymentMethodService.create(principal.getUsername(), request));
    }

    @PatchMapping("/{id}/default")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaymentMethodResponse> setDefault(@AuthenticationPrincipal UserDetails principal,
                                                            @PathVariable String id) {
        return ResponseEntity.ok(paymentMethodService.setDefault(principal.getUsername(), id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails principal,
                                       @PathVariable String id) {
        paymentMethodService.delete(principal.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
