package com.example.demo.controller;

import com.example.demo.model.Device;
import com.example.demo.model.User;
import com.example.demo.service.DeviceService;
import com.example.demo.service.DeviceStats;
import com.example.demo.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {
    
    private final DeviceService deviceService;
    private final UserRepository userRepository;
    
    public ApiController(DeviceService deviceService, UserRepository userRepository) {
        this.deviceService = deviceService;
        this.userRepository = userRepository;
    }
    
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerDevice(@RequestBody DeviceRegistration registration) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "User not authenticated. Please log in to register a device."
                ));
            }
            String ownerEmail = authentication.getName();
            User user = userRepository.findByEmail(ownerEmail)
                            .orElseThrow(() -> new RuntimeException("Authenticated user not found in database."));

            Device device = deviceService.registerDevice(
                user,
                registration.deviceName,
                registration.manufacturer,
                registration.model,
                registration.operatingSystem
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "deviceId", device.getDeviceId(),
                "message", "Device registered successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Registration failed: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/auto-detect")
    public ResponseEntity<Map<String, Object>> autoDetectDevice(@RequestBody Map<String, Object> deviceInfo) {
        // SECURITY FIX: Disabled auto-detection to prevent privacy breach
        // This endpoint was automatically registering ANY device for ANY user
        // causing major security issues where users could accidentally register other people's devices
        
        return ResponseEntity.ok(Map.of(
            "success", false,
            "message", "Auto-detection has been disabled for security reasons. Please manually register your device.",
            "securityNote", "Auto-registration was causing privacy breaches where users could register devices they don't own."
        ));
    }
    
    private String generateDeviceName(String userAgent) {
        if (userAgent.contains("Windows")) return "Windows Laptop";
        if (userAgent.contains("Mac")) return "MacBook";
        if (userAgent.contains("Linux")) return "Linux Computer";
        if (userAgent.contains("Android")) return "Android Device";
        if (userAgent.contains("iPhone") || userAgent.contains("iPad")) return "iOS Device";
        return "Web Browser Device";
    }
    
    private String extractManufacturer(String userAgent) {
        if (userAgent.contains("Windows")) return "Microsoft";
        if (userAgent.contains("Mac")) return "Apple";
        if (userAgent.contains("Chrome")) return "Google Chrome";
        if (userAgent.contains("Firefox")) return "Mozilla";
        if (userAgent.contains("Safari")) return "Apple Safari";
        return "Unknown Manufacturer";
    }
    
    private String extractModel(String userAgent) {
        if (userAgent.contains("Windows NT 10")) return "Windows 10/11";
        if (userAgent.contains("Windows NT 6")) return "Windows 7/8";
        if (userAgent.contains("Mac OS X")) return "macOS";
        if (userAgent.contains("Ubuntu")) return "Ubuntu Linux";
        return "Unknown Model";
    }
    
    private String extractOS(String userAgent) {
        if (userAgent.contains("Windows NT")) return "Windows";
        if (userAgent.contains("Mac OS X")) return "macOS";
        if (userAgent.contains("Linux")) return "Linux";
        if (userAgent.contains("Android")) return "Android";
        if (userAgent.contains("iPhone OS")) return "iOS";
        return "Unknown OS";
    }

    @PostMapping("/devices/{deviceId}/update")
    public ResponseEntity<Map<String, Object>> updateDeviceFromClient(
            @PathVariable String deviceId,
            @RequestBody Map<String, Object> deviceData) {
        try {
            // The updateDevice method in DeviceService already handles access validation
            Device device = deviceService.updateDevice(deviceId, deviceData);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "deviceId", device.getDeviceId(),
                "message", "Device updated successfully"
            ));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "Access denied: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Update failed: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/devices/{deviceId}")
    public ResponseEntity<Map<String, Object>> registerOrUpdateDevice(
            @PathVariable String deviceId,
            @RequestBody Map<String, Object> deviceData) {
        try {
            Device device = deviceService.registerOrUpdateDevice(deviceId, deviceData);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "deviceId", device.getDeviceId(),
                "message", "Device registered/updated successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Operation failed: " + e.getMessage()
            ));
        }
    }
    
    @PutMapping("/devices/{deviceId}")
    public ResponseEntity<Map<String, Object>> updateDevice(
            @PathVariable String deviceId,
            @RequestBody Map<String, Object> deviceData) {
        try {
            Device device = deviceService.updateDevice(deviceId, deviceData);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "deviceId", device.getDeviceId(),
                "message", "Device updated successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Update failed: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/{deviceId}/location")
    public ResponseEntity<Map<String, Object>> updateLocation(
            @PathVariable String deviceId,
            @RequestBody LocationUpdate location) {
        try {
            deviceService.updateLocation(
                deviceId,
                location.latitude,
                location.longitude,
                location.address
            );
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Location updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PostMapping("/{deviceId}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable String deviceId,
            @RequestBody StatusUpdate status) {
        try {
            deviceService.updateStatus(
                deviceId,
                status.batteryLevel,
                status.isCharging,
                status.cpuUsage != null ? status.cpuUsage.doubleValue() : 0.0,
                status.memoryUsage != null ? status.memoryUsage.longValue() : 0L,
                100L, // memory total - we'll update this properly later
                status.ipAddress,
                status.wifiSsid
            );
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Status updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @GetMapping("/devices")
    public ResponseEntity<List<Device>> getDevices() {
        return ResponseEntity.ok(deviceService.getCurrentUserDevices());
    }
    
    @PostMapping("/{deviceId}/stolen")
    public ResponseEntity<Map<String, Object>> reportStolen(@PathVariable String deviceId) {
        try {
            deviceService.reportStolen(deviceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Device reported stolen"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PostMapping("/{deviceId}/lock")
    public ResponseEntity<Map<String, Object>> lockDevice(@PathVariable String deviceId) {
        try {
            deviceService.lockDevice(deviceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Device locked"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PostMapping("/{deviceId}/unlock")
    public ResponseEntity<Map<String, Object>> unlockDevice(@PathVariable String deviceId) {
        try {
            deviceService.unlockDevice(deviceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Device unlocked"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<DeviceStats> getStats() {
        return ResponseEntity.ok(deviceService.getCurrentUserDeviceStats());
    }
    
    // Real-time device monitoring endpoints
    @PostMapping("/devices/{deviceId}/heartbeat")
    public ResponseEntity<Map<String, Object>> deviceHeartbeat(
            @PathVariable String deviceId,
            @RequestBody Map<String, Object> systemInfo) {
        try {
            deviceService.updateDevice(deviceId, systemInfo);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Heartbeat received",
                "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Heartbeat failed: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/devices/{deviceId}/performance")
    public ResponseEntity<Map<String, Object>> reportPerformance(
            @PathVariable String deviceId,
            @RequestBody PerformanceData performanceData) {
        try {
            Map<String, Object> updateData = Map.of(
                "cpuUsage", performanceData.cpuUsage,
                "memoryUsed", performanceData.memoryUsed,
                "memoryTotal", performanceData.memoryTotal,
                "diskUsed", performanceData.diskUsed,
                "diskTotal", performanceData.diskTotal,
                "batteryLevel", performanceData.batteryLevel,
                "isCharging", performanceData.isCharging
            );
            
            deviceService.updateDevice(deviceId, updateData);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Performance data updated"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Performance update failed: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/devices/{deviceId}/location-update")
    public ResponseEntity<Map<String, Object>> updateLocationData(
            @PathVariable String deviceId,
            @RequestBody LocationData locationData) {
        try {
            Map<String, Object> updateData = Map.of(
                "latitude", locationData.latitude,
                "longitude", locationData.longitude,
                "address", locationData.address != null ? locationData.address : "",
                "locationAccuracy", locationData.accuracy != null ? locationData.accuracy : 0.0
            );
            
            deviceService.updateDevice(deviceId, updateData);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Location updated successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Location update failed: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/analytics/real-time")
    public ResponseEntity<Map<String, Object>> getRealTimeAnalytics(@RequestParam(required = false) String userEmail) {
        try {
            List<Device> devices;
            if (userEmail != null) {
                devices = deviceService.getAllAccessibleDevices(userEmail);
            } else {
                devices = deviceService.getCurrentUserDevices();
            }
            
            Map<String, Object> analytics = Map.of(
                "timestamp", System.currentTimeMillis(),
                "totalDevices", devices.size(),
                "onlineDevices", devices.stream().mapToInt(d -> d.getIsOnline() ? 1 : 0).sum(),
                "offlineDevices", devices.stream().mapToInt(d -> !d.getIsOnline() ? 1 : 0).sum(),
                "lowBatteryDevices", devices.stream().mapToInt(d -> 
                    d.getBatteryLevel() != null && d.getBatteryLevel() < 20 ? 1 : 0).sum(),
                "criticalBatteryDevices", devices.stream().mapToInt(d -> 
                    d.getBatteryLevel() != null && d.getBatteryLevel() < 10 ? 1 : 0).sum(),
                "highCpuDevices", devices.stream().mapToInt(d -> 
                    d.getCpuUsage() != null && d.getCpuUsage() > 80 ? 1 : 0).sum(),
                "averageBatteryLevel", devices.stream()
                    .filter(d -> d.getBatteryLevel() != null)
                    .mapToInt(Device::getBatteryLevel)
                    .average().orElse(0.0),
                "averageCpuUsage", devices.stream()
                    .filter(d -> d.getCpuUsage() != null)
                    .mapToDouble(Device::getCpuUsage)
                    .average().orElse(0.0)
            );
            
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to get real-time analytics: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/devices/{deviceId}/status")
    public ResponseEntity<Map<String, Object>> getDeviceStatus(@PathVariable String deviceId) {
        try {
            var deviceOpt = deviceService.getDevice(deviceId);
            if (deviceOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Device device = deviceOpt.get();
            return ResponseEntity.ok(Map.of(
                "deviceId", device.getDeviceId(),
                "deviceName", device.getDeviceName(),
                "isOnline", device.getIsOnline(),
                "batteryLevel", device.getBatteryLevel() != null ? device.getBatteryLevel() : 0,
                "isCharging", device.getIsCharging() != null ? device.getIsCharging() : false,
                "cpuUsage", device.getCpuUsage() != null ? device.getCpuUsage() : 0,
                "memoryUsed", device.getMemoryUsed() != null ? device.getMemoryUsed() : 0,
                "memoryTotal", device.getMemoryTotal() != null ? device.getMemoryTotal() : 0,
                "lastSeen", device.getLastSeen() != null ? device.getLastSeen().toString() : null,
                "location", Map.of(
                    "latitude", device.getLatitude() != null ? device.getLatitude() : 0,
                    "longitude", device.getLongitude() != null ? device.getLongitude() : 0,
                    "address", device.getAddress() != null ? device.getAddress() : ""
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to get device status: " + e.getMessage()
            ));
        }
    }
    
    // DTOs
    public static class DeviceRegistration {
        public String deviceName;
        public String manufacturer;
        public String model;
        public String operatingSystem;
    }
    
    public static class LocationUpdate {
        public Double latitude;
        public Double longitude;
        public String address;
    }
    
    public static class StatusUpdate {
        public Integer batteryLevel;
        public Boolean isCharging;
        public String currentUser;
        public Integer cpuUsage;
        public Integer memoryUsage;
        public String ipAddress;
        public String wifiSsid;
    }
    
    public static class PerformanceData {
        public Double cpuUsage;
        public Long memoryUsed;
        public Long memoryTotal;
        public Long diskUsed;
        public Long diskTotal;
        public Integer batteryLevel;
        public Boolean isCharging;
    }
    
    public static class LocationData {
        public Double latitude;
        public Double longitude;
        public String address;
        public Double accuracy;
    }
}