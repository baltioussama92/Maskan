package com.maskan.api.repository;

import com.maskan.api.entity.SupportTicket;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SupportTicketRepository extends MongoRepository<SupportTicket, String> {
	List<SupportTicket> findByRequesterId(String requesterId);
}
