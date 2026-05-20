package com.maskan.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.util.StringUtils;

import java.util.Properties;

@Configuration
public class MailConfig {

    @Bean
    public JavaMailSender javaMailSender(
            @Value("${spring.mail.host:smtp.gmail.com}") String host,
            @Value("${spring.mail.port:587}") String port,
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password,
            @Value("${spring.mail.properties.mail.smtp.auth:true}") boolean auth,
            @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") boolean startTls,
            @Value("${spring.mail.properties.mail.smtp.starttls.required:true}") boolean startTlsRequired,
            @Value("${spring.mail.properties.mail.smtp.ssl.protocols:TLSv1.2 TLSv1.3}") String sslProtocols,
            @Value("${spring.mail.properties.mail.debug:false}") boolean debug,
            @Value("${spring.mail.properties.mail.smtp.connectiontimeout:5000}") String connectionTimeout,
            @Value("${spring.mail.properties.mail.smtp.timeout:5000}") String timeout,
            @Value("${spring.mail.properties.mail.smtp.writetimeout:5000}") String writeTimeout
    ) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(sanitizeText(fallback(host, "smtp.gmail.com")));
        sender.setPort(parsePort(port));
        sender.setUsername(sanitizeText(safeTrim(username)));
        sender.setPassword(normalizeAppPassword(password));

        Properties properties = sender.getJavaMailProperties();
        properties.put("mail.transport.protocol", "smtp");
        properties.put("mail.smtp.auth", String.valueOf(auth));
        properties.put("mail.smtp.starttls.enable", String.valueOf(startTls));
        properties.put("mail.smtp.starttls.required", String.valueOf(startTlsRequired));
        properties.put("mail.smtp.ssl.protocols", sanitizeText(fallback(sslProtocols, "TLSv1.2 TLSv1.3")));
        properties.put("mail.debug", String.valueOf(debug));
        properties.put("mail.smtp.connectiontimeout", normalizeIntegerProperty(connectionTimeout, 5000));
        properties.put("mail.smtp.timeout", normalizeIntegerProperty(timeout, 5000));
        properties.put("mail.smtp.writetimeout", normalizeIntegerProperty(writeTimeout, 5000));

        return sender;
    }

    private int parsePort(String rawPort) {
        String value = sanitizeText(fallback(rawPort, "587"));
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            return 587;
        }
    }

    private String fallback(String value, String fallbackValue) {
        return StringUtils.hasText(value) ? value.trim() : fallbackValue;
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeAppPassword(String value) {
        if (value == null) {
            return "";
        }
        String normalized = value.replaceAll("\\s+", "").trim();
        return stripWrappingQuotes(normalized);
    }

    private String normalizeIntegerProperty(String value, int fallbackValue) {
        String normalized = sanitizeText(value);
        try {
            int parsed = Integer.parseInt(normalized);
            return String.valueOf(Math.max(parsed, 0));
        } catch (Exception exception) {
            return String.valueOf(fallbackValue);
        }
    }

    private String sanitizeText(String value) {
        String trimmed = safeTrim(value);
        if (!StringUtils.hasText(trimmed)) {
            return "";
        }
        return stripWrappingQuotes(trimmed);
    }

    private String stripWrappingQuotes(String value) {
        String output = value;
        while (output.length() >= 2 && ((output.startsWith("\"") && output.endsWith("\"")) || (output.startsWith("'") && output.endsWith("'")))) {
            output = output.substring(1, output.length() - 1).trim();
        }
        return output;
    }
}
