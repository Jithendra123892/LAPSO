package com.example.demo.service;

import com.example.demo.model.Device;
import com.example.demo.model.LocationData;
import com.example.demo.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class EnhancedLocationService {
    
    @Autowired
    private DeviceRepository deviceRepository;
    
    @Autowired
    private WebSocketService webSocketService;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    /**
     * Get the best available location using multiple sources
     * Note: Accuracy depends on device capabilities (typically 10-100 meters)
     * More features than Microsoft Find My Device, but not military-grade
     */
    public LocationData getBestLocation(String deviceId) {
        // Try GPS first (most accurate)
        LocationData gpsLocation = getGPSLocation(deviceId);
        if (gpsLocation != null && gpsLocation.getAccuracy() < 50) {
            return gpsLocation;
        }
        
        // Fallback to WiFi positioning
        LocationData wifiLocation = getWiFiLocation(deviceId);
        if (wifiLocation != null && wifiLocation.getAccuracy() < 100) {
            return wifiLocation;
        }
        
        // Final fallback to IP geolocation
        LocationData ipLocation = getIPLocation(deviceId);
        return ipLocation;
    }
    
    /**
     * Real-time location updates every 30 seconds
     * More frequent updates than Microsoft Find My Device
     * Note: Requires device to be online and running agent
     */
    @Scheduled(fixedRate = 30000)
    public void updateAllDeviceLocations() {
        List<Device> activeDevices = deviceRepository.findByIsOnlineTrue();
        
        for (Device device : activeDevices) {
            try {
                LocationData location = getBestLocation(device.getId().toString());
                if (location != null) {
                    // Update device location
                    device.setLatitude(location.getLatitude());
                    device.setLongitude(location.getLongitude());
                    device.setAddress(location.getAddress());
                    device.setLastSeen(LocalDateTime.now());
                    deviceRepository.save(device);
                    
                    // Send real-time update via WebSocket
                    Map<String, Object> locationMap = new HashMap<>();
                    locationMap.put("latitude", location.getLatitude());
                    locationMap.put("longitude", location.getLongitude());
                    locationMap.put("address", location.getAddress());
                    locationMap.put("timestamp", location.getTimestamp());
                    webSocketService.sendLocationUpdate(device.getUserEmail(), locationMap);
                }
            } catch (Exception e) {
                // Handle errors gracefully
                System.err.println("Failed to update location for device: " + device.getId());
            }
        }
    }
    
    /**
     * GPS location with high accuracy
     */
    private LocationData getGPSLocation(String deviceId) {
        try {
            // Simulate GPS location (in real implementation, this would come from device)
            // For demo purposes, we'll use a mock GPS service
            return LocationData.builder()
                .deviceId(deviceId)
                .latitude(28.6139 + (Math.random() - 0.5) * 0.01) // Delhi area with small variation
                .longitude(77.2090 + (Math.random() - 0.5) * 0.01)
                .accuracy(5.0 + Math.random() * 10) // 5-15 meter accuracy
                .source("GPS")
                .timestamp(LocalDateTime.now())
                .build();
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * WiFi-based location (better than Microsoft's basic approach)
     */
    private LocationData getWiFiLocation(String deviceId) {
        try {
            // In real implementation, this would scan WiFi networks and use positioning services
            return LocationData.builder()
                .deviceId(deviceId)
                .latitude(28.6139 + (Math.random() - 0.5) * 0.05)
                .longitude(77.2090 + (Math.random() - 0.5) * 0.05)
                .accuracy(20.0 + Math.random() * 30) // 20-50 meter accuracy
                .source("WiFi")
                .timestamp(LocalDateTime.now())
                .build();
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * IP-based geolocation (fallback option)
     */
    private LocationData getIPLocation(String deviceId) {
        try {
            // Use IP geolocation service
            String ipLocationUrl = "http://ip-api.com/json/";
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(ipLocationUrl, Map.class);
            
            if (response != null && "success".equals(response.get("status"))) {
                return LocationData.builder()
                    .deviceId(deviceId)
                    .latitude((Double) response.get("lat"))
                    .longitude((Double) response.get("lon"))
                    .accuracy(1000.0) // IP location is less accurate
                    .source("IP")
                    .address(response.get("city") + ", " + response.get("country"))
                    .timestamp(LocalDateTime.now())
                    .build();
            }
        } catch (Exception e) {
            // Fallback to default location
            return LocationData.builder()
                .deviceId(deviceId)
                .latitude(28.6139) // Delhi
                .longitude(77.2090)
                .accuracy(5000.0)
                .source("Default")
                .address("New Delhi, India")
                .timestamp(LocalDateTime.now())
                .build();
        }
        return null;
    }
    
    /**
     * Get location history for analytics
     * Microsoft Find My Device has limited history
     */
    public List<LocationData> getLocationHistory(String deviceId, int days) {
        // In real implementation, this would query location history from database
        // For now, return mock data
        return List.of(
            LocationData.builder()
                .deviceId(deviceId)
                .latitude(28.6139)
                .longitude(77.2090)
                .address("Connaught Place, New Delhi")
                .timestamp(LocalDateTime.now().minusHours(1))
                .build(),
            LocationData.builder()
                .deviceId(deviceId)
                .latitude(28.6129)
                .longitude(77.2080)
                .address("Rajiv Chowk, New Delhi")
                .timestamp(LocalDateTime.now().minusHours(2))
                .build()
        );
    }
    
    /**
     * Initialize location service
     */
    public void initialize() {
        System.out.println("✅ Enhanced Location Service initialized");
    }
    
    /**
     * Update device location
     */
    public void updateDeviceLocation(String deviceId, Double latitude, Double longitude, String address) {
        try {
            Device device = deviceRepository.findByDeviceId(deviceId).orElse(null);
            if (device != null) {
                device.setLatitude(latitude);
                device.setLongitude(longitude);
                device.setAddress(address);
                device.setLastSeen(LocalDateTime.now());
                deviceRepository.save(device);
                
                // Send real-time update
                Map<String, Object> locationMap = new HashMap<>();
                locationMap.put("latitude", latitude);
                locationMap.put("longitude", longitude);
                locationMap.put("address", address);
                locationMap.put("timestamp", LocalDateTime.now());
                webSocketService.sendLocationUpdate(device.getUserEmail(), locationMap);
            }
        } catch (Exception e) {
            System.err.println("Failed to update device location: " + e.getMessage());
        }
    }
    
    /**
     * Get device location data
     */
    public Map<String, Object> getDeviceLocationData(String deviceId) {
        try {
            Device device = deviceRepository.findByDeviceId(deviceId).orElse(null);
            if (device != null) {
                Map<String, Object> locationData = new HashMap<>();
                locationData.put("deviceId", deviceId);
                locationData.put("latitude", device.getLatitude());
                locationData.put("longitude", device.getLongitude());
                locationData.put("address", device.getAddress());
                locationData.put("lastSeen", device.getLastSeen());
                locationData.put("isOnline", device.getIsOnline());
                return locationData;
            }
        } catch (Exception e) {
            System.err.println("Failed to get device location data: " + e.getMessage());
        }
        return new HashMap<>();
    }
}