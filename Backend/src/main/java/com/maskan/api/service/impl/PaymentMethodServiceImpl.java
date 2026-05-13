package com.maskan.api.service.impl;

import com.maskan.api.dto.PaymentMethodRequest;
import com.maskan.api.dto.PaymentMethodResponse;
import com.maskan.api.entity.PaymentMethod;
import com.maskan.api.entity.User;
import com.maskan.api.exception.NotFoundException;
import com.maskan.api.repository.PaymentMethodRepository;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.PaymentMethodService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentMethodServiceImpl implements PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PaymentMethodResponse> listMine(String email) {
        User user = getUserByEmail(email);
        return paymentMethodRepository.findByUserId(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public PaymentMethodResponse create(String email, PaymentMethodRequest request) {
        User user = getUserByEmail(email);
        validateExpiry(request.getExpMonth(), request.getExpYear());

        boolean hasDefault = paymentMethodRepository.findByUserIdAndIsDefaultTrue(user.getId()).isPresent();
        boolean shouldDefault = Boolean.TRUE.equals(request.getIsDefault()) || !hasDefault;

        if (shouldDefault) {
            unsetDefaults(user.getId());
        }

        PaymentMethod method = PaymentMethod.builder()
                .userId(user.getId())
                .cardholderName(request.getCardholderName().trim())
                .brand(request.getBrand().trim())
                .last4(request.getLast4().trim())
                .expMonth(request.getExpMonth())
                .expYear(request.getExpYear())
                .isDefault(shouldDefault)
                .build();

        return toResponse(paymentMethodRepository.save(method));
    }

    @Override
    public PaymentMethodResponse setDefault(String email, String paymentMethodId) {
        User user = getUserByEmail(email);
        PaymentMethod method = paymentMethodRepository.findByIdAndUserId(paymentMethodId, user.getId())
                .orElseThrow(() -> new NotFoundException("Payment method not found"));

        unsetDefaults(user.getId());
        method.setIsDefault(Boolean.TRUE);
        return toResponse(paymentMethodRepository.save(method));
    }

    @Override
    public void delete(String email, String paymentMethodId) {
        User user = getUserByEmail(email);
        PaymentMethod method = paymentMethodRepository.findByIdAndUserId(paymentMethodId, user.getId())
                .orElseThrow(() -> new NotFoundException("Payment method not found"));

        paymentMethodRepository.delete(method);

        if (Boolean.TRUE.equals(method.getIsDefault())) {
            paymentMethodRepository.findByUserId(user.getId())
                    .stream()
                    .findFirst()
                    .ifPresent((next) -> {
                        next.setIsDefault(Boolean.TRUE);
                        paymentMethodRepository.save(next);
                    });
        }
    }

    private void unsetDefaults(String userId) {
        paymentMethodRepository.findByUserId(userId).forEach(method -> {
            if (Boolean.TRUE.equals(method.getIsDefault())) {
                method.setIsDefault(Boolean.FALSE);
                paymentMethodRepository.save(method);
            }
        });
    }

    private void validateExpiry(Integer month, Integer year) {
        if (month == null || year == null) {
            throw new IllegalArgumentException("expMonth and expYear are required");
        }
        YearMonth expiry = YearMonth.of(year, month);
        if (expiry.isBefore(YearMonth.now())) {
            throw new IllegalArgumentException("Payment method is expired");
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private PaymentMethodResponse toResponse(PaymentMethod method) {
        return PaymentMethodResponse.builder()
                .id(method.getId())
                .cardholderName(method.getCardholderName())
                .brand(method.getBrand())
                .last4(method.getLast4())
                .expMonth(method.getExpMonth())
                .expYear(method.getExpYear())
                .isDefault(method.getIsDefault())
                .createdAt(method.getCreatedAt())
                .build();
    }
}
