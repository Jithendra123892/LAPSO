package com.example.demo.security;

import com.example.demo.model.Device;
import com.example.demo.service.DeviceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Advanced security service that provides enhanced security features:
 * - Brute force protection
 * - Suspicious activity detection
 * - Device verification
 * - Session monitoring
 * - Audit logging
 */
@Service
public class AdvancedSecurityService {

    private final DeviceService deviceService;
    
    // Maps IP addresses to failed login attempts
    private final Map<String, Integer> failedLoginAttempts = new ConcurrentHashMap<>();
    
    // Maps IP addresses to temporary lockout time
    private final Map<String, LocalDateTime> ipLockouts = new ConcurrentHashMap<>();
    
    // Maps user emails to their verified devices
    private final Map<String, Map<String, Boolean>> verifiedDevices = new ConcurrentHashMap<>();
    
    // Maps session IDs to activity logs
    private final Map<String, Map<String, Object>> sessionActivity = new ConcurrentHashMap<>();
    
    // Security thresholds
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;
    private static final int SUSPICIOUS_LOCATION_THRESHOLD_KM = 500;

    @Autowired
    public AdvancedSecurityService(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    /**
     * Records a failed login attempt and checks if the IP should be locked out
     * @param request The HTTP request
     * @return true if the IP is now locked out, false otherwise
     */
    public boolean recordFailedLoginAttempt(HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        
        // Check if IP is already locked out
        if (isIpLocked(ipAddress)) {
            return true;
        }
        
        // Increment failed attempts
        int attempts = failedLoginAttempts.getOrDefault(ipAddress, 0) + 1;
        failedLoginAttempts.put(ipAddress, attempts);
        
        // Lock out IP if too many attempts
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            ipLockouts.put(ipAddress, LocalDateTime.now().plusMinutes(LOCKOUT_MINUTES));
            return true;
        }
        
        return false;
    }
    
    /**
     * Checks if an IP address is currently locked out
     * @param ipAddress The IP address to check
     * @return true if locked out, false otherwise
     */
    public boolean isIpLocked(String ipAddress) {
        LocalDateTime lockoutTime = ipLockouts.get(ipAddress);
        if (lockoutTime != null && lockoutTime.isAfter(LocalDateTime.now())) {
            return true;
        } else if (lockoutTime != null) {
            // Lockout expired, remove it
            ipLockouts.remove(ipAddress);
            failedLoginAttempts.remove(ipAddress);
        }
        return false;
    }
    
    /**
     * Records a successful login and resets failed attempts
     * @param request The HTTP request
     */
    public void recordSuccessfulLogin(HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        failedLoginAttempts.remove(ipAddress);
    }
    
    /**
     * Verifies if a device is trusted for a user
     * @param userEmail The user's email
     * @param deviceId The device ID
     * @param request The HTTP request
     * @return true if device is verified, false otherwise
     */
    public boolean verifyDevice(String userEmail, String deviceId, HttpServletRequest request) {
        Map<String, Boolean> userDevices = verifiedDevices.computeIfAbsent(userEmail, k -> new HashMap<>());
        
        // Check if device is already verified
        if (Boolean.TRUE.equals(userDevices.get(deviceId))) {
            return true;
        }
        
        // Verify device based on user's other devices
        Optional<Device> deviceOpt = deviceService.findByDeviceId(deviceId);
        if (deviceOpt.isPresent() && deviceOpt.get().getUserEmail().equals(userEmail)) {
            userDevices.put(deviceId, true);
            return true;
        }
        
        return false;
    }
    
    /**
     * Detects suspicious activity based on location changes
     * @param userEmail The user's email
     * @param latitude Current latitude
     * @param longitude Current longitude
     * @return true if activity is suspicious, false otherwise
     */
    public boolean detectSuspiciousActivity(String userEmail, double latitude, double longitude) {
        // Get user's devices
        var devices = deviceService.getDevicesByOwnerEmail(userEmail);
        
        // Check if location is far from all known device locations
        for (Device device : devices) {
            if (device.getLatitude() != null && device.getLongitude() != null) {
                double distance = calculateDistance(
                    latitude, longitude, device.getLatitude(), device.getLongitude());
                
                if (distance < SUSPICIOUS_LOCATION_THRESHOLD_KM) {
                    return false;
                }
            }
        }
        
        // If we have device locations and none are close, this is suspicious
        return !devices.isEmpty();
    }
    
    /**
     * Records session activity for audit purposes
     * @param sessionId The session ID
     * @param activity The activity description
     * @param request The HTTP request
     */
    public void recordSessionActivity(String sessionId, String activity, HttpServletRequest request) {
        Map<String, Object> activityLog = sessionActivity.computeIfAbsent(sessionId, k -> new HashMap<>());
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth != null ? auth.getName() : "anonymous";
        
        Map<String, Object> entry = new HashMap<>();
        entry.put("timestamp", LocalDateTime.now());
        entry.put("activity", activity);
        entry.put("ip", getClientIpAddress(request));
        entry.put("userAgent", request.getHeader("User-Agent"));
        entry.put("user", userEmail);
        
        activityLog.put(LocalDateTime.now().toString(), entry);
    }
    
    /**
     * Cleans up expired security records periodically
     */
    @Scheduled(fixedRate = 3600000) // Run every hour
    public void cleanupExpiredRecords() {
        LocalDateTime now = LocalDateTime.now();
        
        // Clean up expired IP lockouts
        ipLockouts.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
        
        // Clean up session activity older than 30 days
        LocalDateTime thirtyDaysAgo = now.minusDays(30);
        sessionActivity.values().forEach(activities -> 
            activities.entrySet().removeIf(entry -> {
                Object activityObj = entry.getValue();
                if (activityObj instanceof Map<?, ?>) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> activity = (Map<String, Object>) activityObj;
                    Object timestampObj = activity.get("timestamp");
                    if (timestampObj instanceof LocalDateTime) {
                        LocalDateTime timestamp = (LocalDateTime) timestampObj;
                        return timestamp.isBefore(thirtyDaysAgo);
                    }
                }
                return false;
            })
        );
    }
    
    /**
     * Calculates distance between two points in kilometers using the Haversine formula
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in kilometers
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    /**
     * Gets the client's IP address from the request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
