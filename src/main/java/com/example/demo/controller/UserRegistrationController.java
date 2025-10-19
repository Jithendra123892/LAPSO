package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import com.example.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

/**
 * 🔐 PRODUCTION USER REGISTRATION CONTROLLER
 * Handles real user registration, email verification, password reset
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class UserRegistrationController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * Register new user with email verification
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerUser(@Valid @RequestBody UserRegistrationRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Check if user already exists
            if (userService.existsByEmail(request.getEmail())) {
                response.put("success", false);
                response.put("error", "User with this email already exists");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Validate password strength
            if (!isPasswordStrong(request.getPassword())) {
                response.put("success", false);
                response.put("error", "Password must be at least 8 characters with uppercase, lowercase, number, and special character");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Create user account
            User user = userService.createUser(request.getEmail(), request.getName(), request.getPassword());
            
            // Send verification email
            String verificationToken = userService.generateVerificationToken(user);
            notificationService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken);
            
            response.put("success", true);
            response.put("message", "Registration successful! Please check your email to verify your account.");
            response.put("userId", user.getId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Registration failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Verify email address
     */
    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String token = request.get("token");
            boolean verified = userService.verifyEmail(token);
            
            if (verified) {
                response.put("success", true);
                response.put("message", "Email verified successfully! You can now log in.");
            } else {
                response.put("success", false);
                response.put("error", "Invalid or expired verification token");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Verification failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Request password reset
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            User user = userService.findByEmail(email);
            
            if (user != null) {
                String resetToken = userService.generatePasswordResetToken(user);
                notificationService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetToken);
            }
            
            // Always return success to prevent email enumeration
            response.put("success", true);
            response.put("message", "If an account with that email exists, a password reset link has been sent.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Password reset request failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Reset password with token
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody PasswordResetRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (!isPasswordStrong(request.getNewPassword())) {
                response.put("success", false);
                response.put("error", "Password must be at least 8 characters with uppercase, lowercase, number, and special character");
                return ResponseEntity.badRequest().body(response);
            }
            
            boolean reset = userService.resetPassword(request.getToken(), request.getNewPassword());
            
            if (reset) {
                response.put("success", true);
                response.put("message", "Password reset successfully! You can now log in with your new password.");
            } else {
                response.put("success", false);
                response.put("error", "Invalid or expired reset token");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Password reset failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Change password for authenticated user
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody ChangePasswordRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userEmail = userService.getCurrentUserEmail();
            if (userEmail == null) {
                response.put("success", false);
                response.put("error", "User not authenticated");
                return ResponseEntity.status(401).body(response);
            }
            
            if (!isPasswordStrong(request.getNewPassword())) {
                response.put("success", false);
                response.put("error", "Password must be at least 8 characters with uppercase, lowercase, number, and special character");
                return ResponseEntity.badRequest().body(response);
            }
            
            boolean changed = userService.changePassword(userEmail, request.getCurrentPassword(), request.getNewPassword());
            
            if (changed) {
                response.put("success", true);
                response.put("message", "Password changed successfully!");
            } else {
                response.put("success", false);
                response.put("error", "Current password is incorrect");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Password change failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Validate password strength
     */
    private boolean isPasswordStrong(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(ch -> "!@#$%^&*()_+-=[]{}|;:,.<>?".indexOf(ch) >= 0);
        
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
    
    /**
     * User registration request DTO
     */
    public static class UserRegistrationRequest {
        private String email;
        private String name;
        private String password;
        
        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
    
    /**
     * Password reset request DTO
     */
    public static class PasswordResetRequest {
        private String token;
        private String newPassword;
        
        // Getters and setters
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
    
    /**
     * Change password request DTO
     */
    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;
        
        // Getters and setters
        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
        
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}