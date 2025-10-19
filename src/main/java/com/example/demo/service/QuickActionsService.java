package com.example.demo.service;

import com.example.demo.model.Device;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class QuickActionsService {

    @Autowired
    private DeviceService deviceService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private WebSocketService webSocketService;

    /**
     * Lock device remotely
     */
    public CompletableFuture<Map<String, Object>> lockDevice(String deviceId, String userEmail) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> result = new HashMap<>();
            
            try {
                var deviceOpt = deviceService.findByDeviceId(deviceId);
                if (deviceOpt.isEmpty()) {
                    result.put("success", false);
                    result.put("error", "Device not found");
                    return result;
                }
                
                Device device = deviceOpt.get();
                
                // Verify ownership
                if (!device.getUserEmail().equals(userEmail)) {
                    result.put("success", false);
                    result.put("error", "Access denied");
                    return result;
                }
                
                // Lock the device
                deviceService.lockDevice(deviceId);
                
                // Send command to agent (in real implementation, this would be queued)
                sendDeviceCommand(deviceId, "LOCK", Map.of(
                    "action", "lock",
                    "message", "Device locked remotely via LAPSO",
                    "timestamp", LocalDateTime.now().toString()
                ));
                
                // Notify user
                webSocketService.sendAlert(
                    userEmail,
                    "device_locked",
                    String.format("Device '%s' has been locked remotely", device.getDeviceName()),
                    deviceId
                );
                
                result.put("success", true);
                result.put("message", "Device locked successfully");
                result.put("action", "lock");
                result.put("deviceName", device.getDeviceName());
                result.put("timestamp", LocalDateTime.now());
                
                System.out.println("🔒 Device locked: " + deviceId + " by user: " + userEmail);
                
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", "Failed to lock device: " + e.getMessage());
                System.err.println("❌ Failed to lock device " + deviceId + ": " + e.getMessage());
            }
            
            return result;
        });
    }
    
    /**
     * Unlock device remotely
     */
    public CompletableFuture<Map<String, Object>> unlockDevice(String deviceId, String userEmail) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> result = new HashMap<>();
            
            try {
                var deviceOpt = deviceService.findByDeviceId(deviceId);
                if (deviceOpt.isEmpty()) {
                    result.put("success", false);
                    result.put("error", "Device not found");
                    return result;
                }
                
                Device device = deviceOpt.get();
                
                // Verify ownership
                if (!device.getUserEmail().equals(userEmail)) {
                    result.put("success", false);
                    result.put("error", "Access denied");
                    return result;
                }
                
                // Unlock the device
                deviceService.unlockDevice(deviceId);
                
                // Send command to agent
                sendDeviceCommand(deviceId, "UNLOCK", Map.of(
                    "action", "unlock",
                    "message", "Device unlocked remotely via LAPSO",
                    "timestamp", LocalDateTime.now().toString()
                ));
                
                // Notify user
                webSocketService.sendAlert(
                    userEmail,
                    "device_unlocked",
                    String.format("Device '%s' has been unlocked remotely", device.getDeviceName()),
                    deviceId
                );
                
                result.put("success", true);
                result.put("message", "Device unlocked successfully");
                result.put("action", "unlock");
                result.put("deviceName", device.getDeviceName());
                result.put("timestamp", LocalDateTime.now());
                
                System.out.println("🔓 Device unlocked: " + deviceId + " by user: " + userEmail);
                
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", "Failed to unlock device: " + e.getMessage());
                System.err.println("❌ Failed to unlock device " + deviceId + ": " + e.getMessage());
            }
            
            return result;
        });
    }
    
    /**
     * Wipe device remotely (DANGEROUS - requires confirmation)
     */
    public CompletableFuture<Map<String, Object>> wipeDevice(String deviceId, String userEmail, String confirmationCode) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> result = new HashMap<>();
            
            try {
                // Verify confirmation code (simple check - in production, use proper verification)
                if (!"WIPE_CONFIRMED".equals(confirmationCode)) {
                    result.put("success", false);
                    result.put("error", "Confirmation code required for device wipe");
                    return result;
                }
                
                var deviceOpt = deviceService.findByDeviceId(deviceId);
                if (deviceOpt.isEmpty()) {
                    result.put("success", false);
                    result.put("error", "Device not found");
                    return result;
                }
                
                Device device = deviceOpt.get();
                
                // Verify ownership
                if (!device.getUserEmail().equals(userEmail)) {
                    result.put("success", false);
                    result.put("error", "Access denied");
                    return result;
                }
                
                // Wipe the device
                deviceService.wipeDevice(deviceId);
                
                // Send command to agent
                sendDeviceCommand(deviceId, "WIPE", Map.of(
                    "action", "wipe",
                    "message", "EMERGENCY: Device wipe initiated remotely",
                    "timestamp", LocalDateTime.now().toString(),
                    "warning", "This action cannot be undone"
                ));
                
                // Send urgent notification
                notificationService.sendEmailNotification(
                    userEmail,
                    "🚨 LAPSO URGENT: Device Wipe Initiated",
                    String.format(
                        "URGENT: Device wipe has been initiated!\n\n" +
                        "Device: %s\n" +
                        "Action: Remote wipe\n" +
                        "Time: %s\n\n" +
                        "This action will permanently delete all data on the device.\n" +
                        "If this was not authorized by you, contact support immediately.\n\n" +
                        "LAPSO - Free Laptop Security",
                        device.getDeviceName(),
                        LocalDateTime.now()
                    )
                );
                
                // Notify via WebSocket
                webSocketService.sendAlert(
                    userEmail,
                    "device_wiped",
                    String.format("URGENT: Device '%s' wipe initiated", device.getDeviceName()),
                    deviceId
                );
                
                result.put("success", true);
                result.put("message", "Device wipe initiated - this action cannot be undone");
                result.put("action", "wipe");
                result.put("deviceName", device.getDeviceName());
                result.put("timestamp", LocalDateTime.now());
                result.put("warning", "Data will be permanently deleted");
                
                System.out.println("💣 Device wipe initiated: " + deviceId + " by user: " + userEmail);
                
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", "Failed to wipe device: " + e.getMessage());
                System.err.println("❌ Failed to wipe device " + deviceId + ": " + e.getMessage());
            }
            
            return result;
        });
    }
    
    /**
     * Play sound on device to help locate it
     */
    public CompletableFuture<Map<String, Object>> playSoundOnDevice(String deviceId, String userEmail) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> result = new HashMap<>();
            
            try {
                var deviceOpt = deviceService.findByDeviceId(deviceId);
                if (deviceOpt.isEmpty()) {
                    result.put("success", false);
                    result.put("error", "Device not found");
                    return result;
                }
                
                Device device = deviceOpt.get();
                
                // Verify ownership
                if (!device.getUserEmail().equals(userEmail)) {
                    result.put("success", false);
                    result.put("error", "Access denied");
                    return result;
                }
                
                // Check if device is online
                if (device.getIsOnline() == null || !device.getIsOnline()) {
                    result.put("success", false);
                    result.put("error", "Device is offline - cannot play sound");
                    return result;
                }
                
                // Send command to agent
                sendDeviceCommand(deviceId, "PLAY_SOUND", Map.of(
                    "action", "play_sound",
                    "duration", 30, // seconds
                    "volume", 80, // percentage
                    "message", "LAPSO: Help locate your device",
                    "timestamp", LocalDateTime.now().toString()
                ));
                
                // Notify user
                webSocketService.sendAlert(
                    userEmail,
                    "sound_played",
                    String.format("Sound playing on device '%s' for 30 seconds", device.getDeviceName()),
                    deviceId
                );
                
                result.put("success", true);
                result.put("message", "Sound is now playing on your device for 30 seconds");
                result.put("action", "play_sound");
                result.put("deviceName", device.getDeviceName());
                result.put("duration", 30);
                result.put("timestamp", LocalDateTime.now());
                
                System.out.println("🔊 Sound played on device: " + deviceId + " by user: " + userEmail);
                
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", "Failed to play sound: " + e.getMessage());
                System.err.println("❌ Failed to play sound on device " + deviceId + ": " + e.getMessage());
            }
            
            return result;
        });
    }
    
    /**
     * Take screenshot of device
     */
    public CompletableFuture<Map<String, Object>> takeScreenshot(String deviceId, String userEmail) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> result = new HashMap<>();
            
            try {
                var deviceOpt = deviceService.findByDeviceId(deviceId);
                if (deviceOpt.isEmpty()) {
                    result.put("success", false);
                    result.put("error", "Device not found");
                    return result;
                }
                
                Device device = deviceOpt.get();
                
                // Verify ownership
                if (!device.getUserEmail().equals(userEmail)) {
                    result.put("success", false);
                    result.put("error", "Access denied");
                    return result;
                }
                
                // Check if device is online
                if (device.getIsOnline() == null || !device.getIsOnline()) {
                    result.put("success", false);
                    result.put("error", "Device is offline - cannot take screenshot");
                    return result;
                }
                
                // Send command to agent
                sendDeviceCommand(deviceId, "SCREENSHOT", Map.of(
                    "action", "screenshot",
                    "quality", 80, // percentage
                    "timestamp", LocalDateTime.now().toString()
                ));
                
                // Notify user
                webSocketService.sendAlert(
                    userEmail,
                    "screenshot_taken",
                    String.format("Screenshot requested from device '%s'", device.getDeviceName()),
                    deviceId
                );
                
                result.put("success", true);
                result.put("message", "Screenshot requested - will be available shortly");
                result.put("action", "screenshot");
                result.put("deviceName", device.getDeviceName());
                result.put("timestamp", LocalDateTime.now());
                result.put("note", "Screenshot will be uploaded when ready");
                
                System.out.println("📸 Screenshot requested from device: " + deviceId + " by user: " + userEmail);
                
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", "Failed to take screenshot: " + e.getMessage());
                System.err.println("❌ Failed to take screenshot from device " + deviceId + ": " + e.getMessage());
            }
            
            return result;
        });
    }
    
    /**
     * Get current location of device
     */
    public CompletableFuture<Map<String, Object>> getCurrentLocation(String deviceId, String userEmail) {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> result = new HashMap<>();
            
            try {
                var deviceOpt = deviceService.findByDeviceId(deviceId);
                if (deviceOpt.isEmpty()) {
                    result.put("success", false);
                    result.put("error", "Device not found");
                    return result;
                }
                
                Device device = deviceOpt.get();
                
                // Verify ownership
                if (!device.getUserEmail().equals(userEmail)) {
                    result.put("success", false);
                    result.put("error", "Access denied");
                    return result;
                }
                
                // Return current location data
                Map<String, Object> locationData = new HashMap<>();
                locationData.put("latitude", device.getLatitude());
                locationData.put("longitude", device.getLongitude());
                locationData.put("address", device.getAddress());
                locationData.put("accuracy", device.getLocationAccuracy());
                locationData.put("lastSeen", device.getLastSeen());
                locationData.put("isOnline", device.getIsOnline());
                
                result.put("success", true);
                result.put("location", locationData);
                result.put("deviceName", device.getDeviceName());
                result.put("timestamp", LocalDateTime.now());
                
                // If device is online, request fresh location
                if (device.getIsOnline() != null && device.getIsOnline()) {
                    sendDeviceCommand(deviceId, "UPDATE_LOCATION", Map.of(
                        "action", "update_location",
                        "priority", "high",
                        "timestamp", LocalDateTime.now().toString()
                    ));
                    
                    result.put("message", "Current location returned, requesting fresh update");
                } else {
                    result.put("message", "Last known location returned (device offline)");
                }
                
                System.out.println("📍 Location requested for device: " + deviceId + " by user: " + userEmail);
                
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", "Failed to get location: " + e.getMessage());
                System.err.println("❌ Failed to get location for device " + deviceId + ": " + e.getMessage());
            }
            
            return result;
        });
    }
    
    /**
     * Send command to device agent via command queue
     */
    private void sendDeviceCommand(String deviceId, String command, Map<String, Object> parameters) {
        try {
            // Queue the command for the device agent to poll
            com.example.demo.controller.DeviceCommandController.queueCommand(deviceId, command, parameters);
            
            System.out.println(String.format("📤 Command queued for device %s: %s with parameters: %s", 
                deviceId, command, parameters));
            
        } catch (Exception e) {
            System.err.println("❌ Failed to queue command for device " + deviceId + ": " + e.getMessage());
        }
    }
    
    /**
     * Initialize Quick Actions Service
     */
    public void initialize() {
        System.out.println("✅ Quick Actions Service initialized");
    }
    
    /**
     * Execute action
     */
    public Map<String, Object> executeAction(String deviceId, String action) {
        Map<String, Object> result = new HashMap<>();
        try {
            switch (action.toLowerCase()) {
                case "lock":
                    return lockDevice(deviceId, "system").join();
                case "unlock":
                    return unlockDevice(deviceId, "system").join();
                case "sound":
                    return playSoundOnDevice(deviceId, "system").join();
                case "locate":
                    return getCurrentLocation(deviceId, "system").join();
                case "screenshot":
                    return takeScreenshot(deviceId, "system").join();
                default:
                    result.put("success", false);
                    result.put("error", "Unknown action: " + action);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", "Failed to execute action: " + e.getMessage());
        }
        return result;
    }
}
