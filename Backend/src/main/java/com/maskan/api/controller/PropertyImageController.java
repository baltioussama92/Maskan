package com.maskan.api.controller;

import com.maskan.api.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/uploads")
@CrossOrigin(origins = "${app.cors.allowed-origin:https://maskan-app.vercel.app}")
@RequiredArgsConstructor
public class PropertyImageController {

    private final CloudinaryService cloudinaryService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping("/images")
    @PreAuthorize("hasAnyRole('HOST','PROPRIETOR','ADMIN')")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file,
                                                            @AuthenticationPrincipal UserDetails principal) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
        }

        String fileUrl;
        String fileName;

        if (cloudinaryService.isEnabled()) {
            fileUrl = cloudinaryService.uploadImage(file);
            fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
        } else {
            String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "image" : file.getOriginalFilename());
            String extension = "";
            int dot = originalName.lastIndexOf('.');
            if (dot >= 0) {
                extension = originalName.substring(dot);
            }

            Path targetDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(targetDirectory);

            fileName = Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + extension;
            Path targetFile = targetDirectory.resolve(fileName);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            fileUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(fileName)
                    .toUriString();
        }

        Map<String, String> response = new HashMap<>();
        response.put("fileName", fileName);
        response.put("url", fileUrl);
        response.put("uploadedBy", principal.getUsername());

        return ResponseEntity.status(201).body(response);
    }

    @GetMapping("/images/resize")
    public ResponseEntity<byte[]> resizeImage(@RequestParam("file") String fileName,
                                              @RequestParam(value = "w", required = false) Integer width,
                                              @RequestParam(value = "h", required = false) Integer height) throws IOException {
        if (!StringUtils.hasText(fileName) || fileName.contains("/") || fileName.contains("\\") || fileName.contains("..")) {
            return ResponseEntity.badRequest().build();
        }

        int targetWidth = clampSize(width);
        int targetHeight = clampSize(height);
        if (targetWidth <= 0 && targetHeight <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Path baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path targetFile = baseDir.resolve(fileName).normalize();
        if (!targetFile.startsWith(baseDir) || !Files.exists(targetFile)) {
            return ResponseEntity.notFound().build();
        }

        BufferedImage original = ImageIO.read(targetFile.toFile());
        if (original == null) {
            return ResponseEntity.status(415).build();
        }

        if (targetWidth <= 0) {
            targetWidth = (int) Math.round((double) targetHeight * original.getWidth() / original.getHeight());
        }
        if (targetHeight <= 0) {
            targetHeight = (int) Math.round((double) targetWidth * original.getHeight() / original.getWidth());
        }

        String format = resolveFormat(fileName);
        int imageType = original.getType() == 0 ? BufferedImage.TYPE_INT_RGB : original.getType();
        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, imageType);
        Graphics2D graphics = resized.createGraphics();
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        graphics.drawImage(original, 0, 0, targetWidth, targetHeight, null);
        graphics.dispose();

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(resized, format, outputStream);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType("png".equals(format) ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG);
        headers.setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic());

        return ResponseEntity.ok()
                .headers(headers)
                .body(outputStream.toByteArray());
    }

    private int clampSize(Integer value) {
        if (value == null) {
            return 0;
        }
        int normalized = Math.max(0, value);
        return Math.min(normalized, 2048);
    }

    private String resolveFormat(String fileName) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) {
            return "png";
        }
        return "jpg";
    }
}
