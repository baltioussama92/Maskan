package com.maskan.api.controller;

import com.maskan.api.dto.PropertyRequest;
import com.maskan.api.dto.PropertyResponse;
import com.maskan.api.service.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
@CrossOrigin(origins = "${app.cors.allowed-origin:http://localhost:5173}")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    @GetMapping
    public ResponseEntity<Page<PropertyResponse>> getProperties(@PageableDefault(size = 20) Pageable pageable) {
        Page<PropertyResponse> listings = propertyService.findAll(pageable);
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/owner/me")
    @PreAuthorize("hasAnyRole('HOST','PROPRIETOR','ADMIN')")
    public ResponseEntity<Page<PropertyResponse>> getMyProperties(@AuthenticationPrincipal UserDetails authenticatedUser,
                                                                  @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(propertyService.findMine(authenticatedUser.getUsername(), pageable));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('HOST','PROPRIETOR','ADMIN')")
    public ResponseEntity<Page<PropertyResponse>> getMyPropertiesAlias(@AuthenticationPrincipal UserDetails authenticatedUser,
                                                                       @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(propertyService.findMine(authenticatedUser.getUsername(), pageable));
    }

    @GetMapping("/search")
        public ResponseEntity<Page<PropertyResponse>> searchProperties(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer bedrooms,
            @RequestParam(required = false) List<String> amenities,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PropertyResponse> listings = propertyService.search(
                location,
                minPrice,
                maxPrice,
                available,
                checkInDate,
                checkOutDate,
                type,
                bedrooms,
            amenities,
            pageable
        );
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/search/advanced")
        public ResponseEntity<Page<PropertyResponse>> advancedSearchProperties(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer bedrooms,
            @RequestParam(required = false) List<String> amenities,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PropertyResponse> listings = propertyService.search(
                location,
                minPrice,
                maxPrice,
                available,
                checkInDate,
                checkOutDate,
                type,
                bedrooms,
            amenities,
            pageable
        );
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponse> getPropertyById(@PathVariable String id) {
        PropertyResponse property = propertyService.findById(id);
        return ResponseEntity.ok(property);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HOST','PROPRIETOR')")
    public ResponseEntity<PropertyResponse> createProperty(
            @Valid @RequestBody PropertyRequest request,
            @AuthenticationPrincipal UserDetails authenticatedUser) {
        PropertyResponse createdProperty = propertyService.create(request, authenticatedUser.getUsername());

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdProperty.getId())
                .toUri();

        return ResponseEntity.created(location).body(createdProperty);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOST','PROPRIETOR','ADMIN')")
    public ResponseEntity<PropertyResponse> updateProperty(
            @PathVariable String id,
            @Valid @RequestBody PropertyRequest request,
            @AuthenticationPrincipal UserDetails authenticatedUser) {
        PropertyResponse updatedProperty = propertyService.update(id, request, authenticatedUser.getUsername());
        return ResponseEntity.ok(updatedProperty);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOST','PROPRIETOR','ADMIN')")
    public ResponseEntity<Void> deleteProperty(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails authenticatedUser) {
        propertyService.delete(id, authenticatedUser.getUsername());
        return ResponseEntity.noContent().build();
    }
}

