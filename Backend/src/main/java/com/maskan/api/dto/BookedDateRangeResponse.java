package com.maskan.api.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;

@Value
@Builder
public class BookedDateRangeResponse {
    LocalDate startDate;
    LocalDate endDate;
}
