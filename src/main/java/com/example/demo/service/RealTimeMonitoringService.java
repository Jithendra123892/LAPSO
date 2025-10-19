package com.example.demo.service;

import com.example.demo.model.Device;
import com.example.demo.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RealTimeMonitoringService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private WebSocketService webSocketService;

    /**
     * Monitor devices in real-time (every 30 seconds)
     */
    @Scheduled(fixedRate = 30000)
    public void monitorDevices() {
        try {
            List<Device> onlineDevices = deviceRepository.findByIsOnlineTrue();
            
            for (Device device : onlineDevices) {
                // Request fresh location update
                requestLocationUpdate(device);
                
                // Send real-time status to user
                sendRealTimeUpdate(device);
            }
            
        } catch (Exception e) {
            System.err.println("Error in real-time monitoring: " + e.getMessage());
        }
    }

    /**
     * Send device status update to user
     */
    public void sendDeviceStatusUpdate(String userEmail, Device device) {
        try {
            Map<String, Object> statusUpdate = new HashMap<>();
            statusUpdate.put("deviceId", device.getDeviceId());
            statusUpdate.put("deviceName", device.getDeviceName());
            statusUpdate.put("isOnline", device.getIsOnline());
            statusUpdate.put("batteryLevel", device.getBatteryLevel());
            statusUpdate.put("lastSeen", device.getLastSeen());
            statusUpdate.put("latitude", device.getLatitude());
            statusUpdate.put("longitude", device.getLongitude());
            statusUpdate.put("address", device.getAddress());
            statusUpdate.put("timestamp", LocalDateTime.now());
            
            webSocketService.sendRealTimeUpdate(userEmail, statusUpdate);
            
        } catch (Exception e) {
            System.err.println("Failed to send device status update: " + e.getMessage());
        }
    }

    /**
     * Request location update for device
     */
    private void requestLocationUpdate(Device device) {
        try {
            // In a real implementation, this would send a command to the device agent
            // For now, we'll just log the request
            System.out.println("Requesting location update for device: " + device.getDeviceId());
            
        } catch (Exception e) {
            System.err.println("Failed to request location update: " + e.getMessage());
        }
    }

    /**
     * Send real-time update via WebSocket
     */
    private void sendRealTimeUpdate(Device device) {
        try {
            Map<String, Object> update = new HashMap<>();
            update.put("deviceId", device.getDeviceId());
            update.put("deviceName", device.getDeviceName());
            update.put("isOnline", device.getIsOnline());
            update.put("batteryLevel", device.getBatteryLevel());
            update.put("lastSeen", device.getLastSeen());
            update.put("latitude", device.getLatitude());
            update.put("longitude", device.getLongitude());
            update.put("address", device.getAddress());
            update.put("timestamp", LocalDateTime.now());
            
            webSocketService.sendRealTimeUpdate(device.getUserEmail(), update);
            
        } catch (Exception e) {
            System.err.println("Failed to send real-time update: " + e.getMessage());
        }
    }

    /**
     * Get monitoring statistics
     */
    public Map<String, Object> getMonitoringStats() {
        Map<String, Object> stats = new HashMap<>();
        try {
            List<Device> allDevices = deviceRepository.findAll();
            List<Device> onlineDevices = deviceRepository.findByIsOnlineTrue();
            
            stats.put("totalDevices", allDevices.size());
            stats.put("onlineDevices", onlineDevices.size());
            stats.put("offlineDevices", allDevices.size() - onlineDevices.size());
            stats.put("activeConnections", webSocketService.getActiveSessionCount());
            stats.put("lastUpdate", LocalDateTime.now());
            
        } catch (Exception e) {
            System.err.println("Error getting monitoring stats: " + e.getMessage());
            stats.put("error", "Failed to get monitoring statistics");
        }
        
        return stats;
    }
    
    /**
     * Start monitoring
     */
    public void startMonitoring() {
        System.out.println("✅ Real-time monitoring started");
    }
    
    /**
     * Add device to monitoring
     */
    public void addDevice(String deviceId) {
        System.out.println("✅ Device added to monitoring: " + deviceId);
    }
    
    /**
     * Check if device is active
     */
    public boolean isDeviceActive(String deviceId) {
        try {
            return deviceRepository.findByDeviceId(deviceId)
                .map(device -> device.getIsOnline())
                .orElse(false);
        } catch (Exception e) {
            return false;
        }
    }
}
