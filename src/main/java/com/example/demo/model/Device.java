package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "laptops")
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "device_id", unique = true, nullable = false)
    private String deviceId;
    
    @Column(name = "device_name", nullable = false)
    private String deviceName;
    
    private String manufacturer;
    private String model;
    
    @Column(name = "serial_number")
    private String serialNumber;
    
    @Column(name = "os_name")
    private String osName;
    
    @Column(name = "os_version")
    private String osVersion;
    
    // Location tracking
    private Double latitude;
    private Double longitude;
    private Double altitude;
    
    @Column(name = "location_accuracy")
    private Double locationAccuracy;
    
    private String address;
    
    // Device status
    @Column(name = "is_online")
    private Boolean isOnline = false;
    
    @Column(name = "last_seen")
    private LocalDateTime lastSeen;
    
    @Column(name = "battery_level")
    private Integer batteryLevel;
    
    @Column(name = "is_charging")
    private Boolean isCharging = false;
    
    // System information
    @Column(name = "cpu_usage")
    private Double cpuUsage;
    
    @Column(name = "memory_total")
    private Long memoryTotal;
    
    @Column(name = "memory_used")
    private Long memoryUsed;
    
    @Column(name = "disk_total")
    private Long diskTotal;
    
    @Column(name = "disk_used")
    private Long diskUsed;
    
    // Network information
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "wifi_ssid")
    private String wifiSsid;
    
    @Column(name = "wifi_signal_strength")
    private Integer wifiSignalStrength;
    
    // Security features
    @Column(name = "is_locked")
    private Boolean isLocked = false;
    
    @Column(name = "theft_detected")
    private Boolean theftDetected = false;

    @Column(name = "is_stolen")
    private Boolean isStolen = false;

    @Column(name = "last_action")
    private String lastAction;

    @Column(name = "last_action_time")
    private LocalDateTime lastActionTime;

    @Column(name = "device_type")
    private String deviceType; // LAPTOP, DESKTOP, PHONE, TABLET

    @Column(name = "network_name")
    private String networkName;

    @Column(name = "public_ip")
    private String publicIp;

    @Column(name = "disk_usage")
    private Integer diskUsage;

    @Column(name = "memory_usage")
    private Integer memoryUsage;

    @Column(name = "uptime_hours")
    private Long uptimeHours;

    @Column(name = "agent_version")
    private String agentVersion;

    // Getters and setters
    public Boolean getIsLocked() { return isLocked; }
    public void setIsLocked(Boolean isLocked) { this.isLocked = isLocked; }

    public Boolean getIsStolen() { return isStolen; }
    public void setIsStolen(Boolean isStolen) { this.isStolen = isStolen; }

    public String getLastAction() { return lastAction; }
    public void setLastAction(String lastAction) { this.lastAction = lastAction; }

    public LocalDateTime getLastActionTime() { return lastActionTime; }
    public void setLastActionTime(LocalDateTime lastActionTime) { this.lastActionTime = lastActionTime; }

    public String getDeviceType() { return deviceType; }
    public void setDeviceType(String deviceType) { this.deviceType = deviceType; }

    public String getNetworkName() { return networkName; }
    public void setNetworkName(String networkName) { this.networkName = networkName; }

    public String getPublicIp() { return publicIp; }
    public void setPublicIp(String publicIp) { this.publicIp = publicIp; }



    public Long getUptimeHours() { return uptimeHours; }
    public void setUptimeHours(Long uptimeHours) { this.uptimeHours = uptimeHours; }

    public String getAgentVersion() { return agentVersion; }
    public void setAgentVersion(String agentVersion) { this.agentVersion = agentVersion; }

    @Column(name = "is_wiped")
    private Boolean isWiped = false;
    
    // Timestamps
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "operating_system")
    private String operatingSystem;
    
    @Column(name = "last_command_sent")
    private LocalDateTime lastCommandSent;
    
    @Column(name = "accuracy")
    private Double accuracy;
    
    // Constructors
    public Device() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isOnline = false;
        this.theftDetected = false;
        this.isLocked = false;
        this.isCharging = false;
        this.isWiped = false;
    }
    
    public Device(String deviceId, User user, String deviceName) {
        this();
        this.deviceId = deviceId;
        this.user = user;
        this.deviceName = deviceName;
    }
    
    // Update timestamp when modified
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    
    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }
    
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    
    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
    
    public String getOsName() { return osName; }
    public void setOsName(String osName) { this.osName = osName; }
    
    public String getOsVersion() { return osVersion; }
    public void setOsVersion(String osVersion) { this.osVersion = osVersion; }
    
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    
    public Double getAltitude() { return altitude; }
    public void setAltitude(Double altitude) { this.altitude = altitude; }
    
    public Double getLocationAccuracy() { return locationAccuracy; }
    public void setLocationAccuracy(Double locationAccuracy) { this.locationAccuracy = locationAccuracy; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public Boolean getIsOnline() { return isOnline; }
    public void setIsOnline(Boolean isOnline) { this.isOnline = isOnline; }
    
    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }
    
    public Integer getBatteryLevel() { return batteryLevel; }
    public void setBatteryLevel(Integer batteryLevel) { this.batteryLevel = batteryLevel; }
    
    public Boolean getIsCharging() { return isCharging; }
    public void setIsCharging(Boolean isCharging) { this.isCharging = isCharging; }
    
    public Double getCpuUsage() { return cpuUsage; }
    public void setCpuUsage(Double cpuUsage) { this.cpuUsage = cpuUsage; }
    
    public Long getMemoryTotal() { return memoryTotal; }
    public void setMemoryTotal(Long memoryTotal) { this.memoryTotal = memoryTotal; }
    
    public Long getMemoryUsed() { return memoryUsed; }
    public void setMemoryUsed(Long memoryUsed) { this.memoryUsed = memoryUsed; }
    
    public Long getDiskTotal() { return diskTotal; }
    public void setDiskTotal(Long diskTotal) { this.diskTotal = diskTotal; }
    
    public Long getDiskUsed() { return diskUsed; }
    public void setDiskUsed(Long diskUsed) { this.diskUsed = diskUsed; }
    
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    
    public String getWifiSsid() { return wifiSsid; }
    public void setWifiSsid(String wifiSsid) { this.wifiSsid = wifiSsid; }
    
    public Integer getWifiSignalStrength() { return wifiSignalStrength; }
    public void setWifiSignalStrength(Integer wifiSignalStrength) { this.wifiSignalStrength = wifiSignalStrength; }
    
    public Boolean getTheftDetected() { return theftDetected; }
    public void setTheftDetected(Boolean theftDetected) { this.theftDetected = theftDetected; }

    public Boolean getIsWiped() { return isWiped; }
    public void setIsWiped(Boolean isWiped) { this.isWiped = isWiped; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Convenience methods
    public String getOwnerEmail() {
        return user != null ? user.getEmail() : null;
    }
    
    public String getOperatingSystem() { 
        return operatingSystem != null ? operatingSystem : (osName + (osVersion != null ? " " + osVersion : ""));
    }
    
    public void setOperatingSystem(String operatingSystem) { 
        this.operatingSystem = operatingSystem; 
    }
    
    // Memory and disk usage as percentage
    public Double getMemoryUsage() {
        if (memoryTotal != null && memoryUsed != null && memoryTotal > 0) {
            return (double) ((memoryUsed * 100) / memoryTotal);
        }
        return null;
    }
    
    public void setMemoryUsage(Double memoryUsage) {
        // This is a calculated field, but we can store the raw percentage if needed
        if (memoryUsage != null && memoryTotal != null) {
            this.memoryUsed = (long) ((memoryUsage * memoryTotal) / 100);
        }
    }
    
    public Double getDiskUsage() {
        if (diskTotal != null && diskUsed != null && diskTotal > 0) {
            return (double) ((diskUsed * 100) / diskTotal);
        }
        return null;
    }
    
    public void setDiskUsage(Double diskUsage) {
        // This is a calculated field, but we can store the raw percentage if needed
        if (diskUsage != null && diskTotal != null) {
            this.diskUsed = (long) ((diskUsage * diskTotal) / 100);
        }
    }
    

    

    
    public LocalDateTime getLastLocationUpdate() {
        return lastSeen;
    }
    
    public void setLastLocationUpdate(LocalDateTime lastLocationUpdate) {
        this.lastSeen = lastLocationUpdate;
    }
    
    public LocalDateTime getLastUpdated() {
        return updatedAt;
    }
    
    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.updatedAt = lastUpdated;
    }
    
    /**
     * Get user email for this device
     */
    public String getUserEmail() {
        return user != null ? user.getEmail() : "demo@lapso.in";
    }
    
    /**
     * Get device name
     */
    public String getName() {
        return deviceName != null ? deviceName : "Unknown Device";
    }
    
    /**
     * Last command sent timestamp
     */
    public LocalDateTime getLastCommandSent() { return lastCommandSent; }
    public void setLastCommandSent(LocalDateTime lastCommandSent) { this.lastCommandSent = lastCommandSent; }
    
    /**
     * Location accuracy
     */
    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }
}