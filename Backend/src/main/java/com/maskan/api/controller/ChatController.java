package com.maskan.api.controller;

import com.maskan.api.dto.ChatMessageDto;
import com.maskan.api.dto.MessageRequest;
import com.maskan.api.dto.MessageResponse;
import com.maskan.api.entity.User;
import com.maskan.api.exception.NotFoundException;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final MessageService messageService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Valid @Payload ChatMessageDto payload, Principal principal) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required");
        }

        String username = principal.getName();

        User sender = userRepository.findByEmail(username)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (payload.getSenderId() != null && !payload.getSenderId().isBlank()
                && !String.valueOf(sender.getId()).equals(String.valueOf(payload.getSenderId()))) {
            throw new AccessDeniedException("Sender mismatch");
        }

        User recipient = userRepository.findById(payload.getRecipientId())
                .orElseThrow(() -> new NotFoundException("Recipient not found"));

        MessageResponse saved = messageService.send(
                new MessageRequest(payload.getRecipientId(), payload.getContent(), payload.getTimestamp()),
            username
        );

        messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/chat", saved);
        messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/chat", saved);
    }
}