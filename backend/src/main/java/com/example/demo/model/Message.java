package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long conversationId;

    @Column(nullable = false)
    private String senderPhoneNumber;

    @Column(nullable = false)
    private String recipientPhoneNumber;

    @Column(nullable = false, length = 2000)
    private String content;

    private Instant sentAt = Instant.now();

    private boolean isRead = false;
}
