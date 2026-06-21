package com.maskan.api.controller;

import com.maskan.api.entity.Notification;
import com.maskan.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "${app.cors.allowed-origin:https://maskan-app.vercel.app}")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Notification>> me(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(notificationService.getMyNotifications(principal.getUsername()));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Notification> markAsRead(@PathVariable String id,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(notificationService.markAsRead(id, principal.getUsername()));
    }

    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(@AuthenticationPrincipal UserDetails principal) {
        int updated = notificationService.markAllAsRead(principal.getUsername());
        return ResponseEntity.ok(Map.of("updated", updated));
    }
}
