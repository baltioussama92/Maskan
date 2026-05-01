package com.maskan.api.service;

import com.maskan.api.dto.AdminActionResponse;
import com.maskan.api.dto.BookingResponse;
import com.maskan.api.dto.AdminGrowthMetricsResponse;
import com.maskan.api.dto.AdminHistoryEventResponse;
import com.maskan.api.dto.AdminUpdateUserPasswordRequest;
import com.maskan.api.dto.AdminUpdateUserRequest;
import com.maskan.api.dto.AdminUserBookingResponse;
import com.maskan.api.dto.AdminUserEarningsResponse;
import com.maskan.api.dto.AdminUserListingResponse;
import com.maskan.api.dto.AdminUserMessageResponse;
import com.maskan.api.dto.AdminUserOverviewResponse;
import com.maskan.api.dto.AdminUserPermissionsResponse;
import com.maskan.api.dto.HostDemandResponse;
import com.maskan.api.dto.PropertyResponse;
import com.maskan.api.dto.UserDto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminService {
    List<UserDto> listUsers();
    UserDto banUser(String userId);
    UserDto blockUser(String userId);
    Page<BookingResponse> listBookings(Pageable pageable);
    Page<PropertyResponse> listPendingListings(Pageable pageable);
    PropertyResponse verifyProperty(String propertyId);
    AdminGrowthMetricsResponse growthMetrics();

    AdminUserOverviewResponse userOverview(String userId);
    List<AdminHistoryEventResponse> userHistory(String userId, int limit, String cursor);
    List<AdminUserMessageResponse> userMessages(String userId, int limit, String cursor, String direction, String withUserId);
    List<AdminUserListingResponse> userListings(String userId);
    List<AdminUserBookingResponse> userBookings(String userId, String role);
    AdminUserEarningsResponse userEarnings(String userId);
    UserDto updateUser(String userId, AdminUpdateUserRequest request);
    AdminActionResponse updateUserPassword(String userId, AdminUpdateUserPasswordRequest request);
    AdminActionResponse deleteUser(String userId);
    AdminUserPermissionsResponse userPermissions(String userId);
    UserDto approveGuestVerification(String userId);
    UserDto rejectGuestVerification(String userId, String reason);
    List<HostDemandResponse> listHostDemands(String status);
    HostDemandResponse hostDemandById(String demandId);
    HostDemandResponse approveHostDemand(String demandId);
    HostDemandResponse rejectHostDemand(String demandId, String reason);
}

