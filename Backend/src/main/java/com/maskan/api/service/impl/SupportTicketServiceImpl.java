package com.maskan.api.service.impl;

import com.maskan.api.dto.SupportTicketCreateRequest;
import com.maskan.api.dto.SupportTicketResponse;
import com.maskan.api.entity.SupportTicket;
import com.maskan.api.entity.User;
import com.maskan.api.exception.NotFoundException;
import com.maskan.api.repository.SupportTicketRepository;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.SupportTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SupportTicketServiceImpl implements SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;

    @Override
    public SupportTicketResponse createTicket(String email, SupportTicketCreateRequest request) {
        User user = getUserByEmail(email);
        String priority = request.getPriority() == null || request.getPriority().isBlank()
                ? "medium"
                : request.getPriority().trim().toLowerCase();

        SupportTicket.MessageEntry message = SupportTicket.MessageEntry.builder()
                .id(UUID.randomUUID().toString())
                .senderId(user.getId())
                .content(request.getMessage().trim())
                .createdAt(Instant.now())
                .internal(false)
                .build();

        SupportTicket ticket = SupportTicket.builder()
                .requesterId(user.getId())
                .subject(request.getSubject().trim())
                .priority(priority)
                .status("open")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .messages(List.of(message))
                .build();

        return toResponse(supportTicketRepository.save(ticket));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupportTicketResponse> listMyTickets(String email) {
        User user = getUserByEmail(email);
        return supportTicketRepository.findByRequesterId(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private SupportTicketResponse toResponse(SupportTicket ticket) {
        return SupportTicketResponse.builder()
                .id(ticket.getId())
                .subject(ticket.getSubject())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
