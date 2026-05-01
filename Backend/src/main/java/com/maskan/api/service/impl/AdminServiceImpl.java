package com.maskan.api.service.impl;

import com.maskan.api.dto.AdminActionResponse;
import com.maskan.api.dto.AdminHistoryEventResponse;
import com.maskan.api.dto.AdminMonthlyEarningsResponse;
import com.maskan.api.dto.AdminUpdateUserPasswordRequest;
import com.maskan.api.dto.AdminUpdateUserRequest;
import com.maskan.api.dto.AdminUserBookingResponse;
import com.maskan.api.dto.AdminUserEarningsResponse;
import com.maskan.api.dto.AdminUserListingResponse;
import com.maskan.api.dto.AdminUserMessageResponse;
import com.maskan.api.dto.AdminUserOverviewResponse;
import com.maskan.api.dto.AdminUserPermissionsResponse;
import com.maskan.api.dto.BookingPropertyInfo;
import com.maskan.api.dto.BookingResponse;
import com.maskan.api.dto.AdminGrowthMetricsResponse;
import com.maskan.api.dto.HostDemandResponse;
import com.maskan.api.dto.PropertyResponse;
import com.maskan.api.dto.UserDto;
import com.maskan.api.entity.Booking;
import com.maskan.api.entity.BookingStatus;
import com.maskan.api.entity.Message;
import com.maskan.api.entity.Property;
import com.maskan.api.entity.Role;
import com.maskan.api.entity.User;
import com.maskan.api.repository.BookingRepository;
import com.maskan.api.repository.PropertyRepository;
import com.maskan.api.exception.NotFoundException;
import com.maskan.api.repository.MessageRepository;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeSet;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final MessageRepository messageRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> listUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public UserDto banUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        // Toggle banned status
        user.setBanned(!Boolean.TRUE.equals(user.getBanned()));
        User updated = userRepository.save(user);
        return toDto(updated);
    }

    @Override
    public UserDto blockUser(String userId) {
        return banUser(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingResponse> listBookings(Pageable pageable) {
        return bookingRepository.findAll(pageable)
                .map(this::toBookingResponse);
    }

        @Override
        @Transactional(readOnly = true)
        public Page<PropertyResponse> listPendingListings(Pageable pageable) {
        return propertyRepository.findByPendingApprovalTrue(pageable)
            .map(this::toPropertyResponse);
        }

        @Override
        public PropertyResponse verifyProperty(String propertyId) {
        Property property = propertyRepository.findById(propertyId)
            .orElseThrow(() -> new NotFoundException("Property not found"));
        property.setPendingApproval(Boolean.FALSE);
        Property saved = propertyRepository.save(property);
        return toPropertyResponse(saved);
        }

        @Override
        @Transactional(readOnly = true)
        public AdminGrowthMetricsResponse growthMetrics() {
        Map<String, Long> usersByMonth = userRepository.findAll().stream()
            .collect(Collectors.groupingBy(user -> user.getCreatedAt() == null ? "unknown" : user.getCreatedAt().toString().substring(0, 7), Collectors.counting()));

        Map<String, Long> propertiesByMonth = propertyRepository.findAll().stream()
            .collect(Collectors.groupingBy(property -> property.getCreatedAt() == null ? "unknown" : property.getCreatedAt().toString().substring(0, 7), Collectors.counting()));

        Map<String, Long> bookingsByMonth = bookingRepository.findAll().stream()
            .collect(Collectors.groupingBy(booking -> booking.getCreatedAt() == null ? "unknown" : booking.getCreatedAt().toString().substring(0, 7), Collectors.counting()));

        TreeSet<String> labels = new TreeSet<>();
        labels.addAll(usersByMonth.keySet());
        labels.addAll(propertiesByMonth.keySet());
        labels.addAll(bookingsByMonth.keySet());

        List<String> labelList = labels.stream().filter(label -> !"unknown".equals(label)).toList();

        return AdminGrowthMetricsResponse.builder()
            .labels(labelList)
            .users(labelList.stream().map(label -> usersByMonth.getOrDefault(label, 0L)).toList())
            .properties(labelList.stream().map(label -> propertiesByMonth.getOrDefault(label, 0L)).toList())
            .bookings(labelList.stream().map(label -> bookingsByMonth.getOrDefault(label, 0L)).toList())
            .build();
        }

    @Override
    @Transactional(readOnly = true)
    public AdminUserOverviewResponse userOverview(String userId) {
        User user = getUserById(userId);
        List<Property> listings = propertyRepository.findByHostId(user.getId());
        List<String> listingIds = listings.stream().map(Property::getId).toList();

        List<Booking> guestBookings = bookingRepository.findByGuestId(user.getId());
        List<Booking> hostBookings = listingIds.isEmpty() ? List.of() : bookingRepository.findByListingIdIn(listingIds);

        List<Booking> relatedBookings = new ArrayList<>();
        relatedBookings.addAll(guestBookings);
        relatedBookings.addAll(hostBookings);

        long paidBookingsCount = relatedBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
                .count();
        long pendingBookingsCount = relatedBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.PENDING)
                .count();

        Map<String, Property> listingById = listings.stream()
                .collect(Collectors.toMap(Property::getId, property -> property, (left, right) -> left));

        BigDecimal totalEarnings = hostBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
                .map(booking -> computeTotalPrice(booking, listingById.get(booking.getListingId())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSpent = guestBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
                .map(booking -> computeTotalPrice(booking, propertyRepository.findById(booking.getListingId()).orElse(null)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminUserOverviewResponse.builder()
                .userId(user.getId())
                .listingsCount(listings.size())
                .bookingsAsGuestCount(guestBookings.size())
                .bookingsAsHostCount(hostBookings.size())
                .paidBookingsCount(paidBookingsCount)
                .pendingBookingsCount(pendingBookingsCount)
                .totalEarnings(totalEarnings)
                .totalSpent(totalSpent)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminHistoryEventResponse> userHistory(String userId, int limit, String cursor) {
        User user = getUserById(userId);
        int effectiveLimit = normalizeLimit(limit);
        Instant cursorInstant = parseCursor(cursor);

        List<AdminHistoryEventResponse> events = new ArrayList<>();

        if (user.getCreatedAt() != null) {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("email", user.getEmail());
            metadata.put("role", user.getRole() == null ? null : user.getRole().name());
            events.add(AdminHistoryEventResponse.builder()
                    .id("ACCOUNT_CREATED-" + user.getId())
                    .type("ACCOUNT_CREATED")
                    .description("User account created")
                    .metadata(metadata)
                    .createdAt(user.getCreatedAt())
                    .build());
        }

        List<Property> listings = propertyRepository.findByHostId(user.getId());
        Map<String, Property> listingById = listings.stream()
                .collect(Collectors.toMap(Property::getId, property -> property, (left, right) -> left));

        for (Property listing : listings) {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("listingId", listing.getId());
            metadata.put("title", listing.getTitle());
            metadata.put("location", listing.getLocation());
            events.add(AdminHistoryEventResponse.builder()
                    .id("LISTING_CREATED-" + listing.getId())
                    .type("LISTING_CREATED")
                    .description("Listing created")
                    .metadata(metadata)
                    .createdAt(listing.getCreatedAt())
                    .build());
        }

        List<String> listingIds = listings.stream().map(Property::getId).toList();
        List<Booking> guestBookings = bookingRepository.findByGuestId(user.getId());
        List<Booking> hostBookings = listingIds.isEmpty() ? List.of() : bookingRepository.findByListingIdIn(listingIds);

        Map<String, Booking> relatedBookings = new LinkedHashMap<>();
        for (Booking booking : guestBookings) {
            relatedBookings.put(booking.getId(), booking);
        }
        for (Booking booking : hostBookings) {
            relatedBookings.put(booking.getId(), booking);
        }

        for (Booking booking : relatedBookings.values()) {
            Property listing = listingById.get(booking.getListingId());
            if (listing == null) {
                listing = propertyRepository.findById(booking.getListingId()).orElse(null);
            }

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("bookingId", booking.getId());
            metadata.put("listingId", booking.getListingId());
            metadata.put("status", booking.getStatus() == null ? null : booking.getStatus().name());
            metadata.put("amount", computeTotalPrice(booking, listing));

            events.add(AdminHistoryEventResponse.builder()
                    .id("BOOKING_CREATED-" + booking.getId())
                    .type("BOOKING_CREATED")
                    .description("Booking created")
                    .metadata(metadata)
                    .createdAt(booking.getCreatedAt())
                    .build());

            if (booking.getStatus() == BookingStatus.CANCELLED) {
                events.add(AdminHistoryEventResponse.builder()
                        .id("BOOKING_CANCELLED-" + booking.getId())
                        .type("BOOKING_CANCELLED")
                        .description("Booking cancelled")
                        .metadata(metadata)
                        .createdAt(booking.getCreatedAt())
                        .build());
            }

            if (booking.getStatus() == BookingStatus.COMPLETED) {
                events.add(AdminHistoryEventResponse.builder()
                        .id("PAYMENT_COMPLETED-" + booking.getId())
                        .type("PAYMENT_COMPLETED")
                        .description("Booking payment completed")
                        .metadata(metadata)
                        .createdAt(booking.getCreatedAt())
                        .build());
            }
        }

        List<Message> messages = messageRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(user.getId(), user.getId());
        for (Message message : messages) {
            String eventType = user.getId().equals(message.getSenderId()) ? "MESSAGE_SENT" : "MESSAGE_RECEIVED";
            String otherUserId = user.getId().equals(message.getSenderId()) ? message.getReceiverId() : message.getSenderId();
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("messageId", message.getId());
            metadata.put("otherUserId", otherUserId);

            events.add(AdminHistoryEventResponse.builder()
                    .id(eventType + "-" + message.getId())
                    .type(eventType)
                    .description("User chat activity")
                    .metadata(metadata)
                    .createdAt(message.getCreatedAt())
                    .build());
        }

        return events.stream()
                .filter(event -> event.getCreatedAt() != null)
                .filter(event -> cursorInstant == null || event.getCreatedAt().isBefore(cursorInstant))
                .sorted(Comparator.comparing(AdminHistoryEventResponse::getCreatedAt).reversed())
                .limit(effectiveLimit)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserMessageResponse> userMessages(String userId, int limit, String cursor, String direction, String withUserId) {
        User user = getUserById(userId);
        int effectiveLimit = normalizeLimit(limit);
        Instant cursorInstant = parseCursor(cursor);
        String normalizedDirection = direction == null ? "all" : direction.trim().toLowerCase();

        if (!List.of("incoming", "outgoing", "all").contains(normalizedDirection)) {
            throw new IllegalArgumentException("Invalid direction. Use incoming, outgoing or all");
        }

        return messageRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(user.getId(), user.getId()).stream()
                .filter(message -> cursorInstant == null || (message.getCreatedAt() != null && message.getCreatedAt().isBefore(cursorInstant)))
                .filter(message -> matchesDirection(message, user.getId(), normalizedDirection))
                .filter(message -> withUserId == null || withUserId.isBlank() || withUserId.equals(resolveOtherUserId(message, user.getId())))
                .limit(effectiveLimit)
                .map(this::toAdminMessageResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserListingResponse> userListings(String userId) {
        getUserById(userId);
        return propertyRepository.findByHostId(userId).stream()
                .map(this::toAdminListingResponse)
                .sorted(Comparator.comparing(AdminUserListingResponse::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserBookingResponse> userBookings(String userId, String role) {
        getUserById(userId);
        String normalizedRole = role == null ? "all" : role.trim().toLowerCase();
        if (!List.of("guest", "host", "all").contains(normalizedRole)) {
            throw new IllegalArgumentException("Invalid role. Use guest, host or all");
        }

        List<Booking> guestBookings = bookingRepository.findByGuestId(userId);
        List<Property> listings = propertyRepository.findByHostId(userId);
        List<String> listingIds = listings.stream().map(Property::getId).toList();
        List<Booking> hostBookings = listingIds.isEmpty() ? List.of() : bookingRepository.findByListingIdIn(listingIds);

        Map<String, Booking> merged = new LinkedHashMap<>();
        if (!"host".equals(normalizedRole)) {
            for (Booking booking : guestBookings) {
                merged.put(booking.getId(), booking);
            }
        }
        if (!"guest".equals(normalizedRole)) {
            for (Booking booking : hostBookings) {
                merged.put(booking.getId(), booking);
            }
        }

        Map<String, Property> listingById = listings.stream()
                .collect(Collectors.toMap(Property::getId, property -> property, (left, right) -> left));

        return merged.values().stream()
                .map(booking -> toAdminBookingResponse(booking, listingById.get(booking.getListingId())))
                .sorted(Comparator.comparing(AdminUserBookingResponse::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserEarningsResponse userEarnings(String userId) {
        getUserById(userId);
        List<Property> listings = propertyRepository.findByHostId(userId);
        List<String> listingIds = listings.stream().map(Property::getId).toList();
        if (listingIds.isEmpty()) {
            return AdminUserEarningsResponse.builder()
                    .totalEarnings(BigDecimal.ZERO)
                    .currency("USD")
                    .paidBookingsCount(0)
                    .pendingPayoutCount(0)
                    .lastPayoutAt(null)
                    .monthlyBreakdown(List.of())
                    .build();
        }

        Map<String, Property> listingById = listings.stream()
                .collect(Collectors.toMap(Property::getId, property -> property, (left, right) -> left));

        List<Booking> hostBookings = bookingRepository.findByListingIdIn(listingIds);

        List<Booking> completed = hostBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
                .toList();

        BigDecimal totalEarnings = completed.stream()
                .map(booking -> computeTotalPrice(booking, listingById.get(booking.getListingId())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingPayoutCount = hostBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.PENDING)
                .count();

        Instant lastPayoutAt = completed.stream()
                .map(Booking::getCreatedAt)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);

        Map<String, BigDecimal> earningsByMonth = new HashMap<>();
        Map<String, Long> bookingsByMonth = new HashMap<>();
        for (Booking booking : completed) {
            if (booking.getCreatedAt() == null) {
                continue;
            }

            String month = booking.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().toString().substring(0, 7);
            BigDecimal amount = computeTotalPrice(booking, listingById.get(booking.getListingId()));
            earningsByMonth.put(month, earningsByMonth.getOrDefault(month, BigDecimal.ZERO).add(amount));
            bookingsByMonth.put(month, bookingsByMonth.getOrDefault(month, 0L) + 1L);
        }

        List<AdminMonthlyEarningsResponse> monthlyBreakdown = earningsByMonth.keySet().stream()
                .sorted()
                .map(month -> AdminMonthlyEarningsResponse.builder()
                        .month(month)
                        .earnings(earningsByMonth.getOrDefault(month, BigDecimal.ZERO))
                        .bookingsCount(bookingsByMonth.getOrDefault(month, 0L))
                        .build())
                .toList();

        return AdminUserEarningsResponse.builder()
                .totalEarnings(totalEarnings)
                .currency("USD")
                .paidBookingsCount(completed.size())
                .pendingPayoutCount(pendingPayoutCount)
                .lastPayoutAt(lastPayoutAt)
                .monthlyBreakdown(monthlyBreakdown)
                .build();
    }

    @Override
    public UserDto updateUser(String userId, AdminUpdateUserRequest request) {
        User user = getUserById(userId);
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        userRepository.findByEmail(normalizedEmail)
                .filter(existing -> !existing.getId().equals(userId))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Email already in use");
                });

        user.setName(request.getFullName().trim());
        user.setEmail(normalizedEmail);
        User updated = userRepository.save(user);
        return toDto(updated);
    }

    @Override
    public AdminActionResponse updateUserPassword(String userId, AdminUpdateUserPasswordRequest request) {
        User user = getUserById(userId);
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return AdminActionResponse.builder()
                .success(true)
                .securityEventId(UUID.randomUUID().toString())
                .deletedAt(null)
                .build();
    }

    @Override
    public AdminActionResponse deleteUser(String userId) {
        User user = getUserById(userId);
        Instant deletedAt = Instant.now();
        user.setBanned(Boolean.TRUE);
        user.setIsVerified(Boolean.FALSE);
        user.setName("Deleted User");
        user.setEmail("deleted_" + user.getId() + "_" + deletedAt.toEpochMilli() + "@deleted.local");
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        userRepository.save(user);
        return AdminActionResponse.builder()
                .success(true)
                .securityEventId(null)
                .deletedAt(deletedAt)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserPermissionsResponse userPermissions(String userId) {
        getUserById(userId);
        return AdminUserPermissionsResponse.builder()
                .canEditProfile(true)
                .canChangePassword(true)
                .canDeleteAccount(true)
                .canViewMessages(true)
                .canModerateListings(true)
                .build();
    }

    @Override
    public UserDto approveGuestVerification(String userId) {
        User user = getUserById(userId);

        if (user.getGovernmentIdFiles() == null || user.getGovernmentIdFiles().isEmpty() || user.getSelfieFile() == null || user.getSelfieFile().isBlank()) {
            throw new IllegalArgumentException("User has not submitted identity documents");
        }

        user.setIdentityStatus("approved");
        user.setVerificationLevel(3);
        user.setIsVerified(Boolean.TRUE);
        user.setRejectionReason(null);

        User updated = userRepository.save(user);
        return toDto(updated);
    }

    @Override
    public UserDto rejectGuestVerification(String userId, String reason) {
        User user = getUserById(userId);

        user.setIdentityStatus("rejected");
        user.setVerificationLevel(Boolean.TRUE.equals(user.getPhoneVerified()) ? 2 : Boolean.TRUE.equals(user.getEmailVerified()) ? 1 : 0);
        user.setIsVerified(Boolean.FALSE);
        user.setRejectionReason((reason == null || reason.isBlank()) ? "Verification rejected by admin" : reason.trim());

        User updated = userRepository.save(user);
        return toDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HostDemandResponse> listHostDemands(String status) {
        String normalizedStatus = status == null ? null : status.trim().toLowerCase();

        return userRepository.findAll().stream()
                .filter(this::isHostDemandCandidate)
                .filter(user -> normalizedStatus == null || normalizedStatus.isBlank() || normalizedStatus.equals(resolveHostDemandStatus(user)))
                .sorted(Comparator.comparing(User::getIdentitySubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toHostDemandResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public HostDemandResponse hostDemandById(String demandId) {
        User user = getUserById(demandId);
        if (!isHostDemandCandidate(user)) {
            throw new NotFoundException("Host demand not found");
        }
        return toHostDemandResponse(user);
    }

    @Override
    public HostDemandResponse approveHostDemand(String demandId) {
        User user = getUserById(demandId);
        if (!isHostDemandCandidate(user)) {
            throw new NotFoundException("Host demand not found");
        }

        user.setRole(Role.HOST);
        user.setIdentityStatus("approved");
        user.setVerificationLevel(3);
        user.setIsVerified(Boolean.TRUE);
        user.setRejectionReason(null);

        User updated = userRepository.save(user);
        return toHostDemandResponse(updated);
    }

    @Override
    public HostDemandResponse rejectHostDemand(String demandId, String reason) {
        User user = getUserById(demandId);
        if (!isHostDemandCandidate(user)) {
            throw new NotFoundException("Host demand not found");
        }

        user.setIdentityStatus("rejected");
        user.setVerificationLevel(Boolean.TRUE.equals(user.getPhoneVerified()) ? 2 : Boolean.TRUE.equals(user.getEmailVerified()) ? 1 : 0);
        user.setRejectionReason((reason == null || reason.isBlank()) ? "Host demand rejected by admin" : reason.trim());

        User updated = userRepository.save(user);
        return toHostDemandResponse(updated);
    }

    private BookingResponse toBookingResponse(Booking booking) {
        Property listing = propertyRepository.findById(booking.getListingId()).orElse(null);
        BigDecimal totalPrice = BigDecimal.ZERO;
        if (listing != null && listing.getPricePerNight() != null) {
            long days = Math.max(1, ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate()));
            int guests = booking.getGuests() == null || booking.getGuests() < 1 ? 1 : booking.getGuests();
            totalPrice = listing.getPricePerNight()
                .multiply(BigDecimal.valueOf(days))
                .multiply(BigDecimal.valueOf(guests));
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
                .build();
    }

    private AdminUserMessageResponse toAdminMessageResponse(Message message) {
        String first = message.getSenderId();
        String second = message.getReceiverId();
        if (first != null && second != null && first.compareTo(second) > 0) {
            first = message.getReceiverId();
            second = message.getSenderId();
        }

        return AdminUserMessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSenderId())
                .receiverId(message.getReceiverId())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .conversationId(first + "_" + second)
                .isDeleted(false)
                .moderationFlags(List.of())
                .build();
    }

    private AdminUserListingResponse toAdminListingResponse(Property property) {
        String status = "ACTIVE";
        if (Boolean.TRUE.equals(property.getPendingApproval())) {
            status = "PENDING_APPROVAL";
        } else if (Boolean.FALSE.equals(property.getAvailable())) {
            status = "UNAVAILABLE";
        }

        return AdminUserListingResponse.builder()
                .id(property.getId())
                .title(property.getTitle())
                .location(property.getLocation())
                .status(status)
                .createdAt(property.getCreatedAt())
                .pricePerNight(property.getPricePerNight())
                .rating(property.getRating())
                .build();
    }

    private AdminUserBookingResponse toAdminBookingResponse(Booking booking, Property listingFromCache) {
        Property listing = listingFromCache;
        if (listing == null) {
            listing = propertyRepository.findById(booking.getListingId()).orElse(null);
        }

        return AdminUserBookingResponse.builder()
                .id(booking.getId())
                .listingId(booking.getListingId())
                .listingTitle(listing != null ? listing.getTitle() : null)
                .guestId(booking.getGuestId())
                .hostId(listing != null ? listing.getHostId() : null)
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .status(booking.getStatus() == null ? null : booking.getStatus().name())
                .totalPrice(computeTotalPrice(booking, listing))
                .createdAt(booking.getCreatedAt())
                .build();
    }

    private BigDecimal computeTotalPrice(Booking booking, Property listing) {
        if (listing == null || listing.getPricePerNight() == null || booking.getCheckInDate() == null || booking.getCheckOutDate() == null) {
            return BigDecimal.ZERO;
        }

        long days = Math.max(1, ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate()));
        int guests = booking.getGuests() == null || booking.getGuests() < 1 ? 1 : booking.getGuests();

        return listing.getPricePerNight()
                .multiply(BigDecimal.valueOf(days))
                .multiply(BigDecimal.valueOf(guests));
    }

    private User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private int normalizeLimit(int limit) {
        if (limit < 1) {
            return 1;
        }
        return Math.min(limit, 200);
    }

    private Instant parseCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }

        try {
            return Instant.parse(cursor);
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("Invalid cursor format. Expected ISO-8601 instant");
        }
    }

    private boolean matchesDirection(Message message, String userId, String direction) {
        return switch (direction) {
            case "incoming" -> userId.equals(message.getReceiverId());
            case "outgoing" -> userId.equals(message.getSenderId());
            default -> userId.equals(message.getSenderId()) || userId.equals(message.getReceiverId());
        };
    }

    private String resolveOtherUserId(Message message, String userId) {
        return userId.equals(message.getSenderId()) ? message.getReceiverId() : message.getSenderId();
    }

        private PropertyResponse toPropertyResponse(Property property) {
        return PropertyResponse.builder()
            .id(property.getId())
            .title(property.getTitle())
            .description(property.getDescription())
            .location(property.getLocation())
            .pricePerNight(property.getPricePerNight())
            .currency(property.getCurrency())
            .images(property.getImages())
            .hostId(property.getHostId())
            .createdAt(property.getCreatedAt())
            .available(property.getAvailable())
            .type(property.getType())
            .bedrooms(property.getBedrooms())
            .bathrooms(property.getBathrooms())
            .area(property.getArea())
            .amenities(property.getAmenities())
            .rating(property.getRating())
            .reviewCount(property.getReviewCount())
            .pendingApproval(property.getPendingApproval())
            .build();
        }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .isVerified(user.getIsVerified())
                .banned(user.getBanned())
                .avatar(user.getAvatar())
                .phone(user.getPhone())
                .bio(user.getBio())
                .city(user.getCity())
                .emailVerified(user.getEmailVerified())
                .phoneVerified(user.getPhoneVerified())
                .identityStatus(user.getIdentityStatus())
                .verificationLevel(user.getVerificationLevel())
                .rejectionReason(user.getRejectionReason())
                .governmentIdFiles(user.getGovernmentIdFiles())
                .otherAttachmentFiles(user.getOtherAttachmentFiles())
                .selfieFile(user.getSelfieFile())
                .identitySubmittedAt(user.getIdentitySubmittedAt())
                .build();
    }

    private boolean isHostDemandCandidate(User user) {
        boolean hasIdentityDocs = user.getGovernmentIdFiles() != null && !user.getGovernmentIdFiles().isEmpty();
        boolean hasSelfie = user.getSelfieFile() != null && !user.getSelfieFile().isBlank();
        boolean hasSubmissionDate = user.getIdentitySubmittedAt() != null;
        return hasIdentityDocs || hasSelfie || hasSubmissionDate;
    }

    private String resolveHostDemandStatus(User user) {
        String identityStatus = user.getIdentityStatus() == null ? "" : user.getIdentityStatus().trim().toLowerCase();
        return switch (identityStatus) {
            case "approved" -> "approved";
            case "rejected" -> "rejected";
            default -> "pending";
        };
    }

    private String resolveIdVerificationStatus(User user) {
        String status = resolveHostDemandStatus(user);
        return switch (status) {
            case "approved" -> "verified";
            case "rejected" -> "rejected";
            default -> "pending";
        };
    }

    private HostDemandResponse toHostDemandResponse(User user) {
        List<String> governmentIds = user.getGovernmentIdFiles() == null ? List.of() : user.getGovernmentIdFiles();
        List<String> attachments = user.getOtherAttachmentFiles() == null ? List.of() : user.getOtherAttachmentFiles();
        List<String> housePictures = attachments.stream()
                .filter(path -> path != null && path.contains("property-image-"))
                .toList();
        List<String> documents = new ArrayList<>(governmentIds);
        documents.addAll(attachments);
        if (user.getSelfieFile() != null && !user.getSelfieFile().isBlank()) {
            documents.add(user.getSelfieFile());
        }

        String submittedDate = user.getIdentitySubmittedAt() != null
                ? user.getIdentitySubmittedAt().toString()
                : (user.getCreatedAt() == null ? null : user.getCreatedAt().toString());

        String idDocument = !governmentIds.isEmpty()
                ? governmentIds.get(0)
                : (user.getSelfieFile() == null || user.getSelfieFile().isBlank() ? null : user.getSelfieFile());

        return HostDemandResponse.builder()
                .id(user.getId())
                .userId(user.getId())
                .userName(user.getName())
                .userEmail(user.getEmail())
                .userPhone(null)
                .status(resolveHostDemandStatus(user))
                .submittedDate(submittedDate)
                .documents(documents)
                .idDocument(idDocument)
                .idVerificationStatus(resolveIdVerificationStatus(user))
                .housePictures(housePictures)
                .proposedPrice(0)
                .proposedLocation("N/A")
                .bio(null)
                .notes(user.getRejectionReason())
                .build();
    }
}

