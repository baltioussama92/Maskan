package com.maskan.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HostDemandResponse {
    private String id;
    private String userId;
    private String userName;
    private String userEmail;
    private String userPhone;
    private String status;
    private String submittedDate;
    private List<String> documents;
    private String idDocument;
    private String selfieUrl;
    private String propertyProofUrl;
    private String idVerificationStatus;
    private List<String> housePictures;
    private double proposedPrice;
    private String proposedLocation;
    private String bio;
    private String notes;
    private String message;
}
