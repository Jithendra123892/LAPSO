package com.example.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class SmartAlertService {
    
    @Autowired
    private WebSocketService webSocketService;
    
    public void initialize() {
        System.out.println("✅ Smart Alert Service initialized");
    }
    
    public void sendSmartAlert(String userEmail, String alertType, String message) {
        webSocketService.sendAlert(userEmail, alertType, message, "system");
    }
    
    public boolean isHealthy() {
        return true;
    }
    
    /**
     * Check low battery
     */
    public void checkLowBattery(com.example.demo.model.Device device) {
        if (device.getBatteryLevel() != null && device.getBatteryLevel() < 20) {
            sendSmartAlert(device.getUserEmail(), "LOW_BATTERY", 
                "Device " + device.getDeviceName() + " has low battery: " + device.getBatteryLevel() + "%");
        }
    }
    
    /**
     * Check performance issues
     */
    public void checkPerformanceIssues(com.example.demo.model.Device device) {
        if (device.getCpuUsage() != null && device.getCpuUsage() > 90) {
            sendSmartAlert(device.getUserEmail(), "HIGH_CPU", 
                "Device " + device.getDeviceName() + " has high CPU usage: " + device.getCpuUsage() + "%");
        }
    }
    
    /**
     * Check unusual activity
     */
    public void checkUnusualActivity(com.example.demo.model.Device device) {
        // Simple check for unusual activity
        if (device.getLastSeen() != null && 
            java.time.Duration.between(device.getLastSeen(), java.time.LocalDateTime.now()).toHours() > 24) {
            sendSmartAlert(device.getUserEmail(), "UNUSUAL_ACTIVITY", 
                "Device " + device.getDeviceName() + " has been offline for over 24 hours");
        }
    }
}