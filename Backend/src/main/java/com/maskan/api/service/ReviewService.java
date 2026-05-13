package com.maskan.api.service;

import com.maskan.api.dto.ReviewRequest;
import com.maskan.api.dto.ReviewResponse;

import java.util.List;

public interface ReviewService {
    ReviewResponse createReview(ReviewRequest request, String email);
    List<ReviewResponse> getReviewsByProperty(String propertyId);
    boolean canUserReviewProperty(String userId, String propertyId);
}

