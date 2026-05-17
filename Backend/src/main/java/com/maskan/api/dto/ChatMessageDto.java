package com.maskan.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class ChatMessageDto {
    @NotBlank
    String senderId;

    @NotBlank
    String recipientId;

    @NotBlank
    String content;

    Instant timestamp;
}