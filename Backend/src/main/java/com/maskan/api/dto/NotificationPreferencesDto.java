package com.maskan.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class NotificationPreferencesDto {
    Boolean bookings;
    Boolean messages;
    Boolean marketing;
    Boolean sms;
    Boolean news;
}
