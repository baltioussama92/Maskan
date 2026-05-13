package com.maskan.api.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreferences {

    @Builder.Default
    private String language = "Francais";

    @Builder.Default
    private String currency = "DT";

    @Builder.Default
    private NotificationPreferences notifications = new NotificationPreferences();

    @Builder.Default
    private PrivacyPreferences privacy = new PrivacyPreferences();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationPreferences {
        @Builder.Default
        private Boolean bookings = Boolean.TRUE;

        @Builder.Default
        private Boolean messages = Boolean.TRUE;

        @Builder.Default
        private Boolean marketing = Boolean.FALSE;

        @Builder.Default
        private Boolean sms = Boolean.FALSE;

        @Builder.Default
        private Boolean news = Boolean.TRUE;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PrivacyPreferences {
        @Builder.Default
        private Boolean showProfile = Boolean.TRUE;

        @Builder.Default
        private Boolean showActivity = Boolean.TRUE;

        @Builder.Default
        private Boolean allowMessages = Boolean.TRUE;
    }
}
