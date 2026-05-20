package com.maskan.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Value;

@Value
@Builder(toBuilder = true)
public class ReviewDto {
    String propertyId;

    @NotNull
    @Min(1)
    @Max(5)
    Integer rating;

    @Size(max = 1000)
    String comment;
}