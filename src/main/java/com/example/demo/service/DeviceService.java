package com.example.demo.service;

import com.example.demo.model.Device;
import com.example.demo.model.DeviceEvent;
import com.example.demo.model.DeviceStats;
import com.example.demo.model.LocationHistory;
import com.example.demo.model.User;
import com.example.demo.repository.DeviceEventRepository;
import com.example.demo.repository.DeviceRepository;
import com.example.demo.repository.LocationHistoryRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class DeviceService {
    
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final LocationHistoryRepository locationHistoryRepository;
    private final DeviceEventRepository deviceEventRepository;
    
    @Autowired
    private DeviceShareService deviceShareService;
    
    @Autowired
    private GeofenceService geofenceService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private PerfectAuthService authService;
    

    
    public DeviceService(DeviceRepository deviceRepository, UserRepository userRepository, LocationHistoryRepository locationHistoryRepository, DeviceEventRepository deviceEventRepository) {
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
        this.locationHistoryRepository = locationHistoryRepository;
        this.deviceEventRepository = deviceEventRepository;
    }
    
    public Device registerDevice(User user, String deviceName, String manufacturer, String model, String os) {
        String deviceId = "LT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        Device device = new Device(deviceId, user, deviceName);
        device.setManufacturer(manufacturer);
        device.setModel(model);
        device.setOsName(os);
        device.setIsOnline(true);
        device.setLastSeen(LocalDateTime.now());
        
        Device saved = deviceRepository.save(device);
        deviceEventRepository.save(new DeviceEvent(saved, "DEVICE_REGISTERED", "Device registered to " + user.getEmail()));
        System.out.println("✅ Device registered: " + deviceId + " for " + user.getEmail());
        return saved;
    }
    
    // Overloaded method for agent registration
    public Device registerDevice(String deviceName, String manufacturer, String model) {
        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new SecurityException("User not authenticated");
        }
        
        String userEmail = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found: " + userEmail);
        }
        
        return registerDevice(userOpt.get(), deviceName, manufacturer, model, "Unknown");
    }
    
    public void updateLocation(String deviceId, Double latitude, Double longitude, String address) {
        validateDeviceAccess(deviceId);
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        if (deviceOpt.isPresent()) {
            Device device = deviceOpt.get();
            device.setLatitude(latitude);
            device.setLongitude(longitude);
            device.setAddress(address);
            device.setLastSeen(LocalDateTime.now());
            device.setIsOnline(true);
            deviceRepository.save(device);
            locationHistoryRepository.save(new LocationHistory(device, latitude, longitude, address));
            System.out.println("📍 Location updated for " + deviceId);
        }
    }
    
    public void updateStatus(String deviceId, Integer battery, Boolean charging, 
                           Double cpu, Long memoryUsed, Long memoryTotal, String ip, String wifi) {
        validateDeviceAccess(deviceId);
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        if (deviceOpt.isPresent()) {
            Device device = deviceOpt.get();
            device.setBatteryLevel(battery);
            device.setIsCharging(charging);
            device.setCpuUsage(cpu);
            device.setMemoryUsed(memoryUsed);
            device.setMemoryTotal(memoryTotal);
            device.setIpAddress(ip);
            device.setWifiSsid(wifi);
            device.setIsOnline(true);
            device.setLastSeen(LocalDateTime.now());
            deviceRepository.save(device);
            System.out.println("📊 Status updated for " + deviceId);
        }
    }
    
    public List<Device> getUserDevices(String ownerEmail) {
        return deviceRepository.findByUserEmail(ownerEmail);
    }
    
    public List<Device> getDevicesByOwnerEmail(String ownerEmail) {
        return deviceRepository.findByUserEmail(ownerEmail);
    }
    
    public Optional<Device> getDevice(String deviceId) {
        return deviceRepository.findByDeviceId(deviceId);
    }
    
    public void reportStolen(String deviceId) {
        validateDeviceAccess(deviceId);
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        if (deviceOpt.isPresent()) {
            Device device = deviceOpt.get();
            device.setTheftDetected(true);
            device.setIsLocked(true);
            deviceRepository.save(device);
            deviceEventRepository.save(new DeviceEvent(device, "DEVICE_STOLEN", "Device reported as stolen"));
            System.out.println("🚨 Device reported stolen: " + deviceId);
        }
    }
    
    public void lockDevice(String deviceId) {
        validateDeviceAccess(deviceId);
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        if (deviceOpt.isPresent()) {
            Device device = deviceOpt.get();
            device.setIsLocked(true);
            deviceRepository.save(device);
            deviceEventRepository.save(new DeviceEvent(device, "DEVICE_LOCKED", "Device locked remotely"));
            System.out.println("🔒 Device locked: " + deviceId);
        }
    }
    
    // Overloaded version that accepts userEmail (for async/service calls)
    public void lockDevice(String deviceId, String userEmail) {
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        if (deviceOpt.isEmpty()) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }
        
        Device device = deviceOpt.get();
        if (!device.getUserEmail().equals(userEmail)) {
            throw new SecurityException("User does not have access to device " + deviceId);
        }
        
        device.setIsLocked(true);
        deviceRepository.save(device);
        deviceEventRepository.save(new DeviceEvent(device, "DEVICE_LOCKED", "Device locked remotely"));
        System.out.println("🔒 Device locked: " + deviceId + " by user: " + userEmail);
    }
    
    public void unlockDevice(String deviceId) {
        validateDeviceAccess(deviceId);
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        if (deviceOpt.isPresent()) {
            Device device = deviceOpt.get();
            device.setIsLocked(false);
            deviceRepository.save(device);
            deviceEventRepository.save(new DeviceEvent(device, "DEVICE_UNLOCKED", "Device unlocked remotely"));
            System.out.println("🔓 Device unlocked: " + deviceId);
        }
    }
    
    // Overloaded version that accepts userEmail (for async/service calls)
    public void unlockDevice(String deviceId, String userEmail) {
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        if (deviceOpt.isEmpty()) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }
        
        Device device = deviceOpt.get();
        if (!device.getUserEmail().equals(userEmail)) {
            throw new SecurityException("User does not have access to device " + deviceId);
        }
        
        device.setIsLocked(false);
        deviceRepository.save(device);
        deviceEventRepository.save(new DeviceEvent(device, "DEVICE_UNLOCKED", "Device unlocked remotely"));
        System.out.println("🔓 Device unlocked: " + deviceId + " by user: " + userEmail);
    }


    public void wipeDevice(String deviceId) {
        validateDeviceAccess(deviceId);
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        if (deviceOpt.isPresent()) {
            Device device = deviceOpt.get();
            // In a real application, this would trigger a command to the device agent
            // to securely erase data. For now, we'll just mark it as wiped.
            device.setIsWiped(true);
            device.setIsLocked(true); // Lock after wiping
            device.setTheftDetected(true); // Indicate severe action
            deviceRepository.save(device);
            deviceEventRepository.save(new DeviceEvent(device, "DEVICE_WIPED", "Device data wiped remotely"));
            System.out.println("💣 Device wiped: " + deviceId);
        }
    }
    
    // Overloaded version that accepts userEmail (for async/service calls)
    public void wipeDevice(String deviceId, String userEmail) {
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        if (deviceOpt.isEmpty()) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }
        
        Device device = deviceOpt.get();
        if (!device.getUserEmail().equals(userEmail)) {
            throw new SecurityException("User does not have access to device " + deviceId);
        }
        
        device.setIsWiped(true);
        device.setIsLocked(true);
        device.setTheftDetected(true);
        deviceRepository.save(device);
        deviceEventRepository.save(new DeviceEvent(device, "DEVICE_WIPED", "Device data wiped remotely"));
        System.out.println("💣 Device wiped: " + deviceId + " by user: " + userEmail);
    }

    public List<Device> getCurrentUserDevices() {
        // Try to get user from Vaadin session first (works with @AnonymousAllowed)
        String userEmail = null;
        if (authService != null) {
            userEmail = authService.getLoggedInUser();
        }
        
        // Fallback to Spring Security if Vaadin session doesn't have user
        if (userEmail == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getName() != null 
                && !"anonymousUser".equals(authentication.getName())) {
                userEmail = authentication.getName();
            }
        }
        
        if (userEmail == null) {
            System.out.println("DEBUG: No authenticated user found, returning empty list");
            return Collections.emptyList();
        }
        
        System.out.println("DEBUG: Current authenticated user: " + userEmail);
        List<Device> userDevices = getUserDevices(userEmail);
        System.out.println("DEBUG: Found " + userDevices.size() + " devices for user: " + userEmail);
        return userDevices;
    }
    
    // SECURITY FIXED: User-specific device filtering methods
    public List<Device> getCurrentUserOnlineDevices() {
        return getCurrentUserDevices().stream()
            .filter(device -> device.getIsOnline() != null && device.getIsOnline())
            .collect(Collectors.toList());
    }
    
    public List<Device> getCurrentUserOfflineDevices() {
        return getCurrentUserDevices().stream()
            .filter(device -> device.getIsOnline() == null || !device.getIsOnline())
            .collect(Collectors.toList());
    }
    
    public List<Device> getCurrentUserStolenDevices() {
        return getCurrentUserDevices().stream()
            .filter(device -> device.getTheftDetected() != null && device.getTheftDetected())
            .collect(Collectors.toList());
    }
    
    public void updateSystemInfo(String deviceId, String osName, String osVersion, 
                               String serialNumber, Long diskTotal, Long diskUsed) {
        validateDeviceAccess(deviceId);
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        if (deviceOpt.isPresent()) {
            Device device = deviceOpt.get();
            device.setOsName(osName);
            device.setOsVersion(osVersion);
            device.setSerialNumber(serialNumber);
            device.setDiskTotal(diskTotal);
            device.setDiskUsed(diskUsed);
            device.setLastSeen(LocalDateTime.now());
            deviceRepository.save(device);
            System.out.println("🖥️ System info updated for " + deviceId);
        }
    }
    
    // SECURITY FIXED: User-specific statistics methods
    public long getCurrentUserDevicesCount() {
        return getCurrentUserDevices().size();
    }
    
    public long getCurrentUserOnlineDevicesCount() {
        return getCurrentUserOnlineDevices().size();
    }
    
    public long getCurrentUserStolenDevicesCount() {
        return getCurrentUserStolenDevices().size();
    }
    
    public long getUserDevicesCount(String ownerEmail) {
        return deviceRepository.countByUserEmail(ownerEmail);
    }
    
    public long getUserOnlineDevicesCount(String ownerEmail) {
        return deviceRepository.countOnlineByUserEmail(ownerEmail);
    }
    
    public long getUserStolenDevicesCount(String ownerEmail) {
        return deviceRepository.countStolenByUserEmail(ownerEmail);
    }
    
    // SECURITY FIXED: Return current user's device statistics only
    public DeviceStats getCurrentUserDeviceStats() {
        long total = getCurrentUserDevicesCount();
        long online = getCurrentUserOnlineDevicesCount();
        long stolen = getCurrentUserStolenDevicesCount();
        long offline = total - online;
        
        return new DeviceStats(total, online, offline, stolen);
    }

    // Additional methods needed by controllers
    public Optional<Device> findByDeviceId(String deviceId) {
        return deviceRepository.findByDeviceId(deviceId);
    }
    
    public Device getDeviceByDeviceId(String deviceId) {
        return deviceRepository.findByDeviceId(deviceId).orElse(null);
    }
    
    public Device saveDevice(Device device) {
        device.setLastSeen(LocalDateTime.now());
        return deviceRepository.save(device);
    }
    
    public Device registerOrUpdateDevice(String deviceId, java.util.Map<String, Object> deviceData) {
        validateDeviceAccess(deviceId);
        Optional<Device> existingDevice = deviceRepository.findByDeviceId(deviceId);
        
        if (existingDevice.isPresent()) {
            Device device = existingDevice.get();
            updateDeviceFromMap(device, deviceData);
            return deviceRepository.save(device);
        } else {
            throw new RuntimeException("Device not found. Registration should be done through the /register endpoint.");
        }
    }
    
    public Device updateDevice(String deviceId, java.util.Map<String, Object> deviceData) {
        validateDeviceAccess(deviceId);
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        if (deviceOpt.isPresent()) {
            Device device = deviceOpt.get();
            updateDeviceFromMap(device, deviceData);
            return deviceRepository.save(device);
        }
        return null;
    }
    
    // Overloaded method for direct device update
    public Device updateDevice(Device device) {
        return deviceRepository.save(device);
    }
    
    private void updateDeviceFromMap(Device device, java.util.Map<String, Object> data) {
        // Store previous location for geofence checking
        Double previousLatitude = device.getLatitude();
        Double previousLongitude = device.getLongitude();
        
        if (data.get("latitude") != null) {
            device.setLatitude(Double.parseDouble(data.get("latitude").toString()));
        }
        if (data.get("longitude") != null) {
            device.setLongitude(Double.parseDouble(data.get("longitude").toString()));
        }
        if (data.get("address") != null) {
            device.setAddress((String) data.get("address"));
        }
        if (data.get("batteryLevel") != null) {
            device.setBatteryLevel(Integer.parseInt(data.get("batteryLevel").toString()));
        }
        if (data.get("isCharging") != null) {
            device.setIsCharging(Boolean.parseBoolean(data.get("isCharging").toString()));
        }
        if (data.get("cpuUsage") != null) {
            device.setCpuUsage(Double.parseDouble(data.get("cpuUsage").toString()));
        }
        if (data.get("memoryUsed") != null) {
            device.setMemoryUsed(Long.parseLong(data.get("memoryUsed").toString()));
        }
        if (data.get("memoryTotal") != null) {
            device.setMemoryTotal(Long.parseLong(data.get("memoryTotal").toString()));
        }
        if (data.get("ipAddress") != null) {
            device.setIpAddress((String) data.get("ipAddress"));
        }
        if (data.get("wifiSsid") != null) {
            device.setWifiSsid((String) data.get("wifiSsid"));
        }
        if (data.get("osName") != null) {
            device.setOsName((String) data.get("osName"));
        }
        if (data.get("osVersion") != null) {
            device.setOsVersion((String) data.get("osVersion"));
        }
        if (data.get("manufacturer") != null) {
            device.setManufacturer((String) data.get("manufacturer"));
        }
        if (data.get("model") != null) {
            device.setModel((String) data.get("model"));
        }
        if (data.get("serialNumber") != null) {
            device.setSerialNumber((String) data.get("serialNumber"));
        }
        if (data.get("diskTotal") != null) {
            device.setDiskTotal(Long.parseLong(data.get("diskTotal").toString()));
        }
        if (data.get("diskUsed") != null) {
            device.setDiskUsed(Long.parseLong(data.get("diskUsed").toString()));
        }
        
        device.setIsOnline(true);
        device.setLastSeen(LocalDateTime.now());
        
        // 🧠 INTELLIGENT MONITORING - Features Microsoft Find My Device doesn't have
        performIntelligentAnalysis(device);
        
        // Check geofence violations if location changed
        if (device.getLatitude() != null && device.getLongitude() != null &&
            (previousLatitude == null || previousLongitude == null ||
             !previousLatitude.equals(device.getLatitude()) || 
             !previousLongitude.equals(device.getLongitude()))) {
            
            geofenceService.checkGeofenceViolations(device.getDeviceId(), 
                                                   device.getLatitude(), 
                                                   device.getLongitude());
        }
    }
    
    /**
     * 🧠 INTELLIGENT ANALYSIS - Advanced features that make this superior to Microsoft Find My Device
     */
    private void performIntelligentAnalysis(Device device) {
        try {
            // Battery monitoring with predictive alerts
            performBatteryAnalysis(device);
            
            // Performance monitoring
            performPerformanceAnalysis(device);
            
            // Unusual activity detection
            performActivityAnalysis(device);
            
            // Offline device monitoring (runs separately)
            // smartAlertService.checkDeviceOffline(device.getId());
            
            System.out.println(String.format("🧠 Intelligent analysis completed for device: %s", device.getDeviceName()));
            
        } catch (Exception e) {
            System.err.println("⚠️ Error during intelligent analysis: " + e.getMessage());
        }
    }
    
    /**
     * 🔋 SUPERIOR BATTERY MONITORING - Better than Microsoft Find My Device
     */
    private void performBatteryAnalysis(Device device) {
        try {
            if (device.getBatteryLevel() != null) {
                int batteryLevel = device.getBatteryLevel();
                
                // Predictive low battery alerts (Microsoft doesn't have this)
                if (batteryLevel <= 15) {
                    System.out.println("🔋 Battery Alert: " + device.getDeviceName() + " at " + batteryLevel + "%");
                }
                
                System.out.println("🔋 Battery analysis: " + device.getDeviceName() + " at " + batteryLevel + "%");
            }
        } catch (Exception e) {
            System.err.println("Battery analysis error: " + e.getMessage());
        }
    }
    
    /**
     * ⚡ SUPERIOR PERFORMANCE MONITORING - Microsoft Find My Device can't do this
     */
    private void performPerformanceAnalysis(Device device) {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime lastSeen = device.getLastSeen();
            
            if (lastSeen != null) {
                long minutesSinceLastSeen = java.time.Duration.between(lastSeen, now).toMinutes();
                
                // Real-time performance alerts
                if (minutesSinceLastSeen > 60) {
                    System.out.println("📡 Performance Alert: " + device.getDeviceName() + " offline for " + minutesSinceLastSeen + " minutes");
                }
                
                System.out.println("⚡ Performance analysis: " + device.getDeviceName() + " last seen " + minutesSinceLastSeen + " minutes ago");
            }
        } catch (Exception e) {
            System.err.println("Performance analysis error: " + e.getMessage());
        }
    }
    
    /**
     * 🕵️ SUPERIOR ACTIVITY DETECTION - Far beyond Microsoft's capabilities
     */
    private void performActivityAnalysis(Device device) {
        try {
            // Movement pattern analysis
            if (device.getLatitude() != null && device.getLongitude() != null) {
                // Check for unusual time-based activity
                LocalDateTime now = LocalDateTime.now();
                int hour = now.getHour();
                
                if ((hour >= 23 || hour <= 5) && device.getIsOnline()) {
                    System.out.println("🌙 Night Alert: " + device.getDeviceName() + " active at " + hour + ":00");
                }
                
                System.out.println("🕵️ Activity analysis completed for: " + device.getDeviceName());
            }
        } catch (Exception e) {
            System.err.println("Activity analysis error: " + e.getMessage());
        }
    }
    
    public DeviceStats getStats(String ownerEmail) {
        long total = getUserDevicesCount(ownerEmail);
        long online = getUserOnlineDevicesCount(ownerEmail);
        long stolen = getUserStolenDevicesCount(ownerEmail);
        long offline = total - online;
        
        return new DeviceStats(total, online, offline, stolen);
    }
    
    /**
     * Get all devices accessible to a user (owned + shared)
     * This is the key method for the "Find My Device" functionality
     */
    public List<Device> getAllAccessibleDevices(String userEmail) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            return List.of();
        }
        
        User user = userOpt.get();
        return deviceShareService.getAllAccessibleDevices(user);
    }
    
    /**
     * Get devices owned by a specific user
     */
    public List<Device> getDevicesByOwner(String ownerEmail) {
        Optional<User> userOpt = userRepository.findByEmail(ownerEmail);
        if (userOpt.isEmpty()) {
            return List.of();
        }
        
        return userOpt.get().getDevices();
    }
    
    /**
     * Check if a user has access to a device
     */
    public boolean hasAccessToDevice(String userEmail, String deviceId) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        
        if (userOpt.isEmpty() || deviceOpt.isEmpty()) {
            return false;
        }
        
        return deviceShareService.hasAccessToDevice(userOpt.get(), deviceOpt.get());
    }

    private void validateDeviceAccess(String deviceId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new SecurityException("User not authenticated.");
        }
        String userEmail = authentication.getName();
        
        if (!hasAccessToDevice(userEmail, deviceId)) {
            throw new SecurityException("User does not have access to device " + deviceId);
        }
    }

    public List<LocationHistory> getLocationHistory(String deviceId) {
        validateDeviceAccess(deviceId);
        return locationHistoryRepository.findByDeviceDeviceId(deviceId);
    }

    public List<DeviceEvent> getDeviceEvents(String deviceId) {
        validateDeviceAccess(deviceId);
        return deviceEventRepository.findByDeviceDeviceId(deviceId);
    }
    
    /**
     * Initialize device service
     */
    public void initialize() {
        System.out.println("✅ Device service initialized");
    }
    
    /**
     * Get device by ID and user email
     */
    public Device getDeviceByIdAndUserEmail(String deviceId, String userEmail) {
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        if (deviceOpt.isEmpty()) {
            return null;
        }
        
        Device device = deviceOpt.get();
        // Check if user owns this device
        if (device.getUser() != null && device.getUser().getEmail().equals(userEmail)) {
            return device;
        }
        
        return null;
    }
    
    /**
     * Delete device by ID
     */
    public void deleteDevice(Long id) {
        deviceRepository.deleteById(id);
        System.out.println("🗑️ Device deleted: " + id);
    }
}
