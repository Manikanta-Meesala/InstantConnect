package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userPhoneNumber;

    @Column(nullable = false)
    private String peerPhoneNumber;

    private String alias;

    private boolean savedPermanently = false;

    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant lastActivityTimestamp = Instant.now();

    private Instant expiresAt;

    private boolean deletedByPeer = false;

    @Column(length = 1000)
    private String lastMessage;

    private int unreadCount = 0;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (lastActivityTimestamp == null) lastActivityTimestamp = Instant.now();
        if (expiresAt == null && !savedPermanently) {
            expiresAt = lastActivityTimestamp.plus(30, ChronoUnit.DAYS);
        }
    }

    public void updateActivity(String newLastMessage) {
        this.lastActivityTimestamp = Instant.now();
        this.lastMessage = newLastMessage;
        if (!savedPermanently) {
            this.expiresAt = this.lastActivityTimestamp.plus(30, ChronoUnit.DAYS);
        }
    }
}
