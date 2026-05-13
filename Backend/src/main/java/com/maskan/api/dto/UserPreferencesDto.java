package com.maskan.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserPreferencesDto {
    String language;
    String currency;
    NotificationPreferencesDto notifications;
    PrivacyPreferencesDto privacy;
}
