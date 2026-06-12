package com.maskan.api.service;

import com.maskan.api.dto.AuthResponse;
import com.maskan.api.dto.LoginRequest;
import com.maskan.api.dto.RegisterRequest;
import com.maskan.api.dto.UserDto;
import com.maskan.api.dto.VerifyPasswordOtpRequest;
import com.maskan.api.dto.ResetPasswordRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserDto getCurrentUser(String email);
    
    void forgotPassword(String email);
    boolean verifyPasswordOtp(VerifyPasswordOtpRequest request);
    void resetPassword(ResetPasswordRequest request);
}

