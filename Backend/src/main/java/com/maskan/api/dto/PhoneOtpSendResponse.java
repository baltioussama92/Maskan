package com.maskan.api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PhoneOtpSendResponse {

    private String reqId;
    private String message;
}
