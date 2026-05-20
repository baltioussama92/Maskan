package com.maskan.api.service.impl;

import com.maskan.api.dto.PropertyRequest;
import com.maskan.api.dto.PropertyResponse;
import com.maskan.api.entity.Booking;
import com.maskan.api.entity.BookingStatus;
import com.maskan.api.entity.Property;
import com.maskan.api.entity.Role;
import com.maskan.api.entity.User;
import com.maskan.api.exception.NotFoundException;
import com.maskan.api.repository.PropertyRepository;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    @CacheEvict(value = {"propertyPages", "propertyById"}, allEntries = true)
    public PropertyResponse create(PropertyRequest request, String email) {
        User owner = getUserByEmail(email);
        Property property = Property.builder()
                .title(request.getTitle())
            .description(request.getDescription())
                .location(request.getLocation())
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .pricePerNight(request.getPricePerNight())
            .currency(request.getCurrency() == null ? "USD" : request.getCurrency())
            .images(request.getImages() == null ? List.of() : request.getImages())
            .available(request.getAvailable() == null ? Boolean.TRUE : request.getAvailable())
            .type(request.getType())
            .currency(request.getCurrency() == null || request.getCurrency().isBlank() ? "USD" : request.getCurrency())
            .badge(request.getBadge())
            .bedrooms(request.getBedrooms())
            .bathrooms(request.getBathrooms())
            .area(request.getArea())
            .houseRules(request.getHouseRules())
            .amenities(request.getAmenities() == null ? List.of() : request.getAmenities())
            .pendingApproval(Boolean.FALSE)
            .hostId(owner.getId())
                .build();
        Property saved = propertyRepository.save(property);
        return toResponse(saved);
    }

    @Override
    @CacheEvict(value = {"propertyPages", "propertyById"}, allEntries = true)
    public PropertyResponse update(String id, PropertyRequest request, String email) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Property not found"));
        User current = getUserByEmail(email);
        requireOwnerOrProprietor(property, current);

        property.setTitle(request.getTitle());
        property.setDescription(request.getDescription());
        property.setLocation(request.getLocation());
        property.setLatitude(request.getLatitude());
        property.setLongitude(request.getLongitude());
        property.setPricePerNight(request.getPricePerNight());
        if (request.getCurrency() != null) {
            property.setCurrency(request.getCurrency());
        }
        property.setImages(request.getImages() == null ? List.of() : request.getImages());
        if (request.getAvailable() != null) {
            property.setAvailable(request.getAvailable());
        }
        property.setType(request.getType());
        if (request.getCurrency() != null) {
            property.setCurrency(request.getCurrency());
        }
        property.setBadge(request.getBadge());
        property.setBedrooms(request.getBedrooms());
        property.setBathrooms(request.getBathrooms());
        property.setArea(request.getArea());
        property.setHouseRules(request.getHouseRules());
        property.setAmenities(request.getAmenities() == null ? List.of() : request.getAmenities());
        Property updated = propertyRepository.save(property);
        return toResponse(updated);
    }

    @Override
    @CacheEvict(value = {"propertyPages", "propertyById"}, allEntries = true)
    public void delete(String id, String email) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Property not found"));
        User current = getUserByEmail(email);
        requireOwnerOrProprietor(property, current);
        propertyRepository.delete(property);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "propertyPages", key = "#pageable.pageNumber + ':' + #pageable.pageSize + ':' + #pageable.sort.toString()")
    public Page<PropertyResponse> findAll(Pageable pageable) {
        return propertyRepository.findAll(pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PropertyResponse> findMine(String email, Pageable pageable) {
        User owner = getUserByEmail(email);
        return propertyRepository.findByHostId(owner.getId(), pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "propertyById", key = "#id")
    public PropertyResponse findById(String id) {
        return propertyRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Property not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PropertyResponse> search(String location,
                                         BigDecimal minPrice,
                                         BigDecimal maxPrice,
                                         Boolean available,
                                         LocalDate checkInDate,
                                         LocalDate checkOutDate,
                                         String type,
                                         Integer bedrooms,
                                         List<String> amenities,
                                         Pageable pageable) {
        List<Criteria> criteriaList = new ArrayList<>();

        if (location != null && !location.isBlank()) {
            criteriaList.add(Criteria.where("location").regex(location, "i"));
        }

        if (minPrice != null || maxPrice != null) {
            Criteria priceCriteria = Criteria.where("pricePerNight");
            if (minPrice != null) {
                priceCriteria = priceCriteria.gte(minPrice);
            }
            if (maxPrice != null) {
                priceCriteria = priceCriteria.lte(maxPrice);
            }
            criteriaList.add(priceCriteria);
        }

        if (available != null) {
            criteriaList.add(Criteria.where("available").is(available));
        }

        if (type != null && !type.isBlank()) {
            criteriaList.add(Criteria.where("type").regex(type, "i"));
        }

        if (bedrooms != null && bedrooms > 0) {
            criteriaList.add(Criteria.where("bedrooms").gte(bedrooms));
        }

        if (amenities != null && !amenities.isEmpty()) {
            criteriaList.add(Criteria.where("amenities").all(amenities));
        }

        if (checkInDate != null && checkOutDate != null && checkOutDate.isAfter(checkInDate)) {
            Query bookingOverlapQuery = new Query();
            bookingOverlapQuery.addCriteria(new Criteria().andOperator(
                Criteria.where("status").in(BookingStatus.CONFIRMED),
                    Criteria.where("checkInDate").lt(checkOutDate),
                    Criteria.where("checkOutDate").gt(checkInDate)
            ));

            Set<String> unavailableListingIds = mongoTemplate.find(bookingOverlapQuery, Booking.class)
                    .stream()
                    .map(Booking::getListingId)
                    .filter(id -> id != null && !id.isBlank())
                    .collect(Collectors.toSet());

            if (!unavailableListingIds.isEmpty()) {
                criteriaList.add(Criteria.where("_id").nin(unavailableListingIds));
            }
        }

        Query query = new Query();
        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }
        Pageable effectivePageable = pageable == null ? Pageable.unpaged() : pageable;
        query.with(effectivePageable);

        List<Property> results = mongoTemplate.find(query, Property.class);
        long total = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), Property.class);
        List<PropertyResponse> responses = results.stream()
                .map(this::toResponse)
                .toList();

        return new PageImpl<>(responses, effectivePageable, total);
    }

    @Override
    public List<PropertyResponse> findPendingApproval() {
        return propertyRepository.findByPendingApprovalTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    private PropertyResponse toResponse(Property property) {
        return PropertyResponse.builder()
                .id(property.getId())
                .title(property.getTitle())
            .description(property.getDescription())
                .location(property.getLocation())
            .latitude(property.getLatitude())
            .longitude(property.getLongitude())
            .pricePerNight(property.getPricePerNight())
            .currency(property.getCurrency())
            .images(property.getImages())
            .hostId(property.getHostId())
            .createdAt(property.getCreatedAt())
            .available(property.getAvailable())
            .type(property.getType())
            .currency(property.getCurrency())
            .badge(property.getBadge())
            .bedrooms(property.getBedrooms())
            .bathrooms(property.getBathrooms())
            .area(property.getArea())
            .houseRules(property.getHouseRules())
            .amenities(property.getAmenities())
            .averageRating(property.getAverageRating())
            .rating(property.getRating())
            .reviewCount(property.getReviewCount())
            .pendingApproval(property.getPendingApproval())
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private void requireOwnerOrProprietor(Property property, User user) {
        boolean isOwner = property.getHostId() != null && property.getHostId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new IllegalArgumentException("Not authorized to modify this property");
        }
    }
}

