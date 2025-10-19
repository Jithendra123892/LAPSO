package com.example.demo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WebSocketService extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userEmail = getUserEmailFromSession(session);
        if (userEmail != null) {
            userSessions.put(userEmail, session);
            System.out.println("WebSocket connection established for user: " + userEmail);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userEmail = getUserEmailFromSession(session);
        if (userEmail != null) {
            userSessions.remove(userEmail);
            System.out.println("WebSocket connection closed for user: " + userEmail);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // Handle incoming messages from clients
        System.out.println("Received message: " + message.getPayload());
    }

    /**
     * Send location update to user
     */
    public void sendLocationUpdate(String userEmail, Map<String, Object> locationData) {
        WebSocketSession session = userSessions.get(userEmail);
        if (session != null && session.isOpen()) {
            try {
                String message = objectMapper.writeValueAsString(Map.of(
                    "type", "location_update",
                    "data", locationData
                ));
                session.sendMessage(new TextMessage(message));
            } catch (IOException e) {
                System.err.println("Failed to send location update: " + e.getMessage());
            }
        }
    }

    /**
     * Send real-time update to user
     */
    public void sendRealTimeUpdate(String userEmail, Map<String, Object> updateData) {
        WebSocketSession session = userSessions.get(userEmail);
        if (session != null && session.isOpen()) {
            try {
                String message = objectMapper.writeValueAsString(Map.of(
                    "type", "real_time_update",
                    "data", updateData
                ));
                session.sendMessage(new TextMessage(message));
            } catch (IOException e) {
                System.err.println("Failed to send real-time update: " + e.getMessage());
            }
        }
    }

    /**
     * Check if WebSocket service is healthy
     */
    public boolean isHealthy() {
        return true; // Simple health check
    }

    /**
     * Get active session count
     */
    public int getActiveSessionCount() {
        return userSessions.size();
    }

    /**
     * Send notification to user
     */
    public void sendNotification(String userEmail, String title, String message) {
        WebSocketSession session = userSessions.get(userEmail);
        if (session != null && session.isOpen()) {
            try {
                String notificationMessage = objectMapper.writeValueAsString(Map.of(
                    "type", "notification",
                    "title", title,
                    "message", message,
                    "timestamp", System.currentTimeMillis()
                ));
                session.sendMessage(new TextMessage(notificationMessage));
            } catch (IOException e) {
                System.err.println("Failed to send notification: " + e.getMessage());
            }
        }
    }

    /**
     * Send notification with type
     */
    public void sendNotification(String type, String message) {
        // Broadcast to all connected users
        userSessions.values().forEach(session -> {
            if (session.isOpen()) {
                try {
                    String notificationMessage = objectMapper.writeValueAsString(Map.of(
                        "type", type,
                        "message", message,
                        "timestamp", System.currentTimeMillis()
                    ));
                    session.sendMessage(new TextMessage(notificationMessage));
                } catch (IOException e) {
                    System.err.println("Failed to send notification: " + e.getMessage());
                }
            }
        });
    }

    /**
     * Send alert to user
     */
    public void sendAlert(String userEmail, String alertType, String message, String deviceId) {
        WebSocketSession session = userSessions.get(userEmail);
        if (session != null && session.isOpen()) {
            try {
                String alertMessage = objectMapper.writeValueAsString(Map.of(
                    "type", "alert",
                    "alertType", alertType,
                    "message", message,
                    "deviceId", deviceId,
                    "timestamp", System.currentTimeMillis()
                ));
                session.sendMessage(new TextMessage(alertMessage));
            } catch (IOException e) {
                System.err.println("Failed to send alert: " + e.getMessage());
            }
        }
    }

    private String getUserEmailFromSession(WebSocketSession session) {
        // Extract user email from session attributes
        return (String) session.getAttributes().get("userEmail");
    }
    
    /**
     * Send geofence alert
     */
    public void sendGeofenceAlert(String userEmail, String alertType, String message) {
        sendAlert(userEmail, alertType, message, "geofence");
    }
    
    /**
     * Broadcast device update
     */
    public void broadcastDeviceUpdate(com.example.demo.model.Device device) {
        try {
            String message = objectMapper.writeValueAsString(Map.of(
                "type", "device_update",
                "deviceId", device.getDeviceId(),
                "deviceName", device.getDeviceName(),
                "isOnline", device.getIsOnline(),
                "timestamp", System.currentTimeMillis()
            ));
            
            for (WebSocketSession session : userSessions.values()) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(new TextMessage(message));
                    } catch (IOException e) {
                        System.err.println("Failed to broadcast device update: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error broadcasting device update: " + e.getMessage());
        }
    }
    
    /**
     * Initialize WebSocket service
     */
    public void initialize() {
        System.out.println("✅ WebSocket Service initialized");
    }
    
    /**
     * Restart WebSocket service
     */
    public void restart() {
        try {
            userSessions.clear();
            System.out.println("✅ WebSocket Service restarted");
        } catch (Exception e) {
            System.err.println("Error restarting WebSocket service: " + e.getMessage());
        }
    }
}