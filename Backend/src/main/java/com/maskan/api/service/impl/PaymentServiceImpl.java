package com.maskan.api.service.impl;

import com.maskan.api.dto.PaymentCheckoutResponse;
import com.maskan.api.entity.BookingPaymentMethod;
import com.maskan.api.entity.Booking;
import com.maskan.api.entity.BookingStatus;
import com.maskan.api.entity.User;
import com.maskan.api.exception.NotFoundException;
import com.maskan.api.repository.BookingRepository;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    @Override
    public PaymentCheckoutResponse checkout(String bookingId, String email) {
        return payEscrow(bookingId, email);
    }

    @Override
    public PaymentCheckoutResponse payEscrow(String bookingId, String email) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        User current = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!current.getId().equals(booking.getGuestId())) {
            throw new IllegalArgumentException("Not authorized to pay this booking");
        }

        if (booking.getPaymentMethod() == BookingPaymentMethod.CASH) {
            throw new IllegalArgumentException("Cash reservations must be paid directly to the host at check-in");
        }

        if (booking.getStatus() != BookingStatus.AWAITING_PAYMENT) {
            throw new IllegalArgumentException("Booking is not awaiting payment");
        }

        String paymentIntentId = "pi_sim_" + UUID.randomUUID().toString().replace("-", "");
        String checkInSecretCode = UUID.randomUUID().toString();

        booking.setStripePaymentIntentId(paymentIntentId);
        booking.setCheckInSecretCode(checkInSecretCode);
        booking.setStatus(BookingStatus.PAID_AWAITING_CHECKIN);

        Booking saved = bookingRepository.save(booking);

        return PaymentCheckoutResponse.builder()
                .bookingId(saved.getId())
                .status(saved.getStatus())
                .stripePaymentIntentId(saved.getStripePaymentIntentId())
                .checkInSecretCode(saved.getCheckInSecretCode())
                .message("Payment successful. QR check-in secret generated.")
                .build();
    }
}
