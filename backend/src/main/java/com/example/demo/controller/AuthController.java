package com.example.demo.controller;

import com.example.demo.dto.AuthDto;
import com.example.demo.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<AuthDto.AuthResponse> sendOtp(@RequestBody AuthDto.SendOtpRequest request) {
        AuthDto.AuthResponse response = authService.sendOtp(request.getPhoneNumber());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthDto.AuthResponse> verifyOtp(@RequestBody AuthDto.VerifyOtpRequest request) {
        AuthDto.AuthResponse response = authService.verifyOtp(request.getPhoneNumber(), request.getOtp());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login-password")
    public ResponseEntity<AuthDto.AuthResponse> loginWithPassword(@RequestBody AuthDto.PasswordLoginRequest request) {
        AuthDto.AuthResponse response = authService.loginWithPassword(request.getPhoneNumber(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDto.AuthResponse> register(@RequestBody AuthDto.RegisterRequest request) {
        AuthDto.AuthResponse response = authService.register(request.getPhoneNumber(), request.getDisplayName(), request.getPassword());
        return ResponseEntity.ok(response);
    }
}
