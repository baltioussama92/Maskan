package com.maskan.api.service;

import com.maskan.api.dto.PhoneOtpSendResponse;
import com.maskan.api.dto.VerificationSummaryResponse;
import com.maskan.api.entity.User;

public interface PhoneVerificationService {

	PhoneOtpSendResponse sendOtp(User user, String phoneNumber);

	VerificationSummaryResponse verifyOtp(User user, String reqId, String code);
}
