package com.maskan.api.service.impl;

import com.maskan.api.dto.MessageRequest;
import com.maskan.api.dto.MessageResponse;
import com.maskan.api.dto.ConversationSummaryResponse;
import com.maskan.api.entity.Message;
import com.maskan.api.entity.BookingStatus;
import com.maskan.api.entity.Property;
import com.maskan.api.entity.User;
import com.maskan.api.exception.NotFoundException;
import com.maskan.api.repository.BookingRepository;
import com.maskan.api.repository.MessageRepository;
import com.maskan.api.repository.PropertyRepository;
import com.maskan.api.repository.UserRepository;
import com.maskan.api.service.MessageService;
import com.maskan.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final EmailService emailService;

        private static final Set<BookingStatus> MESSAGE_ALLOWED_STATUSES = Set.of(
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.PAID_AWAITING_CHECKIN,
            BookingStatus.COMPLETED
        );

    @Override
    public MessageResponse send(MessageRequest request, String email) {
        User sender = getUserByEmail(email);
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new NotFoundException("Receiver not found"));

        if (!canUsersMessage(sender, receiver)) {
            throw new IllegalArgumentException("Messaging is allowed only when an active booking exists between guest and host");
        }

        Message message = Message.builder()
            .senderId(sender.getId())
            .receiverId(receiver.getId())
                .content(request.getContent())
                .build();

        Message saved = messageRepository.save(message);
        
        // Send async email notification with message content
        String senderDisplayName = sender.getName() != null && !sender.getName().isBlank() 
            ? sender.getName() 
            : "un utilisateur";
        emailService.sendNewMessageAlert(receiver.getEmail(), senderDisplayName, request.getContent());
        
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> inbox(String email) {
        User user = getUserByEmail(email);
        return messageRepository.findByReceiverIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> sent(String email) {
        User user = getUserByEmail(email);
        return messageRepository.findBySenderIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> conversation(String email, String otherUserId) {
        User user = getUserByEmail(email);
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!canUsersMessage(user, otherUser)) {
            throw new IllegalArgumentException("Messaging is allowed only when an active booking exists between guest and host");
        }

        return messageRepository
                .findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByCreatedAtAsc(
                        user.getId(),
                        otherUserId,
                        user.getId(),
                        otherUserId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationSummaryResponse> conversations(String email) {
        User user = getUserByEmail(email);
        List<Message> messages = messageRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(user.getId(), user.getId());

        Map<String, ConversationSummaryResponse> summaries = new LinkedHashMap<>();
        for (Message message : messages) {
            String otherUserId = user.getId().equals(message.getSenderId()) ? message.getReceiverId() : message.getSenderId();
            if (otherUserId == null || summaries.containsKey(otherUserId)) {
                continue;
            }

            summaries.put(otherUserId, ConversationSummaryResponse.builder()
                    .userId(otherUserId)
                    .userName(userRepository.findById(otherUserId)
                        .map(User::getName)
                        .filter(name -> name != null && !name.isBlank())
                        .orElse("Utilisateur"))
                    .lastMessageSenderId(message.getSenderId())
                    .lastMessage(message.getContent())
                    .lastMessageAt(message.getCreatedAt())
                    .build());
        }

        return summaries.values().stream().toList();
    }

    private MessageResponse toResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
            .senderId(message.getSenderId())
            .receiverId(message.getReceiverId())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private boolean canUsersMessage(User sender, User receiver) {
        String firstUserId = sender.getId();
        String secondUserId = receiver.getId();

        return haveEligibleHostGuestBooking(firstUserId, secondUserId)
            || haveEligibleHostGuestBooking(secondUserId, firstUserId);
    }

        private boolean haveEligibleHostGuestBooking(String hostId, String guestId) {
        List<String> hostPropertyIds = propertyRepository.findByHostId(hostId).stream()
                .map(Property::getId)
                .collect(Collectors.toList());

        if (hostPropertyIds.isEmpty()) {
            return false;
        }

        return bookingRepository.existsByListingIdInAndGuestIdAndStatusIn(
            hostPropertyIds,
            guestId,
            MESSAGE_ALLOWED_STATUSES
        );
    }
}

