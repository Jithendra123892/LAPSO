/**
 * LaptopTracker Pro - Client Script v1.0.0
 * Build timestamp: 2024-01-01T00:00:00Z
 * Cache buster: v1.0.0
 *
 * Automatically detects and reports laptop information to the tracking server
 *
 * Usage: Include this script in any webpage and call LaptopTracker.initialize()
 */

class LaptopTracker {
    constructor() {
        this.serverUrl = window.location.origin;
        this.deviceId = this.generateDeviceId();
        this.ownerEmail = null;
        this.updateInterval = 30000; // 30 seconds
        this.intervalId = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the laptop tracker
     * @param {string} email - User's email address
     */
    async initialize(email) {
        if (!email) {
            console.error('LaptopTracker: Email is required for initialization');
            return false;
        }

        this.ownerEmail = email;
        console.log('🚀 LaptopTracker Pro initializing for:', email);

        try {
            // Get device information and location
            const deviceInfo = await this.getDeviceInfo();
            const location = await this.getCurrentLocation();

            // Register device with server
            const registrationData = {
                ownerEmail: this.ownerEmail,
                deviceId: this.deviceId,
                deviceName: deviceInfo.deviceName,
                manufacturer: deviceInfo.manufacturer,
                model: deviceInfo.model,
                operatingSystem: deviceInfo.operatingSystem,
                currentUser: deviceInfo.currentUser,
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address,
                batteryLevel: deviceInfo.batteryLevel,
                isCharging: deviceInfo.isCharging,
                cpuUsage: deviceInfo.cpuUsage,
                memoryUsage: deviceInfo.memoryUsage,
                wifiSsid: deviceInfo.wifiSsid
            };

            const response = await this.registerDevice(registrationData);
            
            if (response.success) {
                console.log('✅ Device registered successfully:', response.message);
                this.isInitialized = true;
                this.startPeriodicUpdates();
            } else {
                console.error('❌ Device registration failed:', response.message);
                return false;
            }
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            return false;
        }
    }

    /**
     * Generate unique device ID based on browser and system info
     */
    generateDeviceId() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL(),
            navigator.hardwareConcurrency || 'unknown',
            navigator.deviceMemory || 'unknown'
        ].join('|');

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return 'device_' + Math.abs(hash).toString(16) + '_' + Date.now().toString(36);
    }

    /**
     * Get comprehensive device information
     */
    async getDeviceInfo() {
        const deviceInfo = {
            deviceName: this.getDeviceName(),
            manufacturer: this.getManufacturer(),
            model: this.getModel(),
            operatingSystem: this.getOperatingSystem(),
            currentUser: await this.getCurrentUser(),
            batteryLevel: await this.getBatteryLevel(),
            isCharging: await this.getChargingStatus(),
            cpuUsage: this.getCpuUsage(),
            memoryUsage: this.getMemoryUsage(),
            wifiSsid: await this.getWifiSsid()
        };

        return deviceInfo;
    }

    getDeviceName() {
        // Try to get hostname from various sources
        if (window.location.hostname && window.location.hostname !== 'localhost') {
            return window.location.hostname;
        }
        
        const ua = navigator.userAgent;
        if (ua.includes('Windows')) return 'Windows PC';
        if (ua.includes('Mac')) return 'Mac';
        if (ua.includes('Linux')) return 'Linux PC';
        if (ua.includes('Android')) return 'Android Device';
        if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Device';
        
        return 'Unknown Device';
    }

    getManufacturer() {
        const ua = navigator.userAgent;
        if (ua.includes('Windows')) return 'Microsoft';
        if (ua.includes('Mac')) return 'Apple';
        if (ua.includes('Ubuntu')) return 'Canonical';
        if (ua.includes('Android')) {
            if (ua.includes('Samsung')) return 'Samsung';
            if (ua.includes('Huawei')) return 'Huawei';
            if (ua.includes('Xiaomi')) return 'Xiaomi';
            return 'Google';
        }
        return 'Unknown';
    }

    getModel() {
        const ua = navigator.userAgent;
        // Extract model information from user agent if possible
        const modelMatch = ua.match(/\(([^)]+)\)/);
        return modelMatch ? modelMatch[1].split(';')[0].trim() : 'Unknown Model';
    }

    getOperatingSystem() {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        
        if (ua.includes('Windows NT 10.0')) return 'Windows 10/11';
        if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
        if (ua.includes('Windows NT 6.2')) return 'Windows 8';
        if (ua.includes('Windows NT 6.1')) return 'Windows 7';
        if (ua.includes('Windows')) return 'Windows';
        
        if (platform.includes('Mac') || ua.includes('Mac OS X')) {
            const macMatch = ua.match(/Mac OS X ([0-9_]+)/);
            return macMatch ? `macOS ${macMatch[1].replace(/_/g, '.')}` : 'macOS';
        }
        
        if (ua.includes('Ubuntu')) return 'Ubuntu Linux';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iPhone OS')) return 'iOS';
        
        return 'Unknown OS';
    }

    async getCurrentUser() {
        // In a browser environment, we can't get the actual system username
        // Return browser/session info instead
        return navigator.userAgent.split(' ')[0] || 'Web User';
    }

    async getBatteryLevel() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                return Math.round(battery.level * 100);
            } catch (error) {
                console.warn('Battery API not available:', error);
            }
        }
        return null;
    }

    async getChargingStatus() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                return battery.charging;
            } catch (error) {
                console.warn('Battery API not available:', error);
            }
        }
        return null;
    }

    getCpuUsage() {
        // Estimate CPU usage based on available metrics
        if ('hardwareConcurrency' in navigator) {
            // Simple estimation - can't get actual CPU usage from browser
            return Math.floor(Math.random() * 30) + 10; // 10-40% simulated
        }
        return null;
    }

    getMemoryUsage() {
        if ('deviceMemory' in navigator) {
            const totalMemory = navigator.deviceMemory * 1024; // GB to MB
            const usedMemory = performance.memory ? 
                performance.memory.usedJSHeapSize / (1024 * 1024) : 
                totalMemory * 0.6; // Estimate 60% usage
            return Math.round((usedMemory / totalMemory) * 100);
        }
        return null;
    }

    async getWifiSsid() {
        // Browser security prevents direct WiFi SSID access
        // Return connection type instead
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return `${connection.effectiveType || 'unknown'} (${connection.type || 'unknown'})`;
        }
        return 'Web Connection';
    }

    /**
     * Get current location using Geolocation API
     */
    async getCurrentLocation() {
        return new Promise((resolve) => {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        const address = await this.reverseGeocode(latitude, longitude);
                        resolve({ latitude, longitude, address });
                    },
                    (error) => {
                        console.warn('Geolocation error:', error);
                        resolve({ latitude: null, longitude: null, address: 'Location not available' });
                    },
                    { timeout: 10000, enableHighAccuracy: true }
                );
            } else {
                resolve({ latitude: null, longitude: null, address: 'Geolocation not supported' });
            }
        });
    }

    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(lat, lng) {
        try {
            // Using a simple reverse geocoding service
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            const data = await response.json();
            return data.displayName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    }

    /**
     * Register device with the server
     */
    async registerDevice(deviceData) {
        try {
            const response = await fetch(`${this.serverUrl}/api/device/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(deviceData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Device registration failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Update device status
     */
    async updateDevice() {
        if (!this.isInitialized) return;

        try {
            const deviceInfo = await this.getDeviceInfo();
            const location = await this.getCurrentLocation();

            const updateData = {
                deviceId: this.deviceId,
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address,
                batteryLevel: deviceInfo.batteryLevel,
                isCharging: deviceInfo.isCharging,
                cpuUsage: deviceInfo.cpuUsage,
                memoryUsage: deviceInfo.memoryUsage,
                wifiSsid: deviceInfo.wifiSsid
            };

            const response = await fetch(`${this.serverUrl}/api/device/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('📡 Device updated:', result.message);
            } else {
                console.warn('Device update failed:', response.statusText);
            }
        } catch (error) {
            console.error('Device update error:', error);
        }
    }

    /**
     * Start periodic updates
     */
    startPeriodicUpdates() {
        this.stopPeriodicUpdates(); // Clear any existing interval
        
        this.intervalId = setInterval(() => {
            this.updateDevice();
        }, this.updateInterval);

        console.log(`📡 Started periodic updates every ${this.updateInterval / 1000} seconds`);
    }

    /**
     * Stop periodic updates
     */
    stopPeriodicUpdates() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('⏹️ Stopped periodic updates');
        }
    }

    /**
     * Get device ID
     */
    getDeviceId() {
        return this.deviceId;
    }

    /**
     * Check if tracker is initialized
     */
    isActive() {
        return this.isInitialized;
    }
}

// Global instance
window.LaptopTracker = new LaptopTracker();

// Auto-initialization has been removed to prevent automatic device registration.
// Device registration should be a user-initiated action.
/*
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    
    if (email) {
        window.LaptopTracker.initialize(email);
    }
});
*/

console.log('💻 LaptopTracker Pro client loaded successfully');