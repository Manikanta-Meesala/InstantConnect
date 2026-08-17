package com.example.demo.service;

import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class CryptoService {

    public String hashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isEmpty()) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(("SALT_SECURE_AUTH_" + rawPassword).getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return rawPassword;
        }
    }

    public boolean matchesPassword(String rawPassword, String storedHash) {
        if (storedHash == null || rawPassword == null) return false;
        // Check both hashed and legacy plaintext matching for backward compatibility
        String hashed = hashPassword(rawPassword);
        return storedHash.equals(hashed) || storedHash.equals(rawPassword);
    }
}
