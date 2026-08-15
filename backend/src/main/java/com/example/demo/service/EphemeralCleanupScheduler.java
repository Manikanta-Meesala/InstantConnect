package com.example.demo.service;

import com.example.demo.repository.ConversationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class EphemeralCleanupScheduler {

    private final ConversationRepository conversationRepository;

    public EphemeralCleanupScheduler(ConversationRepository conversationRepository) {
        this.conversationRepository = conversationRepository;
    }

    /**
     * Runs every hour to purge expired ephemeral chats (where expiresAt < current time and savedPermanently == false)
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredEphemeralChats() {
        try {
            conversationRepository.deleteByExpiresAtBeforeAndSavedPermanentlyFalse(Instant.now());
        } catch (Exception e) {
            // Log warning silently
        }
    }
}
