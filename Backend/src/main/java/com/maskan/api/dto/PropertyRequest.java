package com.maskan.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Value;

import java.math.BigDecimal;
import java.util.List;

@Value
public class PropertyRequest {
    @NotBlank
    String title;

    @NotBlank
    String description;

    @NotBlank
    String location;

    Double latitude;
    Double longitude;

    @NotNull
    BigDecimal pricePerNight;

    String currency;

    List<String> images;

    Boolean available;
    String type;
    String badge;
    Integer bedrooms;
    Integer maxGuests;
    Integer bathrooms;
    Integer area;
    String houseRules;
    List<String> amenities;

    public BigDecimal getPrice() {
        return pricePerNight;
    }
}

