package com.maskan.api.repository;

import com.maskan.api.entity.Review;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {
	List<Review> findByPropertyId(String propertyId);
	boolean existsByReservationId(String reservationId);
	boolean existsByPropertyIdAndUserId(String propertyId, String userId);
}

