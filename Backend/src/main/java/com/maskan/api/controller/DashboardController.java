package com.maskan.api.controller;

import com.maskan.api.dto.AdminDashboardSummaryResponse;
import com.maskan.api.dto.HostDashboardSummaryResponse;
import com.maskan.api.dto.TenantDashboardSummaryResponse;
import com.maskan.api.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "${app.cors.allowed-origin:https://maskan-app.vercel.app}")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/tenant/summary")
    @PreAuthorize("hasAnyRole('GUEST','TENANT')")
    public ResponseEntity<TenantDashboardSummaryResponse> tenantSummary(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(dashboardService.getTenantSummary(principal.getUsername()));
    }

    @GetMapping("/host/summary")
    @PreAuthorize("hasAnyRole('HOST','PROPRIETOR','ADMIN')")
    public ResponseEntity<HostDashboardSummaryResponse> hostSummary(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(dashboardService.getHostSummary(principal.getUsername()));
    }

    @GetMapping("/admin/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardSummaryResponse> adminSummary(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(dashboardService.getAdminSummary(principal.getUsername()));
    }
}
