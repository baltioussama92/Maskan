package com.maskan.api.controller;

import com.maskan.api.dto.AdminActionResponse;
import com.maskan.api.dto.AdminHistoryEventResponse;
import com.maskan.api.dto.AdminRejectGuestVerificationRequest;
import com.maskan.api.dto.AdminUpdateUserPasswordRequest;
import com.maskan.api.dto.AdminUpdateUserRequest;
import com.maskan.api.dto.AdminUserBookingResponse;
import com.maskan.api.dto.AdminUserEarningsResponse;
import com.maskan.api.dto.AdminUserListingResponse;
import com.maskan.api.dto.AdminUserMessageResponse;
import com.maskan.api.dto.AdminUserOverviewResponse;
import com.maskan.api.dto.AdminUserPermissionsResponse;
import com.maskan.api.dto.BookingResponse;
import com.maskan.api.dto.AdminGrowthMetricsResponse;
import com.maskan.api.dto.HostDemandResponse;
import com.maskan.api.dto.PropertyResponse;
import com.maskan.api.dto.UserDto;
import com.maskan.api.service.AdminService;
import java.util.Map;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "${app.cors.allowed-origin:http://localhost:5173}")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> users() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<UserDto> banUser(@PathVariable String id) {
        return ResponseEntity.ok(adminService.banUser(id));
    }

    @PutMapping("/users/{id}/block")
    public ResponseEntity<UserDto> blockUser(@PathVariable String id) {
        return ResponseEntity.ok(adminService.blockUser(id));
    }

    @GetMapping("/bookings")
    public ResponseEntity<Page<BookingResponse>> bookings(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.listBookings(pageable));
    }

    @GetMapping("/pending-listings")
    public ResponseEntity<Page<PropertyResponse>> pendingListings(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.listPendingListings(pageable));
    }

    @PutMapping("/properties/{id}/verify")
    public ResponseEntity<PropertyResponse> verifyProperty(@PathVariable String id) {
        return ResponseEntity.ok(adminService.verifyProperty(id));
    }

    @GetMapping("/growth-metrics")
    public ResponseEntity<AdminGrowthMetricsResponse> growthMetrics() {
        return ResponseEntity.ok(adminService.growthMetrics());
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminGrowthMetricsResponse> stats() {
        return ResponseEntity.ok(adminService.growthMetrics());
    }

    @GetMapping("/users/{userId}/overview")
    public ResponseEntity<AdminUserOverviewResponse> userOverview(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.userOverview(userId));
    }

    @GetMapping("/users/{userId}/history")
    public ResponseEntity<List<AdminHistoryEventResponse>> userHistory(@PathVariable String userId,
                                                                       @RequestParam(defaultValue = "50") int limit,
                                                                       @RequestParam(required = false) String cursor) {
        return ResponseEntity.ok(adminService.userHistory(userId, limit, cursor));
    }

    @GetMapping("/users/{userId}/messages")
    public ResponseEntity<List<AdminUserMessageResponse>> userMessages(@PathVariable String userId,
                                                                       @RequestParam(defaultValue = "50") int limit,
                                                                       @RequestParam(required = false) String cursor,
                                                                       @RequestParam(defaultValue = "all") String direction,
                                                                       @RequestParam(required = false) String withUserId) {
        return ResponseEntity.ok(adminService.userMessages(userId, limit, cursor, direction, withUserId));
    }

    @GetMapping("/users/{userId}/listings")
    public ResponseEntity<List<AdminUserListingResponse>> userListings(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.userListings(userId));
    }

    @GetMapping("/users/{userId}/bookings")
    public ResponseEntity<List<AdminUserBookingResponse>> userBookings(@PathVariable String userId,
                                                                       @RequestParam(defaultValue = "all") String role) {
        return ResponseEntity.ok(adminService.userBookings(userId, role));
    }

    @GetMapping("/users/{userId}/earnings")
    public ResponseEntity<AdminUserEarningsResponse> userEarnings(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.userEarnings(userId));
    }

    @PatchMapping("/users/{userId}")
    public ResponseEntity<UserDto> updateUser(@PathVariable String userId,
                                              @Valid @RequestBody AdminUpdateUserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(userId, request));
    }

    @PatchMapping("/users/{userId}/password")
    public ResponseEntity<AdminActionResponse> updateUserPassword(@PathVariable String userId,
                                                                  @Valid @RequestBody AdminUpdateUserPasswordRequest request) {
        return ResponseEntity.ok(adminService.updateUserPassword(userId, request));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<AdminActionResponse> deleteUser(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.deleteUser(userId));
    }

    @GetMapping("/users/{userId}/permissions")
    public ResponseEntity<AdminUserPermissionsResponse> userPermissions(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.userPermissions(userId));
    }

    @GetMapping("/guest-verifications")
    public ResponseEntity<List<UserDto>> guestVerifications() {
        return ResponseEntity.ok(adminService.listGuestVerifications());
    }

    @PatchMapping("/guest-verifications/{userId}/approve")
    public ResponseEntity<UserDto> approveGuestVerification(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.approveGuestVerification(userId));
    }

    @PatchMapping("/guest-verifications/{userId}/reject")
    public ResponseEntity<UserDto> rejectGuestVerification(@PathVariable String userId,
                                                            @RequestBody(required = false) AdminRejectGuestVerificationRequest request) {
        String reason = request == null ? null : request.getReason();
        return ResponseEntity.ok(adminService.rejectGuestVerification(userId, reason));
    }

    @GetMapping("/host-demands")
    public ResponseEntity<List<HostDemandResponse>> hostDemands(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminService.listHostDemands(status));
    }

    @GetMapping("/host-demands/{demandId}")
    public ResponseEntity<HostDemandResponse> hostDemandById(@PathVariable String demandId) {
        return ResponseEntity.ok(adminService.hostDemandById(demandId));
    }

    @PutMapping("/host-demands/{demandId}/status")
    public ResponseEntity<HostDemandResponse> updateHostDemandStatus(@PathVariable String demandId, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if ("APPROVED".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(adminService.approveHostDemand(demandId));
        }
        if ("REJECTED".equalsIgnoreCase(status)) {
            String reason = body.get("reason");
            return ResponseEntity.ok(adminService.rejectHostDemand(demandId, reason));
        }
        return ResponseEntity.ok(adminService.hostDemandById(demandId));
    }
}

