package com.maskan.api.service;

import com.maskan.api.dto.PropertyRequest;
import com.maskan.api.dto.PropertyResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PropertyService {
    PropertyResponse create(PropertyRequest request, String email);
    PropertyResponse update(String id, PropertyRequest request, String email);
    void delete(String id, String email);
    Page<PropertyResponse> findAll(Pageable pageable);
    Page<PropertyResponse> findMine(String email, Pageable pageable);
    PropertyResponse findById(String id);
    Page<PropertyResponse> search(String location,
                                  BigDecimal minPrice,
                                  BigDecimal maxPrice,
                                  Boolean available,
                                  LocalDate checkInDate,
                                  LocalDate checkOutDate,
                                  String type,
                                  Integer bedrooms,
                                  List<String> amenities,
                                  Pageable pageable);
    List<PropertyResponse> findPendingApproval();
}

