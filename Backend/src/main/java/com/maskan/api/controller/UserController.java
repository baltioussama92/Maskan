package com.maskan.api.controller;

import com.maskan.api.dto.UpdateUserProfileRequest;
import com.maskan.api.dto.UpdateMyPasswordRequest;
import com.maskan.api.dto.UpdateUserPreferencesRequest;
import com.maskan.api.dto.UserDto;
import com.maskan.api.dto.UserPreferencesDto;
import com.maskan.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "${app.cors.allowed-origin:http://localhost:5173}")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(userService.getMe(principal.getUsername()));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> updateMe(@AuthenticationPrincipal UserDetails principal,
                                            @Valid @RequestBody UpdateUserProfileRequest request) {
        return ResponseEntity.ok(userService.updateMe(principal.getUsername(), request));
    }

    @PatchMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> updateMyPassword(@AuthenticationPrincipal UserDetails principal,
                                                 @Valid @RequestBody UpdateMyPasswordRequest request) {
        userService.updateMyPassword(principal.getUsername(), request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> updateMyPasswordPut(@AuthenticationPrincipal UserDetails principal,
                                                    @Valid @RequestBody UpdateMyPasswordRequest request) {
        userService.updateMyPassword(principal.getUsername(), request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserPreferencesDto> getMyPreferences(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(userService.getMyPreferences(principal.getUsername()));
    }

    @PutMapping("/me/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserPreferencesDto> updateMyPreferences(@AuthenticationPrincipal UserDetails principal,
                                                                  @RequestBody UpdateUserPreferencesRequest request) {
        return ResponseEntity.ok(userService.updateMyPreferences(principal.getUsername(), request));
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<java.util.List<UserDto>> searchUsers(@AuthenticationPrincipal UserDetails principal,
                                                               @RequestParam("q") String query) {
        return ResponseEntity.ok(userService.searchUsers(query, principal.getUsername()));
    }
}
