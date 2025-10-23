package com.example.demo.controller;

import com.example.demo.service.PerfectAuthService;
import com.example.demo.service.DeviceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/device-commands")
public class DeviceCommandController {

    @Autowired
    private PerfectAuthService authService;
    
    @Autowired
    private DeviceService deviceService;
    
    // Store pending commands for devices (in production, use database)
    private static final Map<String, Queue<DeviceCommand>> pendingCommands = new ConcurrentHashMap<>();

    /**
     * Agent polls for pending commands
     */
    @GetMapping("/poll/{deviceId}")
    public ResponseEntity<Map<String, Object>> pollForCommands(
            @PathVariable String deviceId,
            @RequestParam String userEmail) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("🔍 POLL REQUEST: Device=" + deviceId + ", User=" + userEmail);
            System.out.println("🔍 Total devices in queue: " + pendingCommands.size());
            System.out.println("🔍 Queue keys: " + pendingCommands.keySet());
            
            // Verify device exists and user owns it
            var deviceOpt = deviceService.findByDeviceId(deviceId);
            if (deviceOpt.isEmpty()) {
                System.out.println("❌ POLL ERROR: Device not found: " + deviceId);
                response.put("success", false);
                response.put("error", "Device not found");
                return ResponseEntity.status(404).body(response);
            }
            
            var device = deviceOpt.get();
            if (!device.getUserEmail().equals(userEmail)) {
                System.out.println("❌ POLL ERROR: Access denied for " + userEmail + " on device " + deviceId);
                response.put("success", false);
                response.put("error", "Access denied");
                return ResponseEntity.status(403).body(response);
            }
            
            // Get pending commands
            Queue<DeviceCommand> commands = pendingCommands.getOrDefault(deviceId, new LinkedList<>());
            System.out.println("🔍 Commands in queue for " + deviceId + ": " + commands.size());
            
            List<DeviceCommand> commandList = new ArrayList<>();
            
            // Return up to 5 commands at once
            for (int i = 0; i < 5 && !commands.isEmpty(); i++) {
                DeviceCommand cmd = commands.poll();
                commandList.add(cmd);
                System.out.println("📤 Dequeued command: " + cmd.getAction() + " (ID: " + cmd.getCommandId() + ")");
            }
            
            response.put("success", true);
            response.put("commands", commandList);
            response.put("commandCount", commandList.size());
            response.put("timestamp", LocalDateTime.now());
            
            if (!commandList.isEmpty()) {
                System.out.println("✅ Sent " + commandList.size() + " commands to device: " + deviceId);
            } else {
                System.out.println("ℹ️ No pending commands for device: " + deviceId);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Failed to poll commands: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Agent reports command execution result
     */
    @PostMapping("/result/{deviceId}")
    public ResponseEntity<Map<String, Object>> reportCommandResult(
            @PathVariable String deviceId,
            @RequestBody Map<String, Object> result) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String commandId = (String) result.get("commandId");
            String status = (String) result.get("status");
            String message = (String) result.get("message");
            
            System.out.println(String.format("📥 Command result from %s: %s - %s (%s)", 
                deviceId, commandId, status, message));
            
            // In production, you'd store this in database for audit trail
            
            response.put("success", true);
            response.put("message", "Command result recorded");
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Failed to record result: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Queue a command for a device (called by QuickActionsService)
     */
    public static void queueCommand(String deviceId, String action, Map<String, Object> parameters) {
        DeviceCommand command = new DeviceCommand(
            UUID.randomUUID().toString(),
            action,
            parameters,
            LocalDateTime.now()
        );
        
        pendingCommands.computeIfAbsent(deviceId, k -> new LinkedList<>()).offer(command);
        
        System.out.println("📋 QUEUED COMMAND:");
        System.out.println("   Device ID: " + deviceId);
        System.out.println("   Action: " + action);
        System.out.println("   Command ID: " + command.getCommandId());
        System.out.println("   Queue size for device: " + pendingCommands.get(deviceId).size());
        System.out.println("   Total devices with commands: " + pendingCommands.size());
    }
    
    /**
     * Get pending command count for a device
     */
    @GetMapping("/count/{deviceId}")
    public ResponseEntity<Map<String, Object>> getPendingCommandCount(@PathVariable String deviceId) {
        
        if (!authService.isLoggedIn()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        
        Queue<DeviceCommand> commands = pendingCommands.getOrDefault(deviceId, new LinkedList<>());
        
        Map<String, Object> response = new HashMap<>();
        response.put("deviceId", deviceId);
        response.put("pendingCommands", commands.size());
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Device command data class
     */
    public static class DeviceCommand {
        private final String commandId;
        private final String action;
        private final Map<String, Object> parameters;
        private final LocalDateTime timestamp;
        
        public DeviceCommand(String commandId, String action, Map<String, Object> parameters, LocalDateTime timestamp) {
            this.commandId = commandId;
            this.action = action;
            this.parameters = parameters;
            this.timestamp = timestamp;
        }
        
        public String getCommandId() { return commandId; }
        public String getAction() { return action; }
        public Map<String, Object> getParameters() { return parameters; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
}
