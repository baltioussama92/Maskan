package com.maskan.api.repository;

import com.maskan.api.entity.PaymentMethod;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentMethodRepository extends MongoRepository<PaymentMethod, String> {
    List<PaymentMethod> findByUserId(String userId);
    Optional<PaymentMethod> findByIdAndUserId(String id, String userId);
    Optional<PaymentMethod> findByUserIdAndIsDefaultTrue(String userId);
}
