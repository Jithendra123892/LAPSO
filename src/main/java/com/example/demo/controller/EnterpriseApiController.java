package com.example.demo.controller;

import com.example.demo.service.*;
import com.example.demo.model.Device;
import com.example.demo.security.SecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Enterprise API Controller
 * Professional REST API endpoints that surpass Microsoft Find My Device capabilities
 */
@RestController
@RequestMapping("/api/v2/enterprise")
@CrossOrigin(origins = "*")
public class EnterpriseApiController {

    @Autowired
    private DeviceService deviceService;
    
    @Autowired
    private EnterpriseRealTimeTrackingService trackingService;
    
    @Autowired
    private EnterpriseDeviceIntelligenceService intelligenceService;
    
    @Autowired
    private SecurityService securityService;

    /**
     * Superior Feature: Real-time device tracking with multiple modes
     */
    @PostMapping("/devices/{deviceId}/tracking/start")
    public ResponseEntity<?> startRealTimeTracking(
            @PathVariable String deviceId,
            @RequestParam(defaultValue = "BALANCED") String mode) {
        
        String userEmail = securityService.getCurrentUserEmail();
        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        
        try {
            EnterpriseRealTimeTrackingService.TrackingMode trackingMode = 
                EnterpriseRealTimeTrackingService.TrackingMode.valueOf(mode);
            
            trackingService.startRealTimeTracking(deviceId, userEmail, trackingMode);
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Real-time tracking started",
                "deviceId", deviceId,
                "mode", mode
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to start tracking: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Superior Feature: Stop real-time tracking
     */
    @PostMapping("/devices/{deviceId}/tracking/stop")
    public ResponseEntity<?> stopRealTimeTracking(@PathVariable String deviceId) {
        String userEmail = securityService.getCurrentUserEmail();
        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        
        trackingService.stopTracking(deviceId);
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Real-time tracking stopped",
            "deviceId", deviceId
        ));
    }
    
    /**
     * Superior Feature: Device health analysis
     */
    @GetMapping("/devices/{deviceId}/health")
    public ResponseEntity<?> getDeviceHealth(@PathVariable String deviceId) {
        String userEmail = securityService.getCurrentUserEmail();
        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        
        try {
            EnterpriseDeviceIntelligenceService.DeviceHealthReport health = 
                intelligenceService.getDeviceHealthScore(deviceId);
            
            if (health == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to get device health: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Superior Feature: Predictive maintenance alerts
     */
    @GetMapping("/devices/{deviceId}/maintenance/predictions")
    public ResponseEntity<?> getPredictiveMaintenanceAlerts(@PathVariable String deviceId) {
        String userEmail = securityService.getCurrentUserEmail();
        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        
        try {
            List<EnterpriseDeviceIntelligenceService.MaintenancePrediction> predictions = 
                intelligenceService.getPredictiveMaintenanceAlerts(deviceId);
            
            return ResponseEntity.ok(Map.of(
                "deviceId", deviceId,
                "predictions", predictions,
                "count", predictions.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to get maintenance predictions: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Superior Feature: Advanced security analysis
     */
    @GetMapping("/devices/{deviceId}/security/analysis")
    public ResponseEntity<?> getSecurityAnalysis(@PathVariable String deviceId) {
        String userEmail = securityService.getCurrentUserEmail();
        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        
        try {
            EnterpriseDeviceIntelligenceService.SecurityAnalysisReport analysis = 
                intelligenceService.getAdvancedSecurityAnalysis(deviceId);
            
            if (analysis == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to get security analysis: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Superior Feature: Usage intelligence and analytics
     */
    @GetMapping("/devices/{deviceId}/intelligence/usage")
    public ResponseEntity<?> getUsageIntelligence(@PathVariable String deviceId) {
        String userEmail = securityService.getCurrentUserEmail();
        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        
        try {
            EnterpriseDeviceIntelligenceService.UsageIntelligenceReport intelligence = 
                intelligenceService.getUsageIntelligence(deviceId);
            
            if (intelligence == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(intelligence);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to get usage intelligence: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Superior Feature: Predicted location estimation
     */
    @GetMapping("/devices/{deviceId}/location/prediction")
    public ResponseEntity<?> getPredictedLocation(@PathVariable String deviceId) {
        String userEmail = securityService.getCurrentUserEmail();
        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        
        try {
            Map<String, Object> prediction = trackingService.getPredictedLocation(deviceId);
            return ResponseEntity.ok(prediction);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to get location prediction: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Superior Feature: Get all active tracking sessions
     */
    @GetMapping("/tracking/sessions")
    public ResponseEntity<?> getActiveTrackingSessions() {
        String userEmail = securityService.getCurrentUserEmail();
        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        
        try {
            List<Map<String, Object>> sessions = trackingService.getActiveTrackingSessions(userEmail);
            return ResponseEntity.ok(Map.of(
                "sessions", sessions,
                "count", sessions.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to get tracking sessions: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Superior Feature: Comprehensive device dashboard data
     */
    @GetMapping("/dashboard/comprehensive")
    public ResponseEntity<?> getComprehensiveDashboard() {
        String userEmail = securityService.getCurrentUserEmail();
        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        
        try {
            List<Device> devices = deviceService.getDevicesByOwnerEmail(userEmail);
            List<Map<String, Object>> sessions = trackingService.getActiveTrackingSessions(userEmail);
            
            // Calculate overall statistics
            int totalDevices = devices.size();
            int onlineDevices = (int) devices.stream().filter(device -> Boolean.TRUE.equals(device.getIsOnline())).count();
            int trackedDevices = sessions.size();
            
            // Calculate average health score
            double avgHealthScore = devices.stream()
                .mapToInt(device -> {
                    EnterpriseDeviceIntelligenceService.DeviceHealthReport health = 
                        intelligenceService.getDeviceHealthScore(device.getDeviceId());
                    return health != null ? health.overallScore : 0;
                })
                .average()
                .orElse(0.0);
            
            return ResponseEntity.ok(Map.of(
                "userEmail", userEmail,
                "totalDevices", totalDevices,
                "onlineDevices", onlineDevices,
                "trackedDevices", trackedDevices,
                "averageHealthScore", Math.round(avgHealthScore),
                "devices", devices,
                "activeSessions", sessions
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to get dashboard data: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Superior Feature: Device remote commands
     */
    @PostMapping("/devices/{deviceId}/commands/{command}")
    public ResponseEntity<?> executeRemoteCommand(
            @PathVariable String deviceId,
            @PathVariable String command,
            @RequestBody(required = false) Map<String, Object> parameters) {
        
        String userEmail = securityService.getCurrentUserEmail();
        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        
        try {
            // Validate device ownership
            Optional<Device> deviceOpt = deviceService.findByDeviceId(deviceId);
            if (deviceOpt.isEmpty() || !deviceOpt.get().getUser().getEmail().equals(userEmail)) {
                return ResponseEntity.status(403).body(Map.of("error", "Device not found or access denied"));
            }
            Device device = deviceOpt.get();
            
            // Execute command based on type
            String result = executeCommand(device, command, parameters);
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "deviceId", deviceId,
                "command", command,
                "result", result,
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to execute command: " + e.getMessage()
            ));
        }
    }
    
    private String executeCommand(Device device, String command, Map<String, Object> parameters) {
        switch (command.toLowerCase()) {
            case "lock":
                device.setIsLocked(true);
                deviceService.saveDevice(device);
                return "Device locked successfully";
            case "unlock":
                device.setIsLocked(false);
                deviceService.saveDevice(device);
                return "Device unlocked successfully";
            case "locate":
                return "Location request sent to device";
            case "alarm":
                return "Alarm activated on device";
            case "wipe":
                return "Remote wipe initiated (simulation)";
            default:
                throw new IllegalArgumentException("Unknown command: " + command);
        }
    }
}
