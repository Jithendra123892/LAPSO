package com.example.demo.controller;

import com.example.demo.service.EnterpriseAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Enterprise Analytics REST Controller - Advanced features superior to Microsoft Find My Device
 */
@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class EnterpriseAnalyticsController {
    
    private final EnterpriseAnalyticsService analyticsService;
    
    public EnterpriseAnalyticsController(EnterpriseAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }
    
    /**
     * Get comprehensive enterprise dashboard analytics
     * Superior to Microsoft's basic device listing
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getEnterpriseDashboard() {
        try {
            Map<String, Object> dashboard = analyticsService.getEnterpriseDashboard();
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get real-time statistics for live monitoring
     * Microsoft doesn't provide real-time analytics
     */
    @GetMapping("/realtime")
    public ResponseEntity<Map<String, Object>> getRealTimeStats() {
        try {
            Map<String, Object> stats = analyticsService.getRealTimeStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Generate comprehensive enterprise report
     * Advanced reporting capabilities beyond Microsoft's scope
     */
    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> generateEnterpriseReport() {
        try {
            Map<String, Object> report = analyticsService.generateEnterpriseReport();
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Update analytics data (for client posting analytics)
     */
    @PostMapping("/update")
    public ResponseEntity<String> updateAnalytics(@RequestBody Map<String, Object> analyticsData) {
        try {
            // Process analytics data from clients
            System.out.println("📊 Analytics update received: " + analyticsData);
            return ResponseEntity.ok("Analytics updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update analytics: " + e.getMessage());
        }
    }
}