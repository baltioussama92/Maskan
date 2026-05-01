package com.maskan.api.controller;

import com.maskan.api.dto.BookingRequest;
import com.maskan.api.dto.BookingResponse;
import com.maskan.api.dto.BookingStatusUpdateRequest;
import com.maskan.api.dto.CheckInVerificationResponse;
import com.maskan.api.dto.UnavailableDateRangeResponse;
import com.maskan.api.dto.VerifyCheckInRequest;
import com.maskan.api.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/bookings", "/api/reservations"})
@CrossOrigin(origins = "${app.cors.allowed-origin:http://localhost:5173}")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('GUEST','TENANT')")
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody BookingRequest request,
                                                  @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(bookingService.createBooking(request, principal.getUsername()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('HOST','PROPRIETOR','ADMIN')")
    public ResponseEntity<BookingResponse> updateStatus(@PathVariable String id,
                                                        @Valid @RequestBody BookingStatusUpdateRequest request,
                                                        @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(bookingService.updateStatus(id, request, principal.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('GUEST','TENANT','ADMIN')")
    public ResponseEntity<Void> cancel(@PathVariable String id,
                                       @AuthenticationPrincipal UserDetails principal) {
        bookingService.cancelBooking(id, principal.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/verify-checkin")
    @PreAuthorize("hasAnyRole('HOST','PROPRIETOR')")
    public ResponseEntity<CheckInVerificationResponse> verifyCheckIn(@PathVariable String id,
                                                                     @Valid @RequestBody VerifyCheckInRequest request,
                                                                     @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(bookingService.verifyCheckIn(id, request, principal.getUsername()));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('GUEST','TENANT')")
    public ResponseEntity<Page<BookingResponse>> myBookings(@AuthenticationPrincipal UserDetails principal,
                                                            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(bookingService.getMyBookings(principal.getUsername(), pageable));
    }

    @GetMapping("/owner")
    @PreAuthorize("hasAnyRole('HOST','PROPRIETOR','ADMIN')")
    public ResponseEntity<Page<BookingResponse>> ownerBookings(@AuthenticationPrincipal UserDetails principal,
                                                               @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(bookingService.getOwnerBookings(principal.getUsername(), pageable));
    }

    @GetMapping("/listing/{listingId}/unavailable-dates")
    public ResponseEntity<List<UnavailableDateRangeResponse>> unavailableDates(@PathVariable String listingId) {
        return ResponseEntity.ok(bookingService.getUnavailableDateRangesForListing(listingId));
    }
}

