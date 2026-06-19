package com.maskan.api.service;

import com.maskan.api.dto.BookingRequest;
import com.maskan.api.dto.BookingResponse;
import com.maskan.api.dto.BookingStatusUpdateRequest;
import com.maskan.api.dto.CheckInVerificationResponse;
import com.maskan.api.dto.VerifyCheckInRequest;
import com.maskan.api.dto.BookedDateRangeResponse;
import com.maskan.api.dto.UnavailableDateRangeResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BookingService {
    BookingResponse createBooking(BookingRequest request, String email);
    BookingResponse updateStatus(String bookingId, BookingStatusUpdateRequest request, String email);
    void cancelBooking(String bookingId, String email);
    CheckInVerificationResponse verifyCheckIn(String bookingId, VerifyCheckInRequest request, String email);
    Page<BookingResponse> getMyBookings(String email, Pageable pageable);
    Page<BookingResponse> getOwnerBookings(String email, Pageable pageable);
    Page<BookingResponse> getAllBookings(Pageable pageable);
    List<UnavailableDateRangeResponse> getUnavailableDateRangesForListing(String listingId);
    List<BookedDateRangeResponse> getBookedDateRangesForProperty(String propertyId);
}

