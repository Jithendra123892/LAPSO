package com.example.demo.service;

public class DeviceStats {
    private long totalDevices;
    private long onlineDevices;
    private long offlineDevices;
    private long stolenDevices;
    
    public DeviceStats() {}
    
    public DeviceStats(long totalDevices, long onlineDevices, long offlineDevices, long stolenDevices) {
        this.totalDevices = totalDevices;
        this.onlineDevices = onlineDevices;
        this.offlineDevices = offlineDevices;
        this.stolenDevices = stolenDevices;
    }
    
    // Getters and Setters
    public long getTotalDevices() { return totalDevices; }
    public void setTotalDevices(long totalDevices) { this.totalDevices = totalDevices; }
    
    public long getOnlineDevices() { return onlineDevices; }
    public void setOnlineDevices(long onlineDevices) { this.onlineDevices = onlineDevices; }
    
    public long getOfflineDevices() { return offlineDevices; }
    public void setOfflineDevices(long offlineDevices) { this.offlineDevices = offlineDevices; }
    
    public long getStolenDevices() { return stolenDevices; }
    public void setStolenDevices(long stolenDevices) { this.stolenDevices = stolenDevices; }
}