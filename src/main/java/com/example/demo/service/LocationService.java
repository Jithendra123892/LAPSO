package com.example.demo.service;

import com.example.demo.client.LaptopTrackerClient;
import com.example.demo.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class LocationService {
    
    @Autowired
    private LaptopTrackerClient trackerClient;
    
    private final Map<String, Boolean> activeTrackers = new ConcurrentHashMap<>();
    
    public void startTrackingForUser(String userEmail) {
        if (!activeTrackers.getOrDefault(userEmail, false)) {
            try {
                // Start tracking client for this user
                trackerClient.startTracking(userEmail);
                activeTrackers.put(userEmail, true);
                System.out.println("✅ Started tracking for user: " + userEmail);
            } catch (Exception e) {
                System.err.println("❌ Failed to start tracking for user: " + userEmail + " - " + e.getMessage());
            }
        }
    }
    
    public void stopTrackingForUser(String userEmail) {
        if (activeTrackers.getOrDefault(userEmail, false)) {
            try {
                trackerClient.stopTracking();
                activeTrackers.put(userEmail, false);
                System.out.println("🛑 Stopped tracking for user: " + userEmail);
            } catch (Exception e) {
                System.err.println("❌ Failed to stop tracking for user: " + userEmail + " - " + e.getMessage());
            }
        }
    }
    
    public boolean isTrackingActive(String userEmail) {
        return activeTrackers.getOrDefault(userEmail, false);
    }
    
    public void startTrackingForUser(User user) {
        if (user != null && user.getEmail() != null) {
            startTrackingForUser(user.getEmail());
        }
    }
}