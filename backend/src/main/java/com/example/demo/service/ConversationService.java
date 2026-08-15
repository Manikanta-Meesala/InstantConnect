package com.example.demo.service;

import com.example.demo.dto.ConversationDto;
import com.example.demo.model.Conversation;
import com.example.demo.model.Message;
import com.example.demo.repository.ConversationRepository;
import com.example.demo.repository.MessageRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final RealtimeService realtimeService;

    public ConversationService(ConversationRepository conversationRepository,
                               MessageRepository messageRepository,
                               RealtimeService realtimeService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.realtimeService = realtimeService;
    }

    public List<Conversation> getConversationsForUser(String userPhone) {
        // Automatically clear expired temporary conversations
        cleanupExpiredConversations(userPhone);

        return conversationRepository.findByUserPhoneNumberOrderByLastActivityTimestampDesc(userPhone);
    }

    public Conversation createConversation(String userPhone, String peerPhone, String initialMessage) {
        String msgText = (initialMessage != null && !initialMessage.trim().isEmpty()) ? initialMessage.trim() : "Hello! InstantConnect chat started.";
        Instant now = Instant.now();

        // 1. Create or update User's conversation
        Optional<Conversation> existingUserConv = conversationRepository.findByUserPhoneNumberAndPeerPhoneNumber(userPhone, peerPhone);
        Conversation userConv;
        if (existingUserConv.isPresent()) {
            userConv = existingUserConv.get();
            userConv.updateActivity(msgText);
        } else {
            userConv = new Conversation();
            userConv.setUserPhoneNumber(userPhone);
            userConv.setPeerPhoneNumber(peerPhone);
            userConv.setLastMessage(msgText);
            userConv.setLastActivityTimestamp(now);
            userConv.setExpiresAt(now.plus(30, ChronoUnit.DAYS));
        }
        userConv = conversationRepository.save(userConv);

        // Save initial message linked to user's conversation
        Message msg = new Message();
        msg.setConversationId(userConv.getId());
        msg.setSenderPhoneNumber(userPhone);
        msg.setRecipientPhoneNumber(peerPhone);
        msg.setContent(msgText);
        msg.setSentAt(now);
        msg.setRead(true);
        messageRepository.save(msg);

        // 2. Create or update Peer's conversation
        if (peerPhone != null && !peerPhone.trim().isEmpty()) {
            Optional<Conversation> existingPeerConv = conversationRepository.findByUserPhoneNumberAndPeerPhoneNumber(peerPhone, userPhone);
            Conversation peerConv;
            if (existingPeerConv.isPresent()) {
                peerConv = existingPeerConv.get();
                peerConv.updateActivity(msgText);
            } else {
                peerConv = new Conversation();
                peerConv.setUserPhoneNumber(peerPhone);
                peerConv.setPeerPhoneNumber(userPhone);
                peerConv.setLastMessage(msgText);
                peerConv.setLastActivityTimestamp(now);
                peerConv.setExpiresAt(now.plus(30, ChronoUnit.DAYS));
            }
            peerConv = conversationRepository.save(peerConv);

            // Notify peer of the new conversation and initial message via SSE
            realtimeService.notifyUser(peerPhone, "new_conversation", peerConv);
            realtimeService.notifyUser(peerPhone, "new_message", msg);
        }

        return userConv;
    }

    public Conversation savePermanently(Long conversationId, String alias) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found with ID: " + conversationId));

        conv.setSavedPermanently(true);
        conv.setAlias(alias != null && !alias.trim().isEmpty() ? alias.trim() : conv.getPeerPhoneNumber());
        conv.setExpiresAt(null); // Remove 30-day expiration

        return conversationRepository.save(conv);
    }

    public Conversation toggleDeletedByPeer(Long conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        conv.setDeletedByPeer(!conv.isDeletedByPeer());
        return conversationRepository.save(conv);
    }

    public void deleteConversation(Long conversationId) {
        messageRepository.deleteByConversationId(conversationId);
        conversationRepository.deleteById(conversationId);
    }

    public void timeWarp(String userPhone, int daysToAdvance) {
        List<Conversation> conversations = conversationRepository.findByUserPhoneNumberOrderByLastActivityTimestampDesc(userPhone);
        Instant now = Instant.now();

        for (Conversation conv : conversations) {
            if (!conv.isSavedPermanently()) {
                // Shift lastActivityTimestamp backwards by X days
                conv.setLastActivityTimestamp(conv.getLastActivityTimestamp().minus(daysToAdvance, ChronoUnit.DAYS));
                conv.setExpiresAt(conv.getExpiresAt().minus(daysToAdvance, ChronoUnit.DAYS));
                if (conv.getExpiresAt().isBefore(now)) {
                    conv.setDeletedByPeer(true);
                }
                conversationRepository.save(conv);
            }
        }
    }

    public ConversationDto.StatsResponse getStats(String userPhone) {
        List<Conversation> conversations = getConversationsForUser(userPhone);
        Instant now = Instant.now();
        Instant fiveDaysFromNow = now.plus(5, ChronoUnit.DAYS);

        long total = conversations.size();
        long permanent = conversations.stream().filter(Conversation::isSavedPermanently).count();
        long activeTemp = conversations.stream().filter(c -> !c.isSavedPermanently() && !c.isDeletedByPeer() && c.getExpiresAt() != null && c.getExpiresAt().isAfter(now)).count();
        long expiringSoon = conversations.stream().filter(c -> !c.isSavedPermanently() && !c.isDeletedByPeer() && c.getExpiresAt() != null && c.getExpiresAt().isAfter(now) && c.getExpiresAt().isBefore(fiveDaysFromNow)).count();
        long deletedByPeer = conversations.stream().filter(c -> c.isDeletedByPeer() || (!c.isSavedPermanently() && c.getExpiresAt() != null && !c.getExpiresAt().isAfter(now))).count();

        return new ConversationDto.StatsResponse(total, activeTemp, permanent, expiringSoon, deletedByPeer);
    }

    private void cleanupExpiredConversations(String userPhone) {
        try {
            conversationRepository.deleteByUserPhoneNumberAndExpiresAtBeforeAndSavedPermanentlyFalse(userPhone, Instant.now());
        } catch (Exception ignored) {}
    }

    private void seedDemoConversations(String userPhone) {
        Instant now = Instant.now();

        // 1. Permanent saved contact (Mani)
        Conversation c1 = new Conversation();
        c1.setUserPhoneNumber(userPhone);
        c1.setPeerPhoneNumber("+91 63009 12345");
        c1.setAlias("Mani");
        c1.setSavedPermanently(true);
        c1.setLastMessage("Hey! Welcome to InstantConnect 🚀");
        c1.setLastActivityTimestamp(now.minus(10, ChronoUnit.MINUTES));
        c1.setExpiresAt(null);
        conversationRepository.save(c1);

        // 2. Yellow warning contact (Rahul - 3 days remaining)
        Conversation c2 = new Conversation();
        c2.setUserPhoneNumber(userPhone);
        c2.setPeerPhoneNumber("+91 98765 43210");
        c2.setAlias(null);
        c2.setSavedPermanently(false);
        c2.setLastMessage("Are we meeting for coffee tomorrow?");
        c2.setLastActivityTimestamp(now.minus(27, ChronoUnit.DAYS));
        c2.setExpiresAt(now.plus(3, ChronoUnit.DAYS));
        conversationRepository.save(c2);

        // 3. Normal green contact (Priya - 24 days remaining)
        Conversation c3 = new Conversation();
        c3.setUserPhoneNumber(userPhone);
        c3.setPeerPhoneNumber("+91 91234 56789");
        c3.setAlias(null);
        c3.setSavedPermanently(false);
        c3.setLastMessage("Thanks for sending over the wireframes!");
        c3.setLastActivityTimestamp(now.minus(6, ChronoUnit.DAYS));
        c3.setExpiresAt(now.plus(24, ChronoUnit.DAYS));
        conversationRepository.save(c3);

        // 4. Red deleted by peer contact (Alex)
        Conversation c4 = new Conversation();
        c4.setUserPhoneNumber(userPhone);
        c4.setPeerPhoneNumber("+91 99887 76655");
        c4.setAlias(null);
        c4.setSavedPermanently(false);
        c4.setDeletedByPeer(true);
        c4.setLastMessage("Chat session closed by peer.");
        c4.setLastActivityTimestamp(now.minus(12, ChronoUnit.HOURS));
        c4.setExpiresAt(now.plus(18, ChronoUnit.DAYS));
        conversationRepository.save(c4);
    }
}
