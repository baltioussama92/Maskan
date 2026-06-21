package com.maskan.api.controller;

import com.maskan.api.dto.PropertyResponse;
import com.maskan.api.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "${app.cors.allowed-origin:https://maskan-app.vercel.app}")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<PropertyResponse>> getWishlist(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(wishlistService.getWishlist(principal.getUsername()));
    }

    @PostMapping("/{listingId}")
    public ResponseEntity<List<PropertyResponse>> add(@PathVariable String listingId,
                                                      @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(wishlistService.addToWishlist(listingId, principal.getUsername()));
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<List<PropertyResponse>> remove(@PathVariable String listingId,
                                                         @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(wishlistService.removeFromWishlist(listingId, principal.getUsername()));
    }
}
