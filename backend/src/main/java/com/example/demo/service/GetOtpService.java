package com.example.demo.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class GetOtpService {

    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    public String generateAndSendOtp(String phoneNumber) {
        String cleanedPhone = phoneNumber.replaceAll("\\s+", "");
        String generatedOtp = String.format("%06d", new Random().nextInt(1000000));
        otpStorage.put(cleanedPhone, generatedOtp);

        System.out.println("[GETOTP API SMS GATEWAY] Dispatching 6-Digit OTP [" + generatedOtp + "] to Mobile: " + cleanedPhone);
        return generatedOtp;
    }

    public boolean verifyOtp(String phoneNumber, String otp) {
        if (phoneNumber == null || otp == null) return false;
        String cleanedPhone = phoneNumber.replaceAll("\\s+", "");
        String stored = otpStorage.get(cleanedPhone);

        if (stored != null && stored.equals(otp.trim())) {
            otpStorage.remove(cleanedPhone);
            return true;
        }
        return false;
    }

    public boolean validatePasswordComplexity(String password) {
        if (password == null || password.trim().length() < 8) return false;
        String p = password.trim();

        boolean hasUpper = Pattern.compile("[A-Z]").matcher(p).find();
        boolean hasLower = Pattern.compile("[a-z]").matcher(p).find();
        boolean hasDigit = Pattern.compile("[0-9]").matcher(p).find();
        boolean hasSpecial = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]").matcher(p).find();

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
}
