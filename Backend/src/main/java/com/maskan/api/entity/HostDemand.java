package com.maskan.api.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "host_demands")
public class HostDemand {
    @Id
    private String id;
    private String userId;
    private String fullName;
    private String email;
    private String phone;
    private Instant submittedDate;
    private String idDocumentUrl;
    private String selfieUrl;
    private String propertyProofUrl;
    @Builder.Default
    private HostDemandStatus idStatus = HostDemandStatus.PENDING;

    private String proposedLocation;
    private Double proposedPricePerNight;
    private List<String> housePictures;

    @Builder.Default
    private HostDemandStatus status = HostDemandStatus.PENDING;
}
