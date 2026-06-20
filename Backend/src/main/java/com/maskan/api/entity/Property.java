package com.maskan.api.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "properties")
public class Property {

    @Id
    private String id;

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    @Indexed
    private String location;

    private Double latitude;
    private Double longitude;

    @NotNull
    @Indexed
    private BigDecimal pricePerNight;

    private String currency;

    @Builder.Default
    private List<String> images = List.of();

    @NotBlank
    @Indexed
    private String hostId;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    @Indexed
    private Boolean available = Boolean.TRUE;

    @Indexed
    private String type;
    private String badge;
    @Indexed
    private Integer bedrooms;
    @Indexed
    private Integer maxGuests;
    private Integer bathrooms;
    private Integer area;
    private String houseRules;

    @Builder.Default
    private List<String> amenities = List.of();

    private Double averageRating;
    private Double rating;
    private Integer reviewCount;

    @Builder.Default
    @Indexed
    private Boolean pendingApproval = Boolean.FALSE;

    public BigDecimal getPrice() {
        return pricePerNight;
    }

    public void setPrice(BigDecimal price) {
        this.pricePerNight = price;
    }
}

