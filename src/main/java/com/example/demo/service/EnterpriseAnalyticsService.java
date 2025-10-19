package com.example.demo.service;

import com.example.demo.model.Device;
import com.example.demo.repository.DeviceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Enterprise Analytics Service - Advanced features superior to Microsoft Find My Device
 */
@Service
@Transactional
public class EnterpriseAnalyticsService {
    
    private final DeviceRepository deviceRepository;
    
    public EnterpriseAnalyticsService(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }
    
    /**
     * Get enterprise dashboard analytics - Microsoft lacks this depth
     */
    public Map<String, Object> getEnterpriseDashboard() {
        List<Device> allDevices = deviceRepository.findAll();
        
        Map<String, Object> analytics = new HashMap<>();
        
        // Basic metrics
        analytics.put("totalDevices", allDevices.size());
        analytics.put("onlineDevices", allDevices.stream().mapToInt(d -> d.getIsOnline() ? 1 : 0).sum());
        analytics.put("offlineDevices", allDevices.stream().mapToInt(d -> !d.getIsOnline() ? 1 : 0).sum());
        analytics.put("stolenDevices", allDevices.stream().mapToInt(d -> d.getIsStolen() != null && d.getIsStolen() ? 1 : 0).sum());
        
        // Advanced analytics - Microsoft doesn't provide these
        analytics.put("lowBatteryDevices", allDevices.stream().mapToInt(d -> 
            d.getBatteryLevel() != null && d.getBatteryLevel() < 20 ? 1 : 0).sum());
        
        analytics.put("criticalBatteryDevices", allDevices.stream().mapToInt(d -> 
            d.getBatteryLevel() != null && d.getBatteryLevel() < 10 ? 1 : 0).sum());
        
        analytics.put("highCpuDevices", allDevices.stream().mapToInt(d -> 
            d.getCpuUsage() != null && d.getCpuUsage() > 80 ? 1 : 0).sum());
        
        analytics.put("highMemoryDevices", allDevices.stream().mapToInt(d -> 
            d.getMemoryUsage() != null && d.getMemoryUsage() > 85 ? 1 : 0).sum());
        
        // Performance analytics
        OptionalDouble avgBattery = allDevices.stream()
            .filter(d -> d.getBatteryLevel() != null)
            .mapToInt(Device::getBatteryLevel)
            .average();
        analytics.put("averageBatteryLevel", avgBattery.isPresent() ? (int) avgBattery.getAsDouble() : 0);
        
        OptionalDouble avgCpu = allDevices.stream()
            .filter(d -> d.getCpuUsage() != null)
            .mapToDouble(Device::getCpuUsage)
            .average();
        analytics.put("averageCpuUsage", avgCpu.isPresent() ? (int) avgCpu.getAsDouble() : 0);
        
        OptionalDouble avgMemory = allDevices.stream()
            .filter(d -> d.getMemoryUsage() != null)
            .mapToDouble(Device::getMemoryUsage)
            .average();
        analytics.put("averageMemoryUsage", avgMemory.isPresent() ? (int) avgMemory.getAsDouble() : 0);
        
        // Geographic distribution
        Map<String, Long> locationDistribution = allDevices.stream()
            .filter(d -> d.getAddress() != null)
            .collect(Collectors.groupingBy(
                d -> extractCity(d.getAddress()),
                Collectors.counting()
            ));
        analytics.put("locationDistribution", locationDistribution);
        
        // Operating system distribution
        Map<String, Long> osDistribution = allDevices.stream()
            .filter(d -> d.getOperatingSystem() != null)
            .collect(Collectors.groupingBy(
                d -> extractOSFamily(d.getOperatingSystem()),
                Collectors.counting()
            ));
        analytics.put("osDistribution", osDistribution);
        
        // Manufacturer distribution
        Map<String, Long> manufacturerDistribution = allDevices.stream()
            .filter(d -> d.getManufacturer() != null)
            .collect(Collectors.groupingBy(
                Device::getManufacturer,
                Collectors.counting()
            ));
        analytics.put("manufacturerDistribution", manufacturerDistribution);
        
        // Security metrics
        analytics.put("securityThreats", calculateSecurityThreats(allDevices));
        analytics.put("networkAnalysis", analyzeNetworkPatterns(allDevices));
        analytics.put("performanceAlerts", generatePerformanceAlerts(allDevices));
        
        // Time-based analytics
        analytics.put("recentActivity", getRecentActivity(allDevices));
        analytics.put("uptimeAnalysis", analyzeUptime(allDevices));
        
        return analytics;
    }
    
    private String extractCity(String address) {
        if (address == null) return "Unknown";
        String[] parts = address.split(",");
        return parts.length > 0 ? parts[0].trim() : "Unknown";
    }
    
    private String extractOSFamily(String os) {
        if (os == null) return "Unknown";
        String osLower = os.toLowerCase();
        if (osLower.contains("windows")) return "Windows";
        if (osLower.contains("mac") || osLower.contains("darwin")) return "macOS";
        if (osLower.contains("linux")) return "Linux";
        if (osLower.contains("android")) return "Android";
        if (osLower.contains("ios")) return "iOS";
        return "Other";
    }
    
    private Map<String, Object> calculateSecurityThreats(List<Device> devices) {
        Map<String, Object> threats = new HashMap<>();
        
        int stolenDevices = (int) devices.stream().filter(d -> d.getIsStolen() != null && d.getIsStolen()).count();
        int offlineDevices = (int) devices.stream().filter(d -> !d.getIsOnline()).count();
        int suspiciousDevices = (int) devices.stream().filter(this::isSuspiciousDevice).count();
        
        threats.put("stolenDevices", stolenDevices);
        threats.put("offlineDevices", offlineDevices);
        threats.put("suspiciousDevices", suspiciousDevices);
        
        // Calculate threat level
        double totalDevices = devices.size();
        if (totalDevices == 0) {
            threats.put("threatLevel", "NONE");
        } else {
            double threatPercentage = ((stolenDevices + suspiciousDevices) / totalDevices) * 100;
            if (threatPercentage >= 20) {
                threats.put("threatLevel", "HIGH");
            } else if (threatPercentage >= 10) {
                threats.put("threatLevel", "MEDIUM");
            } else if (threatPercentage > 0) {
                threats.put("threatLevel", "LOW");
            } else {
                threats.put("threatLevel", "NONE");
            }
        }
        
        return threats;
    }
    
    private boolean isSuspiciousDevice(Device device) {
        // Check for suspicious patterns
        if (device.getBatteryLevel() != null && device.getBatteryLevel() < 5) return true;
        if (device.getCpuUsage() != null && device.getCpuUsage() > 95) return true;
        if (device.getLastLocationUpdate() != null && 
            device.getLastLocationUpdate().isBefore(LocalDateTime.now().minusHours(24))) return true;
        
        return false;
    }
    
    private Map<String, Object> analyzeNetworkPatterns(List<Device> devices) {
        Map<String, Object> network = new HashMap<>();
        
        // WiFi SSID analysis
        Map<String, Long> wifiDistribution = devices.stream()
            .filter(d -> d.getWifiSsid() != null && !d.getWifiSsid().isEmpty())
            .collect(Collectors.groupingBy(
                Device::getWifiSsid,
                Collectors.counting()
            ));
        network.put("wifiDistribution", wifiDistribution);
        
        // IP address patterns
        Map<String, Long> ipPatterns = devices.stream()
            .filter(d -> d.getIpAddress() != null)
            .collect(Collectors.groupingBy(
                d -> extractIPSubnet(d.getIpAddress()),
                Collectors.counting()
            ));
        network.put("ipSubnetDistribution", ipPatterns);
        
        // Network security analysis
        int unsecuredConnections = (int) devices.stream()
            .filter(d -> d.getWifiSsid() != null && isUnsecuredNetwork(d.getWifiSsid()))
            .count();
        network.put("unsecuredConnections", unsecuredConnections);
        
        return network;
    }
    
    private String extractIPSubnet(String ipAddress) {
        if (ipAddress == null) return "Unknown";
        String[] parts = ipAddress.split("\\.");
        if (parts.length >= 3) {
            return parts[0] + "." + parts[1] + "." + parts[2] + ".x";
        }
        return "Unknown";
    }
    
    private boolean isUnsecuredNetwork(String ssid) {
        String ssidLower = ssid.toLowerCase();
        return ssidLower.contains("open") || ssidLower.contains("public") || 
               ssidLower.contains("guest") || ssidLower.contains("free");
    }
    
    private List<Map<String, Object>> generatePerformanceAlerts(List<Device> devices) {
        List<Map<String, Object>> alerts = new ArrayList<>();
        
        for (Device device : devices) {
            // Battery alerts
            if (device.getBatteryLevel() != null && device.getBatteryLevel() < 15) {
                Map<String, Object> alert = new HashMap<>();
                alert.put("deviceId", device.getDeviceId());
                alert.put("deviceName", device.getDeviceName());
                alert.put("type", "LOW_BATTERY");
                alert.put("severity", device.getBatteryLevel() < 5 ? "CRITICAL" : "WARNING");
                alert.put("message", "Battery level is " + device.getBatteryLevel() + "%");
                alerts.add(alert);
            }
            
            // CPU alerts
            if (device.getCpuUsage() != null && device.getCpuUsage() > 90) {
                Map<String, Object> alert = new HashMap<>();
                alert.put("deviceId", device.getDeviceId());
                alert.put("deviceName", device.getDeviceName());
                alert.put("type", "HIGH_CPU");
                alert.put("severity", "WARNING");
                alert.put("message", "CPU usage is " + device.getCpuUsage() + "%");
                alerts.add(alert);
            }
            
            // Memory alerts
            if (device.getMemoryUsage() != null && device.getMemoryUsage() > 90) {
                Map<String, Object> alert = new HashMap<>();
                alert.put("deviceId", device.getDeviceId());
                alert.put("deviceName", device.getDeviceName());
                alert.put("type", "HIGH_MEMORY");
                alert.put("severity", "WARNING");
                alert.put("message", "Memory usage is " + device.getMemoryUsage() + "%");
                alerts.add(alert);
            }
            
            // Offline alerts
            if (!device.getIsOnline()) {
                Map<String, Object> alert = new HashMap<>();
                alert.put("deviceId", device.getDeviceId());
                alert.put("deviceName", device.getDeviceName());
                alert.put("type", "DEVICE_OFFLINE");
                alert.put("severity", "WARNING");
                alert.put("message", "Device is offline");
                alerts.add(alert);
            }
        }
        
        return alerts;
    }
    
    private List<Map<String, Object>> getRecentActivity(List<Device> devices) {
        return devices.stream()
            .filter(d -> d.getLastLocationUpdate() != null)
            .sorted((d1, d2) -> d2.getLastLocationUpdate().compareTo(d1.getLastLocationUpdate()))
            .limit(10)
            .map(device -> {
                Map<String, Object> activity = new HashMap<>();
                activity.put("deviceId", device.getDeviceId());
                activity.put("deviceName", device.getDeviceName());
                activity.put("lastUpdate", device.getLastLocationUpdate());
                activity.put("status", device.getIsOnline() ? "Online" : "Offline");
                activity.put("location", device.getAddress());
                return activity;
            })
            .collect(Collectors.toList());
    }
    
    private Map<String, Object> analyzeUptime(List<Device> devices) {
        Map<String, Object> uptime = new HashMap<>();
        
        long onlineDevices = devices.stream().filter(Device::getIsOnline).count();
        long totalDevices = devices.size();
        
        double uptimePercentage = totalDevices > 0 ? (onlineDevices * 100.0) / totalDevices : 0;
        uptime.put("uptimePercentage", Math.round(uptimePercentage * 100.0) / 100.0);
        uptime.put("onlineCount", onlineDevices);
        uptime.put("totalCount", totalDevices);
        
        // Calculate reliability score
        String reliability;
        if (uptimePercentage >= 95) {
            reliability = "EXCELLENT";
        } else if (uptimePercentage >= 85) {
            reliability = "GOOD";
        } else if (uptimePercentage >= 70) {
            reliability = "FAIR";
        } else {
            reliability = "POOR";
        }
        uptime.put("reliability", reliability);
        
        return uptime;
    }
    
    /**
     * Get real-time device statistics for live dashboard
     */
    public Map<String, Object> getRealTimeStats() {
        List<Device> devices = deviceRepository.findAll();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("timestamp", System.currentTimeMillis());
        stats.put("totalDevices", devices.size());
        stats.put("onlineDevices", devices.stream().filter(Device::getIsOnline).count());
        stats.put("alertCount", generatePerformanceAlerts(devices).size());
        stats.put("averageBattery", devices.stream()
            .filter(d -> d.getBatteryLevel() != null)
            .mapToInt(Device::getBatteryLevel)
            .average()
            .orElse(0));
        
        return stats;
    }
    
    /**
     * Generate comprehensive enterprise report
     */
    public Map<String, Object> generateEnterpriseReport() {
        Map<String, Object> report = new HashMap<>();
        
        report.put("generatedAt", LocalDateTime.now());
        report.put("reportType", "Enterprise Device Analytics");
        report.put("version", "2.0-Enterprise");
        
        // Include all analytics
        report.put("dashboard", getEnterpriseDashboard());
        report.put("realTimeStats", getRealTimeStats());
        
        // Add summary
        Map<String, Object> summary = new HashMap<>();
        Map<String, Object> dashboard = getEnterpriseDashboard();
        summary.put("totalDevicesTracked", dashboard.get("totalDevices"));
        summary.put("systemHealth", calculateSystemHealth(dashboard));
        summary.put("securityStatus", dashboard.get("securityThreats"));
        
        report.put("executiveSummary", summary);
        
        return report;
    }
    
    private String calculateSystemHealth(Map<String, Object> dashboard) {
        Integer totalDevices = (Integer) dashboard.get("totalDevices");
        Integer onlineDevices = (Integer) dashboard.get("onlineDevices");
        Integer stolenDevices = (Integer) dashboard.get("stolenDevices");
        
        if (totalDevices == 0) return "NO_DATA";
        
        double onlinePercentage = (onlineDevices * 100.0) / totalDevices;
        boolean hasThreats = stolenDevices > 0;
        
        if (hasThreats) return "CRITICAL";
        if (onlinePercentage >= 95) return "EXCELLENT";
        if (onlinePercentage >= 85) return "GOOD";
        if (onlinePercentage >= 70) return "FAIR";
        return "POOR";
    }
}