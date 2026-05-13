package com.maskan.api.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class SupportTicketResponse {
    String id;
    String subject;
    String priority;
    String status;
    Instant createdAt;
    Instant updatedAt;
}
