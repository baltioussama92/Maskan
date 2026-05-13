package com.maskan.api.dto;

import lombok.Value;

@Value
public class UpdateUserPreferencesRequest {
    String language;
    String currency;
    NotificationPreferencesDto notifications;
    PrivacyPreferencesDto privacy;
}
