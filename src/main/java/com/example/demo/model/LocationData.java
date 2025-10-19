package com.example.demo.model;

import java.time.LocalDateTime;

public class LocationData {
    private String deviceId;
    private Double latitude;
    private Double longitude;
    private Double accuracy;
    private String source;
    private String address;
    private LocalDateTime timestamp;
    
    // Constructors
    public LocationData() {}
    
    public LocationData(String deviceId, Double latitude, Double longitude, Double accuracy, String source, String address, LocalDateTime timestamp) {
        this.deviceId = deviceId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.accuracy = accuracy;
        this.source = source;
        this.address = address;
        this.timestamp = timestamp;
    }
    
    // Builder pattern for easy construction
    public static LocationDataBuilder builder() {
        return new LocationDataBuilder();
    }
    
    public static class LocationDataBuilder {
        private String deviceId;
        private Double latitude;
        private Double longitude;
        private Double accuracy;
        private String source;
        private String address;
        private LocalDateTime timestamp;
        
        public LocationDataBuilder deviceId(String deviceId) {
            this.deviceId = deviceId;
            return this;
        }
        
        public LocationDataBuilder latitude(Double latitude) {
            this.latitude = latitude;
            return this;
        }
        
        public LocationDataBuilder longitude(Double longitude) {
            this.longitude = longitude;
            return this;
        }
        
        public LocationDataBuilder accuracy(Double accuracy) {
            this.accuracy = accuracy;
            return this;
        }
        
        public LocationDataBuilder source(String source) {
            this.source = source;
            return this;
        }
        
        public LocationDataBuilder address(String address) {
            this.address = address;
            return this;
        }
        
        public LocationDataBuilder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }
        
        public LocationData build() {
            return new LocationData(deviceId, latitude, longitude, accuracy, source, address, timestamp);
        }
    }
    
    // Getters and Setters
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    
    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }
    
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}