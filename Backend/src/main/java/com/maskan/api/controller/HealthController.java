package com.maskan.api.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @Value("${app.cors.allowed-origin:}")
    private String corsAllowedOrigin;

    @Value("${spring.data.mongodb.uri:}")
    private String mongoUri;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> checks = new LinkedHashMap<>();
        checks.put("mongodbConfigured", StringUtils.hasText(mongoUri));
        checks.put("jwtConfigured", StringUtils.hasText(jwtSecret));
        checks.put("cloudinaryConfigured", StringUtils.hasText(cloudinaryCloudName));
        checks.put("corsAllowedOrigin", StringUtils.hasText(corsAllowedOrigin) ? corsAllowedOrigin : "not-set");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "ok");
        body.put("service", "maskan-backend");
        body.put("timestamp", Instant.now().toString());
        body.put("checks", checks);

        return ResponseEntity.ok(body);
    }
}
