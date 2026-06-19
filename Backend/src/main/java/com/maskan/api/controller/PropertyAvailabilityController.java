package com.maskan.api.controller;

import com.maskan.api.dto.BookedDateRangeResponse;
import com.maskan.api.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = "${app.cors.allowed-origin:http://localhost:5173}")
@RequiredArgsConstructor
public class PropertyAvailabilityController {

    private final BookingService bookingService;

    @GetMapping("/{propertyId}/booked-dates")
    public ResponseEntity<List<BookedDateRangeResponse>> getBookedDates(@PathVariable String propertyId) {
        return ResponseEntity.ok(bookingService.getBookedDateRangesForProperty(propertyId));
    }
}
