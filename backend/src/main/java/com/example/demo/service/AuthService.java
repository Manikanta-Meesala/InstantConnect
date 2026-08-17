package com.example.demo.service;

import com.example.demo.dto.AuthDto;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final NumverifyService numverifyService;
    private final GetOtpService getOtpService;

    public AuthService(UserRepository userRepository, NumverifyService numverifyService, GetOtpService getOtpService) {
        this.userRepository = userRepository;
        this.numverifyService = numverifyService;
        this.getOtpService = getOtpService;
    }

    public AuthDto.AuthResponse sendOtp(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return new AuthDto.AuthResponse(false, "Phone number is required", null, null);
        }

        String cleanedPhone = phoneNumber.replaceAll("\\s+", "");

        // Numverify validation
        NumverifyService.NumverifyResult numResult = numverifyService.validatePhoneNumber(cleanedPhone);
        if (!numResult.isValid()) {
            return new AuthDto.AuthResponse(false, numResult.getMessage(), cleanedPhone, null);
        }

        // Send OTP via GETOTP API
        String generatedOtp = getOtpService.generateAndSendOtp(cleanedPhone);

        return new AuthDto.AuthResponse(
                true,
                "Verification code sent to " + cleanedPhone + " via SMS gateway.",
                cleanedPhone,
                getDisplayNameForPhone(cleanedPhone)
        );
    }

    public AuthDto.AuthResponse verifyOtp(String phoneNumber, String otp) {
        if (phoneNumber == null || otp == null) {
            return new AuthDto.AuthResponse(false, "Phone number and OTP are required", null, null);
        }

        String cleanedPhone = phoneNumber.replaceAll("\\s+", "");
        boolean isValid = getOtpService.verifyOtp(cleanedPhone, otp);

        if (isValid) {
            User user = userRepository.findByPhoneNumber(cleanedPhone)
                    .orElseGet(() -> userRepository.save(new User(cleanedPhone, getDisplayNameForPhone(cleanedPhone))));

            return new AuthDto.AuthResponse(true, "GETOTP authentication successful!", user.getPhoneNumber(), user.getDisplayName());
        }

        return new AuthDto.AuthResponse(false, "Invalid OTP code. Please check your SMS code and try again.", cleanedPhone, null);
    }

    public AuthDto.AuthResponse register(String phoneNumber, String displayName, String password) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return new AuthDto.AuthResponse(false, "Phone number is required", null, null);
        }

        String cleanedPhone = phoneNumber.replaceAll("\\s+", "");

        // 1. Numverify validation
        NumverifyService.NumverifyResult numResult = numverifyService.validatePhoneNumber(cleanedPhone);
        if (!numResult.isValid()) {
            return new AuthDto.AuthResponse(false, "Invalid mobile number: " + numResult.getMessage(), cleanedPhone, null);
        }

        // 2. Strict existing account check - DO NOT ALLOW CREATING NEW ACCOUNT WITH EXISTING MOBILE NO
        Optional<User> existingUserOpt = userRepository.findByPhoneNumber(cleanedPhone);
        if (existingUserOpt.isPresent()) {
            return new AuthDto.AuthResponse(
                    false,
                    "An account with this mobile number already exists. Please log in instead.",
                    cleanedPhone,
                    null
            );
        }

        // 3. Password Complexity Enforcement (Uppercase, Lowercase, Digit, Special Char, min length 8)
        if (password == null || password.trim().isEmpty()) {
            return new AuthDto.AuthResponse(false, "Password is required", null, null);
        }

        if (!getOtpService.validatePasswordComplexity(password)) {
            return new AuthDto.AuthResponse(
                    false,
                    "Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
                    cleanedPhone,
                    null
            );
        }

        String name = (displayName != null && !displayName.trim().isEmpty()) ? displayName.trim() : getDisplayNameForPhone(cleanedPhone);
        User newUser = new User(cleanedPhone, name, password.trim());
        userRepository.save(newUser);
        return new AuthDto.AuthResponse(true, "Account created successfully!", newUser.getPhoneNumber(), newUser.getDisplayName());
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
                if (!getOtpService.validatePasswordComplexity(trimmedPassword)) {
                    return new AuthDto.AuthResponse(
                            false,
                            "Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special char.",
                            cleanedPhone,
                            null
                    );
                }
                user.setPassword(trimmedPassword);
                userRepository.save(user);
                return new AuthDto.AuthResponse(true, "Password set and login successful", user.getPhoneNumber(), user.getDisplayName());
            } else if (user.getPassword().equals(trimmedPassword)) {
                return new AuthDto.AuthResponse(true, "Login successful", user.getPhoneNumber(), user.getDisplayName());
            } else {
                return new AuthDto.AuthResponse(false, "Incorrect password. Please try again.", cleanedPhone, null);
            }
        } else {
            return new AuthDto.AuthResponse(false, "Account not found for this mobile number. Please sign up first.", cleanedPhone, null);
        }
    }

    private String getDisplayNameForPhone(String phone) {
        if (phone.endsWith("9999") || phone.contains("63009")) return "Mani";
        if (phone.endsWith("8888")) return "Rahul";
        if (phone.endsWith("7777")) return "Priya";
        return "User " + phone.substring(Math.max(0, phone.length() - 4));
    }
}
