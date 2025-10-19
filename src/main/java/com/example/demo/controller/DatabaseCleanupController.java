package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cleanup")
public class DatabaseCleanupController {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * COMPLETE database cleanup - removes ALL fake data
     * DELETE /api/cleanup/all-fake-data
     */
    @DeleteMapping("/all-fake-data")
    @Transactional
    public Map<String, Object> completeCleanup() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get counts before cleanup
            int devicesBefore = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM laptops", Integer.class);
            int usersBefore = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
            int sharesBefore = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM device_shares", Integer.class);
            
            // Clean everything
            jdbcTemplate.execute("DELETE FROM device_shares");
            jdbcTemplate.execute("DELETE FROM laptops WHERE device_id LIKE 'LT-%'");
            jdbcTemplate.execute("DELETE FROM users WHERE email LIKE '%company.com%' OR email LIKE '%example.com%'");
            
            // Get counts after cleanup
            int devicesAfter = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM laptops", Integer.class);
            int usersAfter = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
            int sharesAfter = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM device_shares", Integer.class);
            
            response.put("success", true);
            response.put("message", "Database completely cleaned of fake data");
            response.put("before", Map.of(
                "users", usersBefore,
                "devices", devicesBefore, 
                "shares", sharesBefore
            ));
            response.put("after", Map.of(
                "users", usersAfter,
                "devices", devicesAfter,
                "shares", sharesAfter
            ));
            response.put("deleted", Map.of(
                "users", usersBefore - usersAfter,
                "devices", devicesBefore - devicesAfter,
                "shares", sharesBefore - sharesAfter
            ));
            response.put("status", "Database is now clean and ready for real users");
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to clean database: " + e.getMessage());
            e.printStackTrace();
        }
        
        return response;
    }
    
    /**
     * Get current database status
     * GET /api/cleanup/status
     */
    @GetMapping("/status")
    public Map<String, Object> getDatabaseStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            int userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
            int deviceCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM laptops", Integer.class);
            int shareCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM device_shares", Integer.class);
            
            status.put("userCount", userCount);
            status.put("deviceCount", deviceCount);
            status.put("shareCount", shareCount);
            status.put("databaseStatus", "Connected");
            status.put("isClean", deviceCount == 0);
            status.put("message", deviceCount == 0 ? 
                "✅ Database is completely clean - ready for real users" : 
                "⚠️ Database contains " + userCount + " users and " + deviceCount + " devices");
            status.put("success", true);
            
        } catch (Exception e) {
            status.put("success", false);
            status.put("message", "Database error: " + e.getMessage());
        }
        
        return status;
    }
}