package com.maskan.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Value;

@Value
public class SupportTicketCreateRequest {
    @NotBlank
    String subject;

    @NotBlank
    String message;

    String priority;
}
