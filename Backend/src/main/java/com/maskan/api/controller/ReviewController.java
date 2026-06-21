package com.maskan.api.controller;

import com.maskan.api.dto.ReviewDto;
import com.maskan.api.dto.ReviewResponse;
import com.maskan.api.entity.Review;
import com.maskan.api.entity.User;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "${app.cors.allowed-origin:https://maskan-app.vercel.app}")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    @PostMapping("/api/properties/{propertyId}/reviews")
    @PreAuthorize("hasAnyRole('GUEST','TENANT','HOST')")
    public ResponseEntity<ReviewResponse> create(@PathVariable String propertyId,
                                                 @Valid @RequestBody ReviewDto request,
                                                 @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        ReviewDto payload = request.toBuilder()
                .propertyId(propertyId)
                .build();
        Review created = reviewService.createReview(payload, user.getId());
        return ResponseEntity.ok(ReviewResponse.builder()
                .id(created.getId())
                .propertyId(created.getPropertyId())
                .userId(created.getUserId())
                .reservationId(created.getReservationId())
                .authorName(created.getAuthorName())
                .rating(created.getRating())
                .description(created.getDescription())
                .createdAt(created.getCreatedAt())
                .build());
    }

    @GetMapping("/api/properties/{propertyId}/reviews")
    public ResponseEntity<List<ReviewResponse>> listByProperty(@PathVariable String propertyId) {
        return ResponseEntity.ok(reviewService.getReviewsByProperty(propertyId));
    }

    @GetMapping("/api/reviews/eligibility/{propertyId}")
    public ResponseEntity<java.util.Map<String, Object>> canReview(@PathVariable String propertyId,
                                             Authentication authentication) {
        boolean isAuthenticated = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);

        if (!isAuthenticated) {
            return ResponseEntity.ok(java.util.Map.of("eligible", false));
        }

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(java.util.Map.of("eligible", false));
        }

        String reservationId = reviewService.getEligibleReservationId(user.getId(), propertyId);
        boolean canReview = reservationId != null;

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("eligible", canReview);
        if (canReview) {
            response.put("reservationId", reservationId);
        }

        return ResponseEntity.ok(response);
    }
}

