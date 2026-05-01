package com.maskan.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class BookingPropertyInfo {
    String title;
    String image;
    String location;
}
