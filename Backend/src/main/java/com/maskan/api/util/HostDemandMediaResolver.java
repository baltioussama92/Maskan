package com.maskan.api.util;

import com.maskan.api.entity.HostDemand;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class HostDemandMediaResolver {

    private HostDemandMediaResolver() {
    }

    public record ResolvedMedia(String selfieUrl, String propertyProofUrl, List<String> housePictures) {
    }

    public static ResolvedMedia resolve(HostDemand demand) {
        List<String> stored = demand.getHousePictures() == null ? List.of() : demand.getHousePictures();
        boolean usesDedicatedFields = StringUtils.hasText(demand.getSelfieUrl())
                || StringUtils.hasText(demand.getPropertyProofUrl());

        String selfieUrl = demand.getSelfieUrl();
        if (!StringUtils.hasText(selfieUrl) && !stored.isEmpty()) {
            selfieUrl = stored.get(0);
        }

        String propertyProofUrl = demand.getPropertyProofUrl();
        if (!StringUtils.hasText(propertyProofUrl) && stored.size() > 1) {
            propertyProofUrl = stored.get(1);
        }

        List<String> housePictures;
        if (usesDedicatedFields) {
            housePictures = new ArrayList<>(stored);
        } else if (stored.size() > 2) {
            housePictures = new ArrayList<>(stored.subList(2, stored.size()));
        } else {
            housePictures = List.of();
        }

        return new ResolvedMedia(
                StringUtils.hasText(selfieUrl) ? selfieUrl : null,
                StringUtils.hasText(propertyProofUrl) ? propertyProofUrl : null,
                housePictures
        );
    }
}
