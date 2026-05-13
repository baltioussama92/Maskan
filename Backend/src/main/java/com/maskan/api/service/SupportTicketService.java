package com.maskan.api.service;

import com.maskan.api.dto.SupportTicketCreateRequest;
import com.maskan.api.dto.SupportTicketResponse;

import java.util.List;

public interface SupportTicketService {
    SupportTicketResponse createTicket(String email, SupportTicketCreateRequest request);
    List<SupportTicketResponse> listMyTickets(String email);
}
