package com.example.demo.service;

import com.example.demo.dto.AuthDto;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AuthDto.AuthResponse sendOtp(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return new AuthDto.AuthResponse(false, "Phone number is required", null, null);
        }

        String cleanedPhone = phoneNumber.replaceAll("\\s+", "");
        String generatedOtp = String.format("%06d", new Random().nextInt(1000000));
        otpStorage.put(cleanedPhone, generatedOtp);

        // Simulate sending SMS via SMS Gateway
        System.out.println("=================================================");
        System.out.println("[SMS GATEWAY] Sent OTP [" + generatedOtp + "] to Mobile Number: " + cleanedPhone);
        System.out.println("=================================================");

        return new AuthDto.AuthResponse(
                true,
                "Verification code sent to " + cleanedPhone + " via SMS.",
                cleanedPhone,
                getDisplayNameForPhone(cleanedPhone)
        );
    }

    public AuthDto.AuthResponse verifyOtp(String phoneNumber, String otp) {
        if (phoneNumber == null || otp == null) {
            return new AuthDto.AuthResponse(false, "Phone number and OTP are required", null, null);
        }

        String cleanedPhone = phoneNumber.replaceAll("\\s+", "");
        String storedOtp = otpStorage.get(cleanedPhone);

        // Strict OTP check - must match the exact generated OTP
        if (storedOtp != null && storedOtp.equals(otp.trim())) {
            otpStorage.remove(cleanedPhone);

            User user = userRepository.findByPhoneNumber(cleanedPhone)
                    .orElseGet(() -> userRepository.save(new User(cleanedPhone, getDisplayNameForPhone(cleanedPhone))));

            return new AuthDto.AuthResponse(true, "Authentication successful", user.getPhoneNumber(), user.getDisplayName());
        }

        return new AuthDto.AuthResponse(false, "Invalid OTP code. Please check your SMS and try again.", cleanedPhone, null);
    }

    public AuthDto.AuthResponse loginWithPassword(String phoneNumber, String password) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return new AuthDto.AuthResponse(false, "Phone number is required", null, null);
        }
        if (password == null || password.trim().isEmpty()) {
            return new AuthDto.AuthResponse(false, "Password is required", null, null);
        }

        String cleanedPhone = phoneNumber.replaceAll("\\s+", "");
        String trimmedPassword = password.trim();

        Optional<User> existingUserOpt = userRepository.findByPhoneNumber(cleanedPhone);

        if (existingUserOpt.isPresent()) {
            User user = existingUserOpt.get();
            if (user.getPassword() == null || user.getPassword().isEmpty()) {
                // Set password on first login
                user.setPassword(trimmedPassword);
                userRepository.save(user);
                return new AuthDto.AuthResponse(true, "Password registered successfully and logged in", user.getPhoneNumber(), user.getDisplayName());
            } else if (user.getPassword().equals(trimmedPassword)) {
                return new AuthDto.AuthResponse(true, "Login successful", user.getPhoneNumber(), user.getDisplayName());
            } else {
                return new AuthDto.AuthResponse(false, "Incorrect password. Please try again.", cleanedPhone, null);
            }
        } else {
            // Create new user with password
            User newUser = new User(cleanedPhone, getDisplayNameForPhone(cleanedPhone), trimmedPassword);
            userRepository.save(newUser);
            return new AuthDto.AuthResponse(true, "Account created & logged in successfully", newUser.getPhoneNumber(), newUser.getDisplayName());
        }
    }

    private String getDisplayNameForPhone(String phone) {
        if (phone.endsWith("9999") || phone.contains("63009")) return "Mani";
        if (phone.endsWith("8888")) return "Rahul";
        if (phone.endsWith("7777")) return "Priya";
        return "User " + phone.substring(Math.max(0, phone.length() - 4));
    }
}
