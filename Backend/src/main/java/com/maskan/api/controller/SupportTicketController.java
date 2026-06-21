package com.maskan.api.controller;

import com.maskan.api.dto.SupportTicketCreateRequest;
import com.maskan.api.dto.SupportTicketResponse;
import com.maskan.api.service.SupportTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/support/tickets")
@CrossOrigin(origins = "${app.cors.allowed-origin:https://maskan-app.vercel.app}")
@RequiredArgsConstructor
public class SupportTicketController {

    private final SupportTicketService supportTicketService;

    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SupportTicketResponse>> listMine(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(supportTicketService.listMyTickets(principal.getUsername()));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SupportTicketResponse> create(@AuthenticationPrincipal UserDetails principal,
                                                        @Valid @RequestBody SupportTicketCreateRequest request) {
        return ResponseEntity.ok(supportTicketService.createTicket(principal.getUsername(), request));
    }
}
