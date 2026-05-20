package com.maskan.api.service.impl;

import com.maskan.api.dto.ReviewDto;
import com.maskan.api.dto.ReviewResponse;
import com.maskan.api.entity.BookingStatus;
import com.maskan.api.entity.Property;
import com.maskan.api.entity.Review;
import com.maskan.api.entity.User;
import com.maskan.api.exception.ForbiddenException;
import com.maskan.api.exception.NotFoundException;
import com.maskan.api.repository.BookingRepository;
import com.maskan.api.repository.PropertyRepository;
import com.maskan.api.repository.ReviewRepository;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    @Override
    public Review createReview(ReviewDto dto, String currentUserId) {
        validateRating(dto.getRating());

        Property property = propertyRepository.findById(dto.getPropertyId())
                .orElseThrow(() -> new NotFoundException("Property not found"));
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (reviewRepository.existsByPropertyIdAndAuthorId(property.getId(), user.getId())) {
            throw new IllegalArgumentException("You already reviewed this property");
        }

        boolean canReview = canUserReviewProperty(user.getId(), property.getId());
        if (!canReview) {
            throw new ForbiddenException("Only verified guests who completed a stay can review this property");
        }

        Review review = Review.builder()
                .propertyId(property.getId())
                .authorId(user.getId())
                .authorName(resolveAuthorName(user))
                .rating(dto.getRating())
                .comment(dto.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        recalculatePropertyAverageRating(property.getId());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByProperty(String propertyId) {
        return reviewRepository.findByPropertyId(propertyId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserReviewProperty(String userId, String propertyId) {
        return bookingRepository.existsByGuestIdAndPropertyIdAndStatus(
                userId,
                propertyId,
                BookingStatus.COMPLETED
        );
    }

    private void recalculatePropertyAverageRating(String propertyId) {
        List<Review> reviews = reviewRepository.findByPropertyId(propertyId);
        if (reviews.isEmpty()) {
            return;
        }

        double average = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        double roundedAverage = BigDecimal.valueOf(average)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NotFoundException("Property not found"));
        property.setAverageRating(roundedAverage);
        property.setRating(roundedAverage);
        property.setReviewCount(reviews.size());
        propertyRepository.save(property);
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .propertyId(review.getPropertyId())
                .authorId(review.getAuthorId())
                .authorName(review.getAuthorName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private String resolveAuthorName(User user) {
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName();
        }
        return user.getEmail();
    }

    private void validateRating(Integer rating) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
    }
}

