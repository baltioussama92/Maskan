package com.maskan.api.repository;

import com.maskan.api.entity.Property;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PropertyRepository extends MongoRepository<Property, String> {
	List<Property> findByHostId(String hostId);
	Page<Property> findByHostId(String hostId, Pageable pageable);
	List<Property> findByPendingApprovalTrue();
	Page<Property> findByPendingApprovalTrue(Pageable pageable);
	long countByHostId(String hostId);
}

