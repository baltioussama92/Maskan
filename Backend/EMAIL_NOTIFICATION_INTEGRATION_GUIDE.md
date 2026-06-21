# 📧 Email Notification System - Integration Guide

## Overview
Cette guide vous montre exactement comment intégrer les 4 nouveaux emails asynchrones dans les services existants de Maskan.

---

## ✅ Step 1: Configuration Completed

- ✅ `@EnableAsync` added to `HouseRentalApplication.java`
- ✅ All email methods in `EmailService` annotated with `@Async`
- ✅ 4 HTML email templates with professional design

---

## Step 2: Service Integration Snippets

### A. UserService - Password Changed Alert

**File:** `UserServiceImpl.java`

**Current Code (Line ~76):**
```java
@Override
public void updateMyPassword(String email, UpdateMyPasswordRequest request) {
    User user = findByEmail(email);

    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
        throw new IllegalArgumentException("Current password is incorrect");
    }

    if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
        throw new IllegalArgumentException("New password must be different from current password");
    }

    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    userRepository.save(user);
    notificationService.sendInternalNotification(
        user.getId(),
        "Security Alert",
        "Your password was changed. If this was not you, contact support immediately.",
        NotificationType.SYSTEM
    );
}
```

**Required Changes:**

1. **Add EmailService injection:**
```java
@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final EmailService emailService;  // ← ADD THIS
```

2. **Update updateMyPassword method:**
```java
@Override
public void updateMyPassword(String email, UpdateMyPasswordRequest request) {
    User user = findByEmail(email);

    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
        throw new IllegalArgumentException("Current password is incorrect");
    }

    if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
        throw new IllegalArgumentException("New password must be different from current password");
    }

    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    userRepository.save(user);
    
    // Internal notification
    notificationService.sendInternalNotification(
        user.getId(),
        "Security Alert",
        "Your password was changed. If this was not you, contact support immediately.",
        NotificationType.SYSTEM
    );
    
    // ← ADD EMAIL NOTIFICATION (Non-blocking, async)
    emailService.sendPasswordChangedAlert(user.getEmail());
}
```

---

### B. MessageService - New Message Alert

**File:** `MessageServiceImpl.java`

**Current Code (Line ~43):**
```java
public MessageResponse send(MessageRequest request, String email) {
    User sender = getUserByEmail(email);
    User receiver = getUserByEmail(request.getReceiverEmail());

    if (!canUsersMessage(sender, receiver)) {
        throw new IllegalArgumentException("You cannot message this user");
    }

    Message message = Message.builder()
        .senderId(sender.getId())
        .receiverId(receiver.getId())
        .content(request.getContent().trim())
        .createdAt(Instant.now())
        .build();

    Message saved = messageRepository.save(message);
    return toResponse(saved);
}
```

**Required Changes:**

1. **Add EmailService injection:**
```java
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;  // ← ADD THIS
```

2. **Update send method:**
```java
public MessageResponse send(MessageRequest request, String email) {
    User sender = getUserByEmail(email);
    User receiver = getUserByEmail(request.getReceiverEmail());

    if (!canUsersMessage(sender, receiver)) {
        throw new IllegalArgumentException("You cannot message this user");
    }

    Message message = Message.builder()
        .senderId(sender.getId())
        .receiverId(receiver.getId())
        .content(request.getContent().trim())
        .createdAt(Instant.now())
        .build();

    Message saved = messageRepository.save(message);
    
    // ← ADD EMAIL NOTIFICATION (Non-blocking, async)
    emailService.sendNewMessageAlert(receiver.getEmail(), sender.getName());
    
    return toResponse(saved);
}
```

---

### C. SupportTicketService - Support Reply Alert

**File:** `SupportTicketServiceImpl.java`

**Note:** First, add a method to handle admin reply. Currently not visible, so here's the pattern:

```java
@Service
@RequiredArgsConstructor
@Transactional
public class SupportTicketServiceImpl implements SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;  // ← ADD THIS
    
    // Existing methods...

    // ← ADD THIS NEW METHOD for admin replies
    @Override
    public SupportTicketResponse addReply(String ticketId, String content, String replierEmail) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
            .orElseThrow(() -> new NotFoundException("Support ticket not found"));
        
        User replier = getUserByEmail(replierEmail);
        String senderId = "admin".equals(replier.getRole()) ? "ADMIN" : replier.getId();

        SupportTicket.MessageEntry reply = SupportTicket.MessageEntry.builder()
            .id(UUID.randomUUID().toString())
            .senderId(senderId)
            .content(content.trim())
            .createdAt(Instant.now())
            .internal(false)
            .build();

        List<SupportTicket.MessageEntry> updatedMessages = new ArrayList<>(ticket.getMessages());
        updatedMessages.add(reply);
        ticket.setMessages(updatedMessages);
        ticket.setUpdatedAt(Instant.now());

        SupportTicket updated = supportTicketRepository.save(ticket);
        
        // ← SEND EMAIL TO REQUESTER (if admin replied)
        if ("ADMIN".equals(senderId) || "admin".equals(replier.getRole())) {
            User requester = userRepository.findById(ticket.getRequesterId())
                .orElse(null);
            if (requester != null && requester.getEmail() != null) {
                emailService.sendSupportReplyAlert(requester.getEmail(), ticket.getSubject());
            }
        }

        return toResponse(updated);
    }
    
    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
```

**Update the SupportTicketService interface** (if needed):
```java
public interface SupportTicketService {
    SupportTicketResponse createTicket(String email, SupportTicketCreateRequest request);
    List<SupportTicketResponse> listMyTickets(String email);
    SupportTicketResponse addReply(String ticketId, String content, String replierEmail); // ← ADD THIS
}
```

---

### D. PropertyService - New Property Alert

**File:** `PropertyServiceImpl.java`

**Current Code (Line ~44):**
```java
public PropertyResponse create(PropertyRequest request, String email) {
    User owner = getUserByEmail(email);
    // ... property creation logic ...
    Property saved = propertyRepository.save(property);
    return toResponse(saved);
}
```

**Required Changes:**

1. **Add EmailService injection:**
```java
@Service
@RequiredArgsConstructor
@Transactional
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;  // ← ADD THIS
```

2. **Update create method (after saving property):**
```java
public PropertyResponse create(PropertyRequest request, String email) {
    User owner = getUserByEmail(email);
    
    // ... existing property creation logic ...
    
    Property saved = propertyRepository.save(property);
    
    // ← ADD EMAIL NOTIFICATION TO ALL USERS
    // In a real scenario, you might want to send to users matching this property's criteria
    // For now, sending to owner as confirmation
    notifyAllUsersAboutNewProperty(saved);
    
    return toResponse(saved);
}

// ← ADD THIS HELPER METHOD
private void notifyAllUsersAboutNewProperty(Property property) {
    try {
        // Get all active users (or filtered by preferences)
        List<User> allUsers = userRepository.findAll(); // or filtered query
        
        for (User user : allUsers) {
            if (user.getEmail() != null && !user.getId().equals(property.getOwnerId())) {
                emailService.sendNewPropertyAlert(
                    user.getEmail(),
                    property.getTitle(),
                    property.getLocation()
                );
            }
        }
    } catch (Exception e) {
        log.error("Error notifying users about new property", e);
        // Don't fail the property creation if email notification fails
    }
}
```

---

## Step 3: Email Preferences Configuration

Add to `application.properties` or `application.yml` for async configuration:

```properties
# Application Async Configuration
spring.task.execution.pool.core-size=2
spring.task.execution.pool.max-size=5
spring.task.execution.pool.queue-capacity=100
spring.task.execution.thread-name-prefix=email-async-

# Email Configuration (already configured)
spring.mail.host=${SMTP_HOST}
spring.mail.port=${SMTP_PORT}
spring.mail.username=${SMTP_USERNAME}
spring.mail.password=${SMTP_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
```

---

## Step 4: Testing the Integration

### Manual Testing with Postman/cURL

**Test Password Change Alert:**
```bash
curl -X POST https://maskan-xzpw.onrender.com/api/users/update-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword456"
  }'
```

**Expected Result:** 
- ✅ HTTP 200 response (Fast, non-blocking)
- ✅ Email sent asynchronously in background
- ✅ Check console: `INFO ... Password changed alert sent to user@example.com`

---

## Step 5: Monitoring Async Tasks

### Add Async Logging (Optional)

Create `AsyncConfig.java`:

```java
package com.maskan.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.context.annotation.Bean;
import java.util.concurrent.Executor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class AsyncConfig implements AsyncConfigurer {

    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("email-async-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }

    @Override
    public org.springframework.dao.annotation.exce.UncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> {
            log.error("Async method exception: {}", method.getName(), ex);
        };
    }
}
```

---

## Summary Checklist

- [ ] ✅ `@EnableAsync` added to `HouseRentalApplication.java`
- [ ] ✅ `EmailService` updated with 4 `@Async` methods
- [ ] ✅ `EmailService` injected into `UserServiceImpl`
- [ ] ✅ `sendPasswordChangedAlert()` called in `updateMyPassword()`
- [ ] ✅ `EmailService` injected into `MessageServiceImpl`
- [ ] ✅ `sendNewMessageAlert()` called in `send()`
- [ ] ✅ `EmailService` injected into `SupportTicketServiceImpl`
- [ ] ✅ `sendSupportReplyAlert()` called in support reply handler
- [ ] ✅ `EmailService` injected into `PropertyServiceImpl`
- [ ] ✅ `sendNewPropertyAlert()` called after property creation
- [ ] ⏭️ Frontend: Add "Email Preferences" in `SettingsPage.tsx` (Next step)

---

## Key Benefits

✅ **Non-Blocking:** Email sending doesn't block HTTP threads  
✅ **Scalable:** Thread pool handles multiple concurrent emails  
✅ **Professional Templates:** Gradient headers, color-coded alerts  
✅ **User Friendly:** Clear CTAs ("Go to Inbox", "View Property", etc.)  
✅ **Logged:** All email events tracked for debugging  

---

## Next Step: Frontend Email Preferences

See the React component implementation guide for `SettingsPage.tsx` coming next!
