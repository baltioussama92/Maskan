package com.maskan.api.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.folder:maskan/properties}")
    private String folder;

    public CloudinaryService(@Autowired(required = false) Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public boolean isEnabled() {
        return cloudinary != null;
    }

    public String uploadImage(MultipartFile file) throws IOException {
        if (!isEnabled()) {
            throw new IllegalStateException("Cloudinary is not configured");
        }

        String publicId = folder + "/" + System.currentTimeMillis() + "-" + UUID.randomUUID();

        @SuppressWarnings("unchecked")
        Map<String, Object> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "public_id", publicId,
                        "resource_type", "image",
                        "overwrite", false
                )
        );

        Object url = result.get("secure_url");
        if (url == null || !StringUtils.hasText(url.toString())) {
            throw new IOException("Cloudinary upload did not return a URL");
        }
        return url.toString();
    }
}
