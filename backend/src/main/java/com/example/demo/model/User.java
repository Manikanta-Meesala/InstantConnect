package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String phoneNumber;

    private String displayName;

    private String password;

    private Instant createdAt = Instant.now();

    public User(String phoneNumber, String displayName) {
        this.phoneNumber = phoneNumber;
        this.displayName = displayName;
        this.createdAt = Instant.now();
    }

    public User(String phoneNumber, String displayName, String password) {
        this.phoneNumber = phoneNumber;
        this.displayName = displayName;
        this.password = password;
        this.createdAt = Instant.now();
    }
}
