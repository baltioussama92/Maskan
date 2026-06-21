# 🔧 Email Notification System - Exact Code Changes

## Quick Copy-Paste Guide

Use these exact code snippets to integrate EmailService into your services.

---

## 1️⃣ UserServiceImpl.java - Password Changed Alert

### STEP 1: Add EmailService injection

**Find this:**
```java
@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
```

**Replace with:**
```java
@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final EmailService emailService;  // ← ADD THIS LINE
```

### STEP 2: Update updateMyPassword method

**Find this complete method:**
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

**Replace with:**
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
    
    // ✨ NEW: Send password changed email alert (async, non-blocking)
    emailService.sendPasswordChangedAlert(user.getEmail());
}
```

---

## 2️⃣ MessageServiceImpl.java - New Message Alert

### STEP 1: Add EmailService injection

**Find this:**
```java
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
```

**Replace with:**
```java
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;  // ← ADD THIS LINE
```

### STEP 2: Update send method

**Find this complete method:**
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

**Replace with:**
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
    
    // ✨ NEW: Send new message email alert (async, non-blocking)
    emailService.sendNewMessageAlert(receiver.getEmail(), sender.getName());
    
    return toResponse(saved);
}
```

---

## 3️⃣ SupportTicketServiceImpl.java - Support Reply Alert

### STEP 1: Add EmailService injection

**Find this:**
```java
@Service
@RequiredArgsConstructor
@Transactional
public class SupportTicketServiceImpl implements SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
```

**Replace with:**
```java
@Service
@RequiredArgsConstructor
@Transactional
public class SupportTicketServiceImpl implements SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;  // ← ADD THIS LINE
```

### STEP 2: Add imports at top of file

**Add this import:**
```java
import java.util.ArrayList;
import java.util.UUID;
```

### STEP 3: Add new method for handling admin replies

**Add this complete method to the class:**
```java
@Override
public SupportTicketResponse addReply(String ticketId, String content, String replierEmail) {
    SupportTicket ticket = supportTicketRepository.findById(ticketId)
        .orElseThrow(() -> new NotFoundException("Support ticket not found"));
    
    User replier = getUserByEmail(replierEmail);
    String senderId = "admin".equalsIgnoreCase(replier.getRole()) ? "ADMIN" : replier.getId();

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
    
    // ✨ NEW: Send support reply email alert if admin replied (async, non-blocking)
    if ("ADMIN".equals(senderId) || "admin".equalsIgnoreCase(replier.getRole())) {
        User requester = userRepository.findById(ticket.getRequesterId())
            .orElse(null);
        if (requester != null && requester.getEmail() != null) {
            emailService.sendSupportReplyAlert(requester.getEmail(), ticket.getSubject());
        }
    }

    return toResponse(updated);
}
```

### STEP 4: Update SupportTicketService interface

**Find this interface file:** `SupportTicketService.java`

**Add this method signature:**
```java
@Override
SupportTicketResponse addReply(String ticketId, String content, String replierEmail);
```

**Full interface should look like:**
```java
public interface SupportTicketService {
    SupportTicketResponse createTicket(String email, SupportTicketCreateRequest request);
    List<SupportTicketResponse> listMyTickets(String email);
    SupportTicketResponse addReply(String ticketId, String content, String replierEmail);  // ← ADD THIS
}
```

---

## 4️⃣ PropertyServiceImpl.java - New Property Alert

### STEP 1: Add EmailService injection

**Find this:**
```java
@Service
@RequiredArgsConstructor
@Transactional
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
```

**Replace with:**
```java
@Service
@RequiredArgsConstructor
@Transactional
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;  // ← ADD THIS LINE
```

### STEP 2: Update create method

**Find this section in the `create` method:**
```java
public PropertyResponse create(PropertyRequest request, String email) {
    User owner = getUserByEmail(email);
    
    // ... existing property creation logic ...
    
    Property saved = propertyRepository.save(property);
    return toResponse(saved);
}
```

**Replace the end with:**
```java
public PropertyResponse create(PropertyRequest request, String email) {
    User owner = getUserByEmail(email);
    
    // ... existing property creation logic remains the same ...
    
    Property saved = propertyRepository.save(property);
    
    // ✨ NEW: Notify all users about new property (async, non-blocking)
    notifyAllUsersAboutNewProperty(saved);
    
    return toResponse(saved);
}
```

### STEP 3: Add helper method to the class

**Add this complete helper method:**
```java
/**
 * Notify all active users about a new property listing
 */
private void notifyAllUsersAboutNewProperty(Property property) {
    try {
        // Get all active users (you can add filters here)
        List<User> allUsers = userRepository.findAll();
        
        for (User user : allUsers) {
            // Don't send to the property owner
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

## 5️⃣ Application Configuration

### Add to application.properties

**File:** `Backend/src/main/resources/application.properties`

**Add these lines:**
```properties
# ========================================
# Async Configuration (Thread Pool)
# ========================================
spring.task.execution.pool.core-size=2
spring.task.execution.pool.max-size=5
spring.task.execution.queue-capacity=100
spring.task.execution.thread-name-prefix=email-async-
spring.task.execution.shutdown.await-termination=true
spring.task.execution.shutdown.await-termination-period=60s
```

### Or add to application.yml

```yaml
spring:
  task:
    execution:
      pool:
        core-size: 2
        max-size: 5
        queue-capacity: 100
        thread-name-prefix: email-async-
      shutdown:
        await-termination: true
        await-termination-period: 60s
```

---

## 🎯 Frontend Changes (SettingsPage.tsx)

### Already Completed! ✅

The following has been done:

1. ✅ Added `EmailPreferencesForm` interface
2. ✅ Added `defaultEmailPreferences` constants
3. ✅ Added `emailPreferences` state
4. ✅ Added `updateEmailPreferenceField` function
5. ✅ Added Email Preferences card section
6. ✅ Added CSS styling for email preferences

**The section displays 4 toggle switches:**
- 🔒 Security Alerts
- 💬 Inbox Alerts
- 📋 Support Updates
- 🏠 New Property Listings

No additional code changes needed for the UI!

---

## ✅ Verification Checklist

After making all changes, verify:

### Code Compilation
```bash
cd Backend
mvn clean compile
```

✅ Should compile without errors  
✅ All EmailService methods resolved  
✅ All service injections work  

### Application Startup
```bash
mvn spring-boot:run
```

✅ Application starts without errors  
✅ Async thread pool created (check logs for "email-async-")  
✅ No null pointer exceptions  

### Frontend Build
```bash
cd Frontend
npm run build
```

✅ No TypeScript errors  
✅ SettingsPage compiles successfully  
✅ All React components render  

---

## 🧪 Quick Test Commands

### Test Password Changed Email
```bash
curl -X PATCH https://maskan-xzpw.onrender.com/api/users/update-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"oldPass","newPassword":"newPass123"}'
```

### Test New Message Email
```bash
curl -X POST https://maskan-xzpw.onrender.com/api/messages/send \
  -H "Authorization: Bearer SENDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receiverEmail":"user@maskan.com","content":"Hello!"}'
```

### Test New Property Email
```bash
curl -X POST https://maskan-xzpw.onrender.com/api/properties \
  -H "Authorization: Bearer OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Apt","location":"NYC","price":2500}'
```

---

## 📊 Expected Log Output

When emails are sent, you should see:

```
INFO  c.m.a.s.EmailService - Password changed alert sent to user@example.com
INFO  c.m.a.s.EmailService - New message alert sent to recipient@example.com
INFO  c.m.a.s.EmailService - Support reply alert sent to user@example.com
INFO  c.m.a.s.EmailService - New property alert sent to user1@example.com
INFO  c.m.a.s.EmailService - New property alert sent to user2@example.com
```

---

## 🎉 Summary

You now have:
- ✅ 4 @Async email methods
- ✅ Professional HTML templates
- ✅ Integrated into all required services
- ✅ Frontend UI for preferences
- ✅ Non-blocking async execution
- ✅ Ready for production!

**Next optional step:** Add backend opt-out logic with UserEmailPreferences entity
