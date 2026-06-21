package com.maskan.api.controller;

import com.maskan.api.dto.ConnectionRequestActionRequest;
import com.maskan.api.dto.ConnectionRequestResponse;
import com.maskan.api.service.ConnectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/connections")
@CrossOrigin(origins = "${app.cors.allowed-origin:https://maskan-app.vercel.app}")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;

    @PostMapping("/request")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConnectionRequestResponse> sendRequest(@AuthenticationPrincipal UserDetails principal,
                                                                 @Valid @RequestBody ConnectionRequestActionRequest request) {
        return ResponseEntity.ok(connectionService.sendRequest(principal.getUsername(), request.getTargetUserId()));
    }

    @PatchMapping("/{id}/accept")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConnectionRequestResponse> acceptRequest(@AuthenticationPrincipal UserDetails principal,
                                                                   @PathVariable String id) {
        return ResponseEntity.ok(connectionService.acceptRequest(id, principal.getUsername()));
    }

    @GetMapping("/pending")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ConnectionRequestResponse>> pendingRequests(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(connectionService.listPendingRequests(principal.getUsername()));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ConnectionRequestResponse>> connections(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(connectionService.listUserConnections(principal.getUsername()));
    }
}
