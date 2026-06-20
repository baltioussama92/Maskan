package com.maskan.api.controller;

import com.maskan.api.dto.BookedDateRangeResponse;
import com.maskan.api.dto.PropertyResponse;
import com.maskan.api.service.BookingService;
import com.maskan.api.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = "${app.cors.allowed-origin:http://localhost:5173}")
@RequiredArgsConstructor
public class PropertyAvailabilityController {

    private final BookingService bookingService;
    private final PropertyService propertyService;

    @GetMapping("/search")
    public ResponseEntity<Page<PropertyResponse>> searchProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer guests,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(propertyService.searchAvailable(city, startDate, endDate, guests, pageable));
    }

    @GetMapping("/{propertyId}/booked-dates")
    public ResponseEntity<List<BookedDateRangeResponse>> getBookedDates(@PathVariable String propertyId) {
        return ResponseEntity.ok(bookingService.getBookedDateRangesForProperty(propertyId));
    }
}
