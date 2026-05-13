package com.maskan.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PrivacyPreferencesDto {
    Boolean showProfile;
    Boolean showActivity;
    Boolean allowMessages;
}
