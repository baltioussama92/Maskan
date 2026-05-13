package com.maskan.api.service;

import com.maskan.api.dto.UpdateUserProfileRequest;
import com.maskan.api.dto.UserDto;
import com.maskan.api.dto.UpdateMyPasswordRequest;
import com.maskan.api.dto.UpdateUserPreferencesRequest;
import com.maskan.api.dto.UserPreferencesDto;

import java.util.List;

public interface UserService {
    UserDto getMe(String email);
    UserDto updateMe(String email, UpdateUserProfileRequest request);
    void updateMyPassword(String email, UpdateMyPasswordRequest request);
    UserPreferencesDto getMyPreferences(String email);
    UserPreferencesDto updateMyPreferences(String email, UpdateUserPreferencesRequest request);
    List<UserDto> searchUsers(String query, String currentUserEmail);
}
