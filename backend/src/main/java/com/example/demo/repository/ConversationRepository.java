package com.example.demo.repository;

import com.example.demo.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    List<Conversation> findByUserPhoneNumberOrderByLastActivityTimestampDesc(String userPhoneNumber);

    Optional<Conversation> findByUserPhoneNumberAndPeerPhoneNumber(String userPhoneNumber, String peerPhoneNumber);

    void deleteByUserPhoneNumberAndExpiresAtBeforeAndSavedPermanentlyFalse(String userPhoneNumber, java.time.Instant now);

    void deleteByExpiresAtBeforeAndSavedPermanentlyFalse(java.time.Instant now);
}

