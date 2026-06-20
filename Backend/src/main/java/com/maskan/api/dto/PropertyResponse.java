package com.maskan.api.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Value
@Builder
public class PropertyResponse {
    String id;
    String title;
    String description;
    String location;
    Double latitude;
    Double longitude;
    BigDecimal pricePerNight;
    String currency;
    List<String> images;
    String hostId;
    Instant createdAt;
    Boolean available;
    String type;
    String badge;
    Integer bedrooms;
    Integer maxGuests;
    Integer bathrooms;
    Integer area;
    String houseRules;
    List<String> amenities;
    Double averageRating;
    Double rating;
    Integer reviewCount;
    Boolean pendingApproval;
}

