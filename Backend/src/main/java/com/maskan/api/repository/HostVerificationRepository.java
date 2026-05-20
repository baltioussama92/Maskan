package com.maskan.api.repository;

import com.maskan.api.entity.HostVerification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface HostVerificationRepository extends MongoRepository<HostVerification, String> {
    Optional<HostVerification> findByUserId(String userId);
}