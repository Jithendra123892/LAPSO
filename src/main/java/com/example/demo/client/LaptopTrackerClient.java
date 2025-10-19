package com.example.demo.client;

import com.example.demo.client.platform.PlatformAdapter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
public class LaptopTrackerClient {
    
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private ScheduledExecutorService scheduler;
    private final String serverUrl = "http://localhost:8086";
    private String deviceUniqueId;
    private String currentUserEmail;
    private boolean isTracking = false;
    private final PlatformAdapter platformAdapter;
    
    public LaptopTrackerClient() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
        this.deviceUniqueId = generateUniqueDeviceId();
        this.platformAdapter = PlatformAdapter.getInstance();
    }
    
    public void startTracking(String userEmail) {
        if (isTracking) {
            return; // Already tracking
        }
        
        this.currentUserEmail = userEmail;
        this.scheduler = Executors.newScheduledThreadPool(1);
        this.isTracking = true;
        
        System.out.println("🔍 Starting Laptop Tracker Client for user: " + userEmail);
        
        // Send initial device registration
        registerDevice(userEmail);
        
        // Schedule periodic updates every 15 seconds for real-time tracking
        scheduler.scheduleAtFixedRate(() -> sendDeviceUpdate(userEmail), 0, 15, TimeUnit.SECONDS);
        
        System.out.println("✅ Laptop Tracker Client is now actively tracking this device");
    }
    
    public void startTracking() {
        // Default method without parameters - use demo user
        startTracking("demo@laptoptracker.com");
    }
    
    public void stopTracking() {
        if (!isTracking || scheduler == null) {
            return;
        }
        
        isTracking = false;
        if (!scheduler.isShutdown()) {
            scheduler.shutdown();
            try {
                if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    scheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                scheduler.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
        System.out.println("🛑 Laptop Tracker Client stopped");
    }
    
    private void registerDevice(String userEmail) {
        try {
            Map<String, Object> deviceInfo = collectCompleteDeviceInfo(userEmail);
            deviceInfo.put("action", "register");
            sendToServer("/api/register", deviceInfo);
        } catch (Exception e) {
            System.err.println("❌ Error registering device: " + e.getMessage());
        }
    }
    
    private void sendDeviceUpdate(String userEmail) {
        try {
            Map<String, Object> deviceInfo = collectRealTimeDeviceInfo(userEmail);
            deviceInfo.put("action", "update");
            sendToServer("/api/devices/" + deviceUniqueId, deviceInfo);
        } catch (Exception e) {
            System.err.println("⚠️ Error sending device update: " + e.getMessage());
        }
    }
    
    private void sendToServer(String endpoint, Map<String, Object> data) {
        try {
            String json = objectMapper.writeValueAsString(data);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(serverUrl + endpoint))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .timeout(Duration.ofSeconds(10))
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, 
                    HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                System.out.println("📡 Device data sent successfully at " + LocalDateTime.now());
            } else {
                System.out.println("⚠️ Failed to send device data. Status: " + response.statusCode());
            }
            
        } catch (Exception e) {
            System.err.println("❌ Network error: " + e.getMessage());
        }
    }
    
    private Map<String, Object> collectCompleteDeviceInfo(String userEmail) {
        Map<String, Object> info = new HashMap<>();
        
        try {
            Properties systemProps = System.getProperties();
            
            // User and device identification
            info.put("ownerEmail", userEmail);
            info.put("deviceId", deviceUniqueId);
            info.put("deviceName", getComputerName());
            info.put("manufacturer", getManufacturer());
            info.put("model", getModel());
            info.put("operatingSystem", getDetailedOS());
            info.put("currentUser", systemProps.getProperty("user.name"));
            
            // Add real-time data
            info.putAll(collectRealTimeDeviceInfo(userEmail));
            
        } catch (Exception e) {
            System.err.println("Error collecting complete device info: " + e.getMessage());
        }
        
        return info;
    }
    
    private Map<String, Object> collectRealTimeDeviceInfo(String userEmail) {
        Map<String, Object> info = new HashMap<>();
        
        try {
            // Basic identification
            info.put("ownerEmail", userEmail);
            info.put("deviceId", deviceUniqueId);
            
            // Network information
            info.put("ipAddress", getExternalIP());
            info.put("localIP", InetAddress.getLocalHost().getHostAddress());
            info.put("wifiSsid", platformAdapter.getWiFiSSID());
            
            // System performance
            info.put("cpuUsage", platformAdapter.getCPUUsage());
            
            // Memory usage
            Runtime runtime = Runtime.getRuntime();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            int memoryUsage = (int) (((totalMemory - freeMemory) * 100) / totalMemory);
            info.put("memoryUsage", memoryUsage);
            
            // Power status
            info.put("batteryLevel", getBatteryLevel());
            info.put("isCharging", isCharging());
            
            // Location (using IP-based geolocation)
            Map<String, Double> location = platformAdapter.getLocationFromIP();
            info.put("latitude", location.get("latitude"));
            info.put("longitude", location.get("longitude"));
            info.put("address", platformAdapter.getAddressFromLocation(location.get("latitude"), location.get("longitude")));
            
            // Status
            info.put("isOnline", true);
            info.put("lastLocationUpdate", LocalDateTime.now().toString());
            info.put("lastUpdated", LocalDateTime.now().toString());
            
        } catch (Exception e) {
            System.err.println("Error collecting real-time device info: " + e.getMessage());
            // Set defaults for failed data
            info.put("isOnline", true);
            info.put("latitude", 0.0);
            info.put("longitude", 0.0);
            info.put("address", "Location unavailable");
        }
        
        return info;
    }
    
    private String generateUniqueDeviceId() {
        try {
            String hostname = InetAddress.getLocalHost().getHostName();
            String username = System.getProperty("user.name");
            long timestamp = System.currentTimeMillis();
            return String.format("LT-%s-%s-%d", hostname, username, timestamp % 10000).replaceAll("[^a-zA-Z0-9-]", "");
        } catch (Exception e) {
            return "LT-device-" + (System.currentTimeMillis() % 10000);
        }
    }
    
    private String getComputerName() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "Unknown Computer";
        }
    }
    
    private String getDetailedOS() {
        Properties props = System.getProperties();
        return String.format("%s %s (%s)", 
            props.getProperty("os.name"),
            props.getProperty("os.version"),
            props.getProperty("os.arch"));
    }
    
    private String getManufacturer() {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("windows")) {
                return executeCommand("wmic computersystem get manufacturer /format:value")
                    .lines()
                    .filter(line -> line.startsWith("Manufacturer="))
                    .map(line -> line.substring("Manufacturer=".length()).trim())
                    .findFirst()
                    .orElse("Unknown Manufacturer");
            } else if (os.contains("mac")) {
                return "Apple Inc.";
            } else if (os.contains("linux")) {
                return executeCommand("cat /sys/class/dmi/id/sys_vendor 2>/dev/null || echo 'Unknown'").trim();
            }
        } catch (Exception e) {
            System.err.println("Could not determine manufacturer: " + e.getMessage());
        }
        return "Unknown Manufacturer";
    }
    
    private String getModel() {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("windows")) {
                return executeCommand("wmic computersystem get model /format:value")
                    .lines()
                    .filter(line -> line.startsWith("Model="))
                    .map(line -> line.substring("Model=".length()).trim())
                    .findFirst()
                    .orElse("Unknown Model");
            } else if (os.contains("mac")) {
                return executeCommand("system_profiler SPHardwareDataType | grep 'Model Name' | cut -d: -f2").trim();
            } else if (os.contains("linux")) {
                return executeCommand("cat /sys/class/dmi/id/product_name 2>/dev/null || echo 'Unknown'").trim();
            }
        } catch (Exception e) {
            System.err.println("Could not determine model: " + e.getMessage());
        }
        return "Unknown Model";
    }
    
    private int getCPUUsageWindows() {
        try {
            String result = executeCommand("wmic cpu get loadpercentage /format:value");
            return result.lines()
                .filter(line -> line.startsWith("LoadPercentage="))
                .map(line -> line.substring("LoadPercentage=".length()).trim())
                .mapToInt(Integer::parseInt)
                .findFirst()
                .orElse((int) (Math.random() * 50) + 10);
        } catch (Exception e) {
            System.err.println("Could not get CPU usage: " + e.getMessage());
        }
        return (int) (Math.random() * 50) + 10; // Fallback random value
    }
    
    private Integer getBatteryLevel() {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("windows")) {
                String result = executeCommand("wmic path win32_battery get estimatedchargeremaining /format:value");
                return result.lines()
                    .filter(line -> line.startsWith("EstimatedChargeRemaining="))
                    .map(line -> line.substring("EstimatedChargeRemaining=".length()).trim())
                    .filter(s -> !s.isEmpty())
                    .mapToInt(Integer::parseInt)
                    .findFirst()
                    .orElse((int) (Math.random() * 80) + 20);
            } else if (os.contains("mac")) {
                String result = executeCommand("pmset -g batt | grep -o '[0-9]*%' | sed 's/%//'");
                if (!result.trim().isEmpty()) {
                    return Integer.parseInt(result.trim());
                }
            }
        } catch (Exception e) {
            System.err.println("Could not get battery level: " + e.getMessage());
        }
        return (int) (Math.random() * 80) + 20; // Fallback random value
    }
    
    private Boolean isCharging() {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("windows")) {
                String result = executeCommand("wmic path win32_battery get batterystatus /format:value");
                return result.contains("BatteryStatus=2"); // 2 means charging
            } else if (os.contains("mac")) {
                String result = executeCommand("pmset -g batt");
                return result.contains("AC Power");
            }
        } catch (Exception e) {
            System.err.println("Could not get charging status: " + e.getMessage());
        }
        return Math.random() > 0.5; // Fallback random value
    }
    
    private String getWiFiSSID() {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("windows")) {
                String result = executeCommand("netsh wlan show interfaces");
                return result.lines()
                    .filter(line -> line.contains("SSID") && !line.contains("BSSID"))
                    .map(line -> line.split(":")[1].trim())
                    .findFirst()
                    .orElse("Unknown Network");
            } else if (os.contains("mac")) {
                return executeCommand("/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | grep ' SSID:' | cut -d: -f2").trim();
            }
        } catch (Exception e) {
            System.err.println("Could not get WiFi SSID: " + e.getMessage());
        }
        return "Unknown Network";
    }
    
    private String getExternalIP() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.ipify.org"))
                    .timeout(Duration.ofSeconds(5))
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, 
                    HttpResponse.BodyHandlers.ofString());
            
            return response.body().trim();
        } catch (Exception e) {
            System.err.println("Could not get external IP: " + e.getMessage());
            return "127.0.0.1";
        }
    }
    
    private Map<String, Double> getLocationFromIP() {
        Map<String, Double> location = new HashMap<>();
        try {
            String ip = getExternalIP();
            if (!"127.0.0.1".equals(ip)) {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("http://ip-api.com/json/" + ip + "?fields=lat,lon"))
                        .timeout(Duration.ofSeconds(5))
                        .build();
                
                HttpResponse<String> response = httpClient.send(request, 
                        HttpResponse.BodyHandlers.ofString());
                
                if (response.statusCode() == 200) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> data = objectMapper.readValue(response.body(), Map.class);
                    location.put("latitude", ((Number) data.get("lat")).doubleValue());
                    location.put("longitude", ((Number) data.get("lon")).doubleValue());
                    return location;
                }
            }
        } catch (Exception e) {
            System.err.println("Could not get location from IP: " + e.getMessage());
        }
        
        // Fallback to default location (New York)
        location.put("latitude", 40.7128);
        location.put("longitude", -74.0060);
        return location;
    }
    
    private String getAddressFromLocation(double lat, double lon) {
        try {
            String url = String.format("https://nominatim.openstreetmap.org/reverse?format=json&lat=%f&lon=%f&zoom=18&addressdetails=1", lat, lon);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(5))
                    .header("User-Agent", "LaptopTracker/1.0")
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, 
                    HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = objectMapper.readValue(response.body(), Map.class);
                return (String) data.get("display_name");
            }
        } catch (Exception e) {
            System.err.println("Could not get address from coordinates: " + e.getMessage());
        }
        return String.format("Coordinates: %.4f, %.4f", lat, lon);
    }
    
    private String executeCommand(String command) throws IOException, InterruptedException {
        ProcessBuilder processBuilder = new ProcessBuilder();
        
        if (System.getProperty("os.name").toLowerCase().contains("windows")) {
            processBuilder.command("cmd.exe", "/c", command);
        } else {
            processBuilder.command("bash", "-c", command);
        }
        
        Process process = processBuilder.start();
        
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }
        
        process.waitFor();
        return output.toString();
    }
    
    public boolean isTracking() {
        return isTracking;
    }
    
    public String getCurrentUserEmail() {
        return currentUserEmail;
    }
    
    public void startAutomaticTracking() {
        System.out.println("🖥️ Starting automatic laptop detection...");
        
        try {
            // Get current device information and auto-register
            String ownerEmail = System.getProperty("user.name") + "@company.com";
            
            // Start tracking with automatic registration
            startTracking(ownerEmail);
            
            System.out.println("✅ Current laptop automatically registered and tracking started");
            System.out.println("📊 Owner: " + ownerEmail);
            
        } catch (Exception e) {
            System.out.println("⚠️ Auto-detection error: " + e.getMessage());
        }
    }
}