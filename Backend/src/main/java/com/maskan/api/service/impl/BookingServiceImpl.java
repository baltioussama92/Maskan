package com.maskan.api.service.impl;

import com.maskan.api.dto.BookingPropertyInfo;
import com.maskan.api.dto.BookingRequest;
import com.maskan.api.dto.BookingResponse;
import com.maskan.api.dto.BookingStatusUpdateRequest;
import com.maskan.api.dto.CheckInVerificationResponse;
import com.maskan.api.dto.UnavailableDateRangeResponse;
import com.maskan.api.dto.VerifyCheckInRequest;
import com.maskan.api.entity.Booking;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Comparator;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

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
            List.of(
                    BookingStatus.PENDING,
                    BookingStatus.CONFIRMED,
                    BookingStatus.AWAITING_PAYMENT,
                    BookingStatus.PAID_AWAITING_CHECKIN
            )
        );

        Booking booking = Booking.builder()
            .listingId(property.getId())
            .guestId(user.getId())
            .checkInDate(request.getCheckInDate())
            .checkOutDate(request.getCheckOutDate())
            .guests(request.getGuests() == null || request.getGuests() < 1 ? 1 : request.getGuests())
            .totalPrice(computeTotalPrice(property, request.getCheckInDate(), request.getCheckOutDate(), request.getGuests()))
                .status(BookingStatus.PENDING)
                .build();

        Booking saved = bookingRepository.save(booking);
        String guestName = user.getName() == null || user.getName().isBlank() ? "Guest" : user.getName();
        notificationService.createNotification(
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
                List.of(
                    BookingStatus.PENDING,
                    BookingStatus.CONFIRMED,
                    BookingStatus.AWAITING_PAYMENT,
                    BookingStatus.PAID_AWAITING_CHECKIN
                )
            );
        }

        BookingStatus nextStatus = request.getStatus();
        if (nextStatus == BookingStatus.CONFIRMED) {
            nextStatus = BookingStatus.AWAITING_PAYMENT;
        }

        booking.setStatus(nextStatus);
        Booking saved = bookingRepository.save(booking);
        return toResponse(saved, true);
    }

    @Override
    public void cancelBooking(String bookingId, String email) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        User current = getUserByEmail(email);

        boolean isAdmin = current.getRole() == Role.ADMIN;
        boolean isBookingGuest = current.getId().equals(booking.getGuestId());
        if (!isAdmin && !isBookingGuest) {
            throw new IllegalArgumentException("Not authorized to cancel this booking");
        }

        bookingRepository.delete(booking);
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

        if (booking.getStatus() != BookingStatus.PAID_AWAITING_CHECKIN) {
            throw new IllegalArgumentException("Booking is not ready for check-in verification");
        }

        if (booking.getCheckInSecretCode() == null || !booking.getCheckInSecretCode().equals(request.getSecretCode())) {
            throw new IllegalArgumentException("Invalid check-in secret code");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        Booking saved = bookingRepository.save(booking);

        return CheckInVerificationResponse.builder()
                .bookingId(saved.getId())
                .status(saved.getStatus())
                .message("Check-in verified successfully. Payout triggered.")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getMyBookings(String email, Pageable pageable) {
        User user = getUserByEmail(email);
        return bookingRepository.findByGuestId(user.getId(), pageable)
                .map(booking -> toResponse(booking, true));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getOwnerBookings(String email, Pageable pageable) {
        User owner = getUserByEmail(email);

        if (owner.getRole() == Role.ADMIN) {
            return bookingRepository.findAll(pageable)
                    .map(booking -> toResponse(booking, false));
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

        return bookingRepository.findByListingIdIn(ownerPropertyIds, pageable)
            .map(booking -> toResponse(booking, false));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> getAllBookings(Pageable pageable) {
        return bookingRepository.findAll(pageable)
                .map(booking -> toResponse(booking, false));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnavailableDateRangeResponse> getUnavailableDateRangesForListing(String listingId) {
        return bookingRepository.findByListingIdAndStatusIn(
                listingId,
            List.of(
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.AWAITING_PAYMENT,
                BookingStatus.PAID_AWAITING_CHECKIN
            )
        ).stream()
                .filter(booking -> booking.getCheckInDate() != null && booking.getCheckOutDate() != null)
                .sorted(Comparator.comparing(Booking::getCheckInDate))
                .map(booking -> UnavailableDateRangeResponse.builder()
                        .checkInDate(booking.getCheckInDate())
                        .checkOutDate(booking.getCheckOutDate())
                        .build())
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

