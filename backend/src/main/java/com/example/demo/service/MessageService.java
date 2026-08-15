package com.example.demo.service;

import com.example.demo.dto.MessageDto;
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
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final RealtimeService realtimeService;

    public MessageService(MessageRepository messageRepository,
                          ConversationRepository conversationRepository,
                          RealtimeService realtimeService) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.realtimeService = realtimeService;
    }

    public List<Message> getMessagesForConversation(Long conversationId) {
        return messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
    }

    public Message sendMessage(MessageDto.SendMessageRequest request) {
        Instant now = Instant.now();
        Conversation senderConv = conversationRepository.findById(request.getConversationId())
                .orElseGet(() -> {
                    Conversation c = new Conversation();
                    c.setUserPhoneNumber(request.getSenderPhoneNumber());
                    c.setPeerPhoneNumber(request.getRecipientPhoneNumber());
                    c.setLastMessage(request.getContent());
                    c.setLastActivityTimestamp(now);
                    c.setExpiresAt(now.plus(30, ChronoUnit.DAYS));
                    return conversationRepository.save(c);
                });

        Message msg = new Message();
        msg.setConversationId(senderConv.getId());
        msg.setSenderPhoneNumber(request.getSenderPhoneNumber());
        msg.setRecipientPhoneNumber(request.getRecipientPhoneNumber());
        msg.setContent(request.getContent());
        msg.setSentAt(now);
        msg.setRead(true);

        Message savedMsg = messageRepository.save(msg);

        // 1. Update sender conversation activity & reorder to top
        senderConv.updateActivity(request.getContent());
        conversationRepository.save(senderConv);

        // 2. Ensure recipient conversation exists & save dual message copy
        String recipientPhone = request.getRecipientPhoneNumber();
        String senderPhone = request.getSenderPhoneNumber();

        if (recipientPhone != null && !recipientPhone.trim().isEmpty()) {
            Optional<Conversation> recipientConvOpt = conversationRepository.findByUserPhoneNumberAndPeerPhoneNumber(recipientPhone, senderPhone);
            Conversation recipientConv;
            if (recipientConvOpt.isPresent()) {
                recipientConv = recipientConvOpt.get();
                recipientConv.updateActivity(request.getContent());
            } else {
                recipientConv = new Conversation();
                recipientConv.setUserPhoneNumber(recipientPhone);
                recipientConv.setPeerPhoneNumber(senderPhone);
                recipientConv.setLastMessage(request.getContent());
                recipientConv.setLastActivityTimestamp(now);
                recipientConv.setExpiresAt(now.plus(30, ChronoUnit.DAYS));
            }
            recipientConv = conversationRepository.save(recipientConv);

            // Save dual message record under recipient's conversation ID
            Message recipientMsg = new Message();
            recipientMsg.setConversationId(recipientConv.getId());
            recipientMsg.setSenderPhoneNumber(senderPhone);
            recipientMsg.setRecipientPhoneNumber(recipientPhone);
            recipientMsg.setContent(request.getContent());
            recipientMsg.setSentAt(now);
            recipientMsg.setRead(false);
            messageRepository.save(recipientMsg);

            // Notify recipient via SSE realtime stream
            realtimeService.notifyUser(recipientPhone, "new_message", recipientMsg);
        }

        // Notify sender via SSE realtime stream
        realtimeService.notifyUser(senderPhone, "message_sent", savedMsg);

        return savedMsg;
    }

    public Message simulatePeerReply(Long conversationId, String content) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        String replyText = (content != null && !content.trim().isEmpty()) ? content : "Sounds great! InstantConnect makes temporary chats so easy.";
        Instant now = Instant.now();

        Message msg = new Message();
        msg.setConversationId(conversationId);
        msg.setSenderPhoneNumber(conversation.getPeerPhoneNumber());
        msg.setRecipientPhoneNumber(conversation.getUserPhoneNumber());
        msg.setContent(replyText);
        msg.setSentAt(now);
        msg.setRead(false);

        Message savedMsg = messageRepository.save(msg);

        // Update activity to move tile to top
        conversation.updateActivity(replyText);
        conversationRepository.save(conversation);

        // Notify user via SSE
        realtimeService.notifyUser(conversation.getUserPhoneNumber(), "new_message", savedMsg);

        return savedMsg;
    }

    public void deleteMessageBothSides(Long messageId) {
        Optional<Message> msgOpt = messageRepository.findById(messageId);
        if (msgOpt.isPresent()) {
            Message msg = msgOpt.get();
            String sender = msg.getSenderPhoneNumber();
            String recipient = msg.getRecipientPhoneNumber();
            String content = msg.getContent();

            // Delete specific target message
            messageRepository.deleteById(messageId);

            // Delete matching paired messages for both parties (same content & participants)
            List<Message> allMsgs = messageRepository.findAll();
            for (Message m : allMsgs) {
                if (m.getContent() != null && m.getContent().equals(content)) {
                    boolean match1 = sender.equals(m.getSenderPhoneNumber()) && recipient.equals(m.getRecipientPhoneNumber());
                    boolean match2 = recipient.equals(m.getSenderPhoneNumber()) && sender.equals(m.getRecipientPhoneNumber());
                    if (match1 || match2) {
                        messageRepository.deleteById(m.getId());
                    }
                }
            }

            // Broadcast real-time message_deleted event to both sender and recipient
            realtimeService.notifyUser(sender, "message_deleted", msg);
            if (recipient != null) {
                realtimeService.notifyUser(recipient, "message_deleted", msg);
            }
        }
    }
}
