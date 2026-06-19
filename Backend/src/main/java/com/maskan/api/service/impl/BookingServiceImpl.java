package com.maskan.api.service.impl;

import com.maskan.api.dto.BookingPropertyInfo;
import com.maskan.api.dto.BookingRequest;
import com.maskan.api.dto.BookingResponse;
import com.maskan.api.dto.BookingStatusUpdateRequest;
import com.maskan.api.dto.CheckInVerificationResponse;
import com.maskan.api.dto.BookedDateRangeResponse;
import com.maskan.api.dto.BookingCancellationResponse;
import com.maskan.api.dto.UnavailableDateRangeResponse;
import com.maskan.api.dto.VerifyCheckInRequest;
import com.maskan.api.entity.Booking;
import com.maskan.api.entity.BookingPaymentMethod;
import com.maskan.api.entity.BookingStatus;
import com.maskan.api.entity.NotificationType;
import com.maskan.api.entity.Property;
import com.maskan.api.entity.Role;
import com.maskan.api.entity.User;
import com.maskan.api.exception.NotFoundException;
import com.maskan.api.repository.BookingRepository;
import com.maskan.api.repository.PropertyRepository;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.BookingService;
import com.maskan.api.service.NotificationService;
import com.maskan.api.service.TrustScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Comparator;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {

    private static final List<BookingStatus> BLOCKING_STATUSES = List.of(
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.ACCEPTED,
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.AWAITING_CHECKIN,
            BookingStatus.PAID_AWAITING_CHECKIN,
            BookingStatus.COMPLETED
    );

    private static final List<BookingStatus> CANCELLABLE_STATUSES = List.of(
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.ACCEPTED,
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.AWAITING_CHECKIN,
            BookingStatus.PAID_AWAITING_CHECKIN
    );

    private static final int FREE_CANCELLATION_DAYS = 10;
    private static final BigDecimal LATE_CANCEL_PENALTY_RATE = new BigDecimal("0.05");

    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final TrustScoreService trustScoreService;

    @Override
    public BookingResponse createBooking(BookingRequest request, String email) {
        if (!request.getCheckOutDate().isAfter(request.getCheckInDate())) {
            throw new IllegalArgumentException("Check-out date must be after check-in date");
        }

        Property property = propertyRepository.findById(request.getListingId())
                .orElseThrow(() -> new NotFoundException("Property not found"));
        User user = getUserByEmail(email);

        ensureGuestHasNoActiveConfirmedBooking(user.getId());

        ensureNoOverlapForStatuses(
            property.getId(),
            request.getCheckInDate(),
            request.getCheckOutDate(),
            null,
            BLOCKING_STATUSES
        );

        Booking booking = Booking.builder()
            .listingId(property.getId())
            .guestId(user.getId())
            .checkInDate(request.getCheckInDate())
            .checkOutDate(request.getCheckOutDate())
            .guests(request.getGuests() == null || request.getGuests() < 1 ? 1 : request.getGuests())
            .totalPrice(computeTotalPrice(property, request.getCheckInDate(), request.getCheckOutDate(), request.getGuests()))
                .status(BookingStatus.PENDING)
                .paymentMethod(request.getPaymentMethod() == null ? BookingPaymentMethod.CARD : request.getPaymentMethod())
                .build();

        Booking saved = bookingRepository.save(booking);
        String guestName = user.getName() == null || user.getName().isBlank() ? "Guest" : user.getName();
        notificationService.sendInternalNotification(
            property.getHostId(),
            "New Booking Request",
            "New Booking Request from " + guestName,
            NotificationType.BOOKING
        );
        return toResponse(saved, true);
    }

    @Override
    public BookingResponse updateStatus(String bookingId, BookingStatusUpdateRequest request, String email) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        User current = getUserByEmail(email);

        boolean isAdmin = current.getRole() == Role.ADMIN;
        if (!isAdmin) {
            if (current.getRole() != Role.HOST) {
                throw new IllegalArgumentException("Not authorized to update this booking");
            }

            Property property = propertyRepository.findById(booking.getListingId())
                    .orElseThrow(() -> new NotFoundException("Property not found"));

            if (!current.getId().equals(property.getHostId())) {
                throw new IllegalArgumentException("Not authorized to update this booking");
            }
        }

        if (request.getStatus() == BookingStatus.CONFIRMED) {
            ensureNoOverlapForStatuses(
                    booking.getListingId(),
                    booking.getCheckInDate(),
                    booking.getCheckOutDate(),
                    booking.getId(),
                BLOCKING_STATUSES
            );
        }

        BookingStatus nextStatus = request.getStatus();
        if (nextStatus == BookingStatus.CONFIRMED) {
            if (booking.getPaymentMethod() == BookingPaymentMethod.CASH) {
                nextStatus = BookingStatus.AWAITING_CHECKIN;
                if (booking.getCheckInSecretCode() == null || booking.getCheckInSecretCode().isBlank()) {
                    booking.setCheckInSecretCode(UUID.randomUUID().toString());
                }
            } else {
                nextStatus = BookingStatus.AWAITING_PAYMENT;
            }
        }

        booking.setStatus(nextStatus);
        Booking saved = bookingRepository.save(booking);

        if (request.getStatus() == BookingStatus.CONFIRMED || request.getStatus() == BookingStatus.REJECTED) {
            String listingTitle = null;
            Property listing = propertyRepository.findById(booking.getListingId()).orElse(null);
            if (listing != null && listing.getTitle() != null && !listing.getTitle().isBlank()) {
            listingTitle = listing.getTitle();
            }

            String title = request.getStatus() == BookingStatus.CONFIRMED
                ? "Booking Accepted"
                : "Booking Rejected";
            String message = request.getStatus() == BookingStatus.CONFIRMED
                ? "Your booking request was accepted"
                : "Your booking request was rejected";
            if (listingTitle != null) {
            message = message + " for " + listingTitle;
            }

            notificationService.sendInternalNotification(
                booking.getGuestId(),
                title,
                message,
                NotificationType.BOOKING
            );
        }
        return toResponse(saved, true);
    }

    @Override
    public void cancelBooking(String bookingId, String email) {
        cancelReservation(bookingId, email);
    }

    @Override
    public BookingCancellationResponse cancelReservation(String bookingId, String email) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        User current = getUserByEmail(email);

        boolean isAdmin = current.getRole() == Role.ADMIN;
        boolean isBookingGuest = current.getId().equals(booking.getGuestId());
        if (!isAdmin && !isBookingGuest) {
            throw new IllegalArgumentException("Not authorized to cancel this booking");
        }

        if (!CANCELLABLE_STATUSES.contains(booking.getStatus())) {
            throw new IllegalArgumentException("This booking cannot be cancelled in its current state");
        }

        if (booking.getCheckInDate() == null) {
            throw new IllegalArgumentException("Booking check-in date is missing");
        }

        LocalDate today = LocalDate.now();
        long daysUntilCheckIn = java.time.temporal.ChronoUnit.DAYS.between(today, booking.getCheckInDate());
        if (daysUntilCheckIn < 0) {
            throw new IllegalArgumentException("Cannot cancel a booking that has already started");
        }

        Instant reservationCreatedAt = booking.getCreatedAt() != null ? booking.getCreatedAt() : Instant.now();
        LocalDate reservationDate = reservationCreatedAt
                .atZone(java.time.ZoneId.systemDefault())
                .toLocalDate();
        long daysSinceReservation = java.time.temporal.ChronoUnit.DAYS.between(reservationDate, today);

        BigDecimal totalPrice = booking.getTotalPrice() == null ? BigDecimal.ZERO : booking.getTotalPrice();
        String cancellationType;
        BigDecimal penaltyAmount;
        BigDecimal refundAmount;
        int trustScorePenalty = 0;
        String message;

        if (daysSinceReservation <= FREE_CANCELLATION_DAYS) {
            cancellationType = "FREE";
            penaltyAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            refundAmount = totalPrice.setScale(2, RoundingMode.HALF_UP);
            message = "Cancellation approved within the 10-day grace period. 100% refund processed.";
        } else {
            cancellationType = "TAXED";
            penaltyAmount = totalPrice.multiply(LATE_CANCEL_PENALTY_RATE).setScale(2, RoundingMode.HALF_UP);
            refundAmount = totalPrice.subtract(penaltyAmount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            trustScorePenalty = TrustScoreService.LATE_CANCEL_PENALTY;
            message = "Cancellation after the 10-day grace period. A 5% penalty was applied and your trust score was reduced.";
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationType(cancellationType);
        booking.setCancellationPenalty(penaltyAmount);
        booking.setRefundAmount(refundAmount);
        booking.setCancelledAt(Instant.now());
        bookingRepository.save(booking);

        User guest = userRepository.findById(booking.getGuestId()).orElse(null);
        Integer guestTrustScore = guest == null ? null : trustScoreService.getScore(guest);
        if (guest != null && trustScorePenalty > 0) {
            guestTrustScore = trustScoreService.applyDelta(guest, -trustScorePenalty);
        }

        notificationService.sendInternalNotification(
                booking.getGuestId(),
                "Booking Cancelled",
                message,
                NotificationType.BOOKING
        );

        return BookingCancellationResponse.builder()
                .bookingId(booking.getId())
                .status(booking.getStatus())
                .cancellationType(cancellationType)
                .totalPrice(totalPrice.setScale(2, RoundingMode.HALF_UP))
                .refundAmount(refundAmount)
                .penaltyAmount(penaltyAmount)
                .daysUntilCheckIn((int) daysUntilCheckIn)
                .daysSinceReservation((int) daysSinceReservation)
                .trustScorePenalty(trustScorePenalty)
                .guestTrustScore(guestTrustScore)
                .message(message)
                .build();
    }

    @Override
    public CheckInVerificationResponse verifyCheckIn(String bookingId, VerifyCheckInRequest request, String email) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        User host = getUserByEmail(email);
        if (host.getRole() != Role.HOST) {
            throw new IllegalArgumentException("Not authorized to verify check-in");
        }

        Property property = propertyRepository.findById(booking.getListingId())
                .orElseThrow(() -> new NotFoundException("Property not found"));

        if (!host.getId().equals(property.getHostId())) {
            throw new IllegalArgumentException("Not authorized to verify this booking");
        }

        if (booking.getStatus() != BookingStatus.PAID_AWAITING_CHECKIN
            && booking.getStatus() != BookingStatus.AWAITING_CHECKIN) {
            throw new IllegalArgumentException("Booking is not ready for check-in verification");
        }

        if (booking.getCheckInSecretCode() == null || !booking.getCheckInSecretCode().equals(request.getSecretCode())) {
            throw new IllegalArgumentException("Invalid check-in secret code");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        Booking saved = bookingRepository.save(booking);

        User guest = userRepository.findById(booking.getGuestId()).orElse(null);
        if (guest != null) {
            trustScoreService.applyDelta(guest, TrustScoreService.CHECKIN_BONUS);
        }
        trustScoreService.applyDelta(host, TrustScoreService.CHECKIN_BONUS);

        boolean isCash = booking.getPaymentMethod() == BookingPaymentMethod.CASH;
        String message = isCash
                ? "Check-in verified successfully. Cash payment recorded."
                : "Check-in verified successfully. Payout triggered.";

        if (isCash) {
            notificationService.sendInternalNotification(
                booking.getGuestId(),
                "Cash Payment Recorded",
                "Your cash payment has been confirmed during check-in.",
                NotificationType.PAYMENT
            );
            notificationService.sendInternalNotification(
                property.getHostId(),
                "Cash Payment Recorded",
                "Cash payment received and check-in validated.",
                NotificationType.PAYMENT
            );
        }

        return CheckInVerificationResponse.builder()
                .bookingId(saved.getId())
                .status(saved.getStatus())
            .message(message)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getMyBookings(String email, Pageable pageable) {
        User user = getUserByEmail(email);
        Page<Booking> page = bookingRepository.findByGuestId(user.getId(), pageable);
        return toPagedResponses(page, true);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getOwnerBookings(String email, Pageable pageable) {
        User owner = getUserByEmail(email);

        if (owner.getRole() == Role.ADMIN) {
            Page<Booking> page = bookingRepository.findAll(pageable);
            return toPagedResponses(page, false);
        }

        if (owner.getRole() != Role.HOST) {
            throw new IllegalArgumentException("Not authorized to view owner bookings");
        }

        List<String> ownerPropertyIds = propertyRepository.findByHostId(owner.getId()).stream()
                .map(Property::getId)
                .collect(Collectors.toList());

        if (ownerPropertyIds.isEmpty()) {
            return Page.empty(pageable);
        }

        Page<Booking> page = bookingRepository.findByListingIdIn(ownerPropertyIds, pageable);
        return toPagedResponses(page, false);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(Pageable pageable) {
        Page<Booking> page = bookingRepository.findAll(pageable);
        return toPagedResponses(page, false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnavailableDateRangeResponse> getUnavailableDateRangesForListing(String listingId) {
        return getBlockingBookings(listingId).stream()
                .map(booking -> UnavailableDateRangeResponse.builder()
                        .checkInDate(booking.getCheckInDate())
                        .checkOutDate(booking.getCheckOutDate())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookedDateRangeResponse> getBookedDateRangesForProperty(String propertyId) {
        propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NotFoundException("Property not found"));

        return getBlockingBookings(propertyId).stream()
                .map(booking -> BookedDateRangeResponse.builder()
                        .startDate(booking.getCheckInDate())
                        .endDate(booking.getCheckOutDate())
                        .build())
                .toList();
    }

    private List<Booking> getBlockingBookings(String listingId) {
        return bookingRepository.findByListingIdAndStatusIn(listingId, BLOCKING_STATUSES).stream()
                .filter(booking -> booking.getCheckInDate() != null && booking.getCheckOutDate() != null)
                .sorted(Comparator.comparing(Booking::getCheckInDate))
                .toList();
    }

    private BookingResponse toResponse(Booking booking, boolean includeSecretCode) {
        Property listing = propertyRepository.findById(booking.getListingId()).orElse(null);
        BigDecimal totalPrice = booking.getTotalPrice();
        if (totalPrice == null && listing != null) {
            totalPrice = computeTotalPrice(listing, booking.getCheckInDate(), booking.getCheckOutDate(), booking.getGuests());
        }
        if (totalPrice == null) {
            totalPrice = BigDecimal.ZERO;
        }
        
        // Fetch guest info
        User guest = userRepository.findById(booking.getGuestId()).orElse(null);

        BookingPropertyInfo propertyInfo = listing == null ? null : BookingPropertyInfo.builder()
            .title(listing.getTitle())
            .location(listing.getLocation())
            .image(listing.getImages() != null && !listing.getImages().isEmpty() ? listing.getImages().get(0) : null)
            .build();

        return BookingResponse.builder()
                .id(booking.getId())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .status(booking.getStatus())
                .listingId(booking.getListingId())
                .guestId(booking.getGuestId())
            .guests(booking.getGuests())
            .guestCount(booking.getGuests())
            .totalPrice(totalPrice)
            .createdAt(booking.getCreatedAt())
            .listingTitle(listing != null ? listing.getTitle() : null)
            .listingLocation(listing != null ? listing.getLocation() : null)
            .listingImage(listing != null && listing.getImages() != null && !listing.getImages().isEmpty() ? listing.getImages().get(0) : null)
            .property(propertyInfo)
            .guestEmail(guest != null ? guest.getEmail() : null)
            .guestName(guest != null ? guest.getName() : null)
            .stripePaymentIntentId(booking.getStripePaymentIntentId())
            .checkInSecretCode(includeSecretCode ? booking.getCheckInSecretCode() : null)
            .paymentMethod(booking.getPaymentMethod())
                .build();
    }

    private Page<BookingResponse> toPagedResponses(Page<Booking> page, boolean includeSecretCode) {
        if (page == null || page.isEmpty()) {
            return Page.empty(page == null ? Pageable.unpaged() : page.getPageable());
        }

        List<Booking> bookings = page.getContent();
        Map<String, Property> listingsById = fetchListingsById(bookings);
        Map<String, User> guestsById = fetchUsersById(bookings);

        List<BookingResponse> responses = bookings.stream()
                .map(booking -> toResponse(booking, listingsById.get(booking.getListingId()), guestsById.get(booking.getGuestId()), includeSecretCode))
                .toList();

        return new PageImpl<>(responses, page.getPageable(), page.getTotalElements());
    }

    private Map<String, Property> fetchListingsById(List<Booking> bookings) {
        if (bookings == null || bookings.isEmpty()) {
            return Collections.emptyMap();
        }

        List<String> listingIds = bookings.stream()
                .map(Booking::getListingId)
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();

        if (listingIds.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, Property> results = new HashMap<>();
        propertyRepository.findAllById(listingIds).forEach(property -> results.put(property.getId(), property));
        return results;
    }

    private Map<String, User> fetchUsersById(List<Booking> bookings) {
        if (bookings == null || bookings.isEmpty()) {
            return Collections.emptyMap();
        }

        List<String> guestIds = bookings.stream()
                .map(Booking::getGuestId)
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();

        if (guestIds.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, User> results = new HashMap<>();
        userRepository.findAllById(guestIds).forEach(user -> results.put(user.getId(), user));
        return results;
    }

    private BookingResponse toResponse(Booking booking,
                                       Property listing,
                                       User guest,
                                       boolean includeSecretCode) {
        BigDecimal totalPrice = booking.getTotalPrice();
        if (totalPrice == null && listing != null) {
            totalPrice = computeTotalPrice(listing, booking.getCheckInDate(), booking.getCheckOutDate(), booking.getGuests());
        }
        if (totalPrice == null) {
            totalPrice = BigDecimal.ZERO;
        }

        BookingPropertyInfo propertyInfo = listing == null ? null : BookingPropertyInfo.builder()
                .title(listing.getTitle())
                .location(listing.getLocation())
                .image(listing.getImages() != null && !listing.getImages().isEmpty() ? listing.getImages().get(0) : null)
                .build();

        return BookingResponse.builder()
                .id(booking.getId())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .status(booking.getStatus())
                .listingId(booking.getListingId())
                .guestId(booking.getGuestId())
                .guests(booking.getGuests())
                .guestCount(booking.getGuests())
                .totalPrice(totalPrice)
                .createdAt(booking.getCreatedAt())
                .listingTitle(listing != null ? listing.getTitle() : null)
                .listingLocation(listing != null ? listing.getLocation() : null)
                .listingImage(listing != null && listing.getImages() != null && !listing.getImages().isEmpty() ? listing.getImages().get(0) : null)
                .property(propertyInfo)
                .guestEmail(guest != null ? guest.getEmail() : null)
                .guestName(guest != null ? guest.getName() : null)
                .stripePaymentIntentId(booking.getStripePaymentIntentId())
                .checkInSecretCode(includeSecretCode ? booking.getCheckInSecretCode() : null)
                .paymentMethod(booking.getPaymentMethod())
                .build();
    }

    private BigDecimal computeTotalPrice(Property listing, LocalDate checkInDate, LocalDate checkOutDate, Integer guests) {
        if (listing == null || listing.getPricePerNight() == null || checkInDate == null || checkOutDate == null) {
            return BigDecimal.ZERO;
        }

        long days = Math.max(1, ChronoUnit.DAYS.between(checkInDate, checkOutDate));
        int guestCount = guests == null || guests < 1 ? 1 : guests;
        return listing.getPricePerNight()
                .multiply(BigDecimal.valueOf(days))
                .multiply(BigDecimal.valueOf(guestCount));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private void ensureGuestHasNoActiveConfirmedBooking(String guestId) {
        boolean hasActiveConfirmedBooking = bookingRepository.existsByGuestIdAndStatusInAndCheckOutDateAfter(
                guestId,
            List.of(
                BookingStatus.CONFIRMED,
                BookingStatus.AWAITING_PAYMENT,
                BookingStatus.AWAITING_CHECKIN,
                BookingStatus.PAID_AWAITING_CHECKIN
            ),
                LocalDate.now()
        );

        if (hasActiveConfirmedBooking) {
            throw new IllegalArgumentException(
                    "You already have an active reservation. You cannot book another property until your current stay is completed."
            );
        }
    }

    private void ensureNoOverlapForStatuses(String listingId,
                                            LocalDate checkInDate,
                                            LocalDate checkOutDate,
                                            String excludeBookingId,
                                            List<BookingStatus> statuses) {
        List<Booking> overlapping = excludeBookingId == null
                ? bookingRepository.findByListingIdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                listingId,
                statuses,
                checkOutDate,
                checkInDate
        )
                : bookingRepository.findByListingIdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThanAndIdNot(
                listingId,
                statuses,
                checkOutDate,
                checkInDate,
                excludeBookingId
        );

        if (overlapping.isEmpty()) {
            return;
        }

        Booking conflict = overlapping.stream()
            .min(Comparator.comparing(Booking::getCheckInDate))
            .orElse(overlapping.get(0));

        throw new IllegalArgumentException(
                "This property is already reserved from "
                        + conflict.getCheckInDate()
                        + " to "
                        + conflict.getCheckOutDate()
                        + ". Please choose other dates."
        );
    }
}

