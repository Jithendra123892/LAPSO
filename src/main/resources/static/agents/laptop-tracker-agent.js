#!/usr/bin/env node
/**
 * LaptopTracker Pro Enterprise Client Agent
 * Superior to Microsoft Find My Device
 * Auto-installs and tracks everything in real-time
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');

class LaptopTrackerAgent {
    constructor() {
        this.serverUrl = 'http://localhost:8086';
        this.deviceId = this.generateDeviceId();
        this.updateInterval = 30000; // 30 seconds
        this.isRunning = false;
        this.userEmail = null;
        this.deviceInfo = {};
    }

    // Generate unique device ID
    generateDeviceId() {
        const machineId = os.hostname() + os.platform() + os.arch();
        return 'LTPRO-' + crypto.createHash('md5').update(machineId).digest('hex').substring(0, 8).toUpperCase();
    }

    // Auto-install the agent
    async autoInstall() {
        console.log('🚀 LaptopTracker Pro Enterprise - Auto-Installing Agent...');
        
        try {
            // Create installation directory
            const installDir = path.join(os.homedir(), '.laptoptracker');
            if (!fs.existsSync(installDir)) {
                fs.mkdirSync(installDir, { recursive: true });
            }

            // Copy agent to installation directory
            const agentPath = path.join(installDir, 'agent.js');
            fs.copyFileSync(__filename, agentPath);

            // Create service/startup entry
            await this.createStartupEntry(agentPath);

            console.log('✅ Agent installed successfully!');
            console.log(`📱 Device ID: ${this.deviceId}`);
            
            return true;
        } catch (error) {
            console.error('❌ Installation failed:', error.message);
            return false;
        }
    }

    // Create startup entry based on OS
    async createStartupEntry(agentPath) {
        const platform = os.platform();
        
        if (platform === 'win32') {
            // Windows - Add to startup registry
            const startupScript = `
@echo off
node "${agentPath}" --background
`;
            const startupPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'LaptopTracker.bat');
            fs.writeFileSync(startupPath, startupScript);
        } else if (platform === 'darwin') {
            // macOS - Create LaunchAgent
            const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.laptoptracker.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>node</string>
        <string>${agentPath}</string>
        <string>--background</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>`;
            const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.laptoptracker.agent.plist');
            fs.writeFileSync(plistPath, plistContent);
        } else {
            // Linux - Create systemd service
            const serviceContent = `[Unit]
Description=LaptopTracker Pro Enterprise Agent
After=network.target

[Service]
Type=simple
User=${os.userInfo().username}
ExecStart=node ${agentPath} --background
Restart=always

[Install]
WantedBy=multi-user.target`;
            
            const servicePath = path.join(os.homedir(), '.config', 'systemd', 'user', 'laptoptracker.service');
            const serviceDir = path.dirname(servicePath);
            if (!fs.existsSync(serviceDir)) {
                fs.mkdirSync(serviceDir, { recursive: true });
            }
            fs.writeFileSync(servicePath, serviceContent);
        }
    }

    // Collect comprehensive device information
    async collectDeviceInfo() {
        const deviceInfo = {
            deviceId: this.deviceId,
            deviceName: os.hostname(),
            platform: os.platform(),
            architecture: os.arch(),
            osVersion: os.release(),
            manufacturer: await this.getManufacturer(),
            model: await this.getModel(),
            serialNumber: await this.getSerialNumber(),
            
            // System specs
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            cpuCount: os.cpus().length,
            cpuModel: os.cpus()[0]?.model || 'Unknown',
            
            // Real-time data
            uptime: os.uptime(),
            loadAverage: os.loadavg(),
            userInfo: os.userInfo(),
            
            // Network info
            networkInterfaces: this.getNetworkInfo(),
            
            // Location (if available)
            location: await this.getLocation(),
            
            // Battery info
            batteryInfo: await this.getBatteryInfo(),
            
            // Disk info
            diskInfo: await this.getDiskInfo(),
            
            // Security info
            isLocked: await this.isScreenLocked(),
            
            // Timestamp
            lastSeen: new Date().toISOString(),
            isOnline: true
        };

        return deviceInfo;
    }

    // Get manufacturer information
    async getManufacturer() {
        return new Promise((resolve) => {
            if (os.platform() === 'win32') {
                exec('wmic computersystem get manufacturer /value', (error, stdout) => {
                    if (error) {
                        resolve('Unknown');
                        return;
                    }
                    const match = stdout.match(/Manufacturer=(.+)/);
                    resolve(match ? match[1].trim() : 'Unknown');
                });
            } else if (os.platform() === 'darwin') {
                resolve('Apple Inc.');
            } else {
                exec('sudo dmidecode -s system-manufacturer', (error, stdout) => {
                    resolve(error ? 'Unknown' : stdout.trim());
                });
            }
        });
    }

    // Get model information
    async getModel() {
        return new Promise((resolve) => {
            if (os.platform() === 'win32') {
                exec('wmic computersystem get model /value', (error, stdout) => {
                    if (error) {
                        resolve('Unknown');
                        return;
                    }
                    const match = stdout.match(/Model=(.+)/);
                    resolve(match ? match[1].trim() : 'Unknown');
                });
            } else if (os.platform() === 'darwin') {
                exec('system_profiler SPHardwareDataType | grep "Model Name"', (error, stdout) => {
                    if (error) {
                        resolve('MacBook');
                        return;
                    }
                    const match = stdout.match(/Model Name: (.+)/);
                    resolve(match ? match[1].trim() : 'MacBook');
                });
            } else {
                exec('sudo dmidecode -s system-product-name', (error, stdout) => {
                    resolve(error ? 'Unknown' : stdout.trim());
                });
            }
        });
    }

    // Get serial number
    async getSerialNumber() {
        return new Promise((resolve) => {
            if (os.platform() === 'win32') {
                exec('wmic bios get serialnumber /value', (error, stdout) => {
                    if (error) {
                        resolve('Unknown');
                        return;
                    }
                    const match = stdout.match(/SerialNumber=(.+)/);
                    resolve(match ? match[1].trim() : 'Unknown');
                });
            } else if (os.platform() === 'darwin') {
                exec('system_profiler SPHardwareDataType | grep "Serial Number"', (error, stdout) => {
                    if (error) {
                        resolve('Unknown');
                        return;
                    }
                    const match = stdout.match(/Serial Number \\(system\\): (.+)/);
                    resolve(match ? match[1].trim() : 'Unknown');
                });
            } else {
                exec('sudo dmidecode -s system-serial-number', (error, stdout) => {
                    resolve(error ? 'Unknown' : stdout.trim());
                });
            }
        });
    }

    // Get network information
    getNetworkInfo() {
        const interfaces = os.networkInterfaces();
        const networkInfo = {};
        
        for (const [name, addresses] of Object.entries(interfaces)) {
            networkInfo[name] = addresses.map(addr => ({
                address: addr.address,
                family: addr.family,
                internal: addr.internal
            }));
        }
        
        return networkInfo;
    }

    // Get location (using IP geolocation)
    async getLocation() {
        return new Promise((resolve) => {
            const req = https.get('https://ipapi.co/json/', (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const location = JSON.parse(data);
                        resolve({
                            latitude: location.latitude,
                            longitude: location.longitude,
                            city: location.city,
                            region: location.region,
                            country: location.country_name,
                            ip: location.ip
                        });
                    } catch (error) {
                        resolve(null);
                    }
                });
            });
            req.on('error', () => resolve(null));
            req.setTimeout(5000, () => {
                req.abort();
                resolve(null);
            });
        });
    }

    // Get battery information
    async getBatteryInfo() {
        return new Promise((resolve) => {
            if (os.platform() === 'win32') {
                exec('powershell "Get-WmiObject -Class Win32_Battery | Select-Object EstimatedChargeRemaining"', (error, stdout) => {
                    if (error) {
                        resolve({ level: null, charging: false });
                        return;
                    }
                    const match = stdout.match(/(\\d+)/);
                    const level = match ? parseInt(match[1]) : null;
                    resolve({ level, charging: false }); // Would need additional check for charging
                });
            } else if (os.platform() === 'darwin') {
                exec('pmset -g batt', (error, stdout) => {
                    if (error) {
                        resolve({ level: null, charging: false });
                        return;
                    }
                    const levelMatch = stdout.match(/(\\d+)%/);
                    const chargingMatch = stdout.match(/AC Power/);
                    const level = levelMatch ? parseInt(levelMatch[1]) : null;
                    const charging = !!chargingMatch;
                    resolve({ level, charging });
                });
            } else {
                // Linux battery info
                fs.readFile('/sys/class/power_supply/BAT0/capacity', 'utf8', (error, data) => {
                    if (error) {
                        resolve({ level: null, charging: false });
                        return;
                    }
                    const level = parseInt(data.trim());
                    resolve({ level, charging: false }); // Would need additional check
                });
            }
        });
    }

    // Get disk information
    async getDiskInfo() {
        return new Promise((resolve) => {
            if (os.platform() === 'win32') {
                exec('wmic logicaldisk get size,freespace,caption /value', (error, stdout) => {
                    if (error) {
                        resolve({ total: null, free: null, used: null });
                        return;
                    }
                    // Parse Windows disk info
                    const lines = stdout.split('\\n');
                    let total = 0, free = 0;
                    for (const line of lines) {
                        if (line.includes('Size=')) {
                            const sizeMatch = line.match(/Size=(\\d+)/);
                            if (sizeMatch) total += parseInt(sizeMatch[1]);
                        }
                        if (line.includes('FreeSpace=')) {
                            const freeMatch = line.match(/FreeSpace=(\\d+)/);
                            if (freeMatch) free += parseInt(freeMatch[1]);
                        }
                    }
                    resolve({ total, free, used: total - free });
                });
            } else {
                exec('df -B1 /', (error, stdout) => {
                    if (error) {
                        resolve({ total: null, free: null, used: null });
                        return;
                    }
                    const lines = stdout.split('\\n');
                    if (lines.length > 1) {
                        const parts = lines[1].trim().split(/\\s+/);
                        const total = parseInt(parts[1]);
                        const used = parseInt(parts[2]);
                        const free = parseInt(parts[3]);
                        resolve({ total, free, used });
                    } else {
                        resolve({ total: null, free: null, used: null });
                    }
                });
            }
        });
    }

    // Check if screen is locked
    async isScreenLocked() {
        return new Promise((resolve) => {
            if (os.platform() === 'win32') {
                exec('powershell "Get-Process logonui -ErrorAction SilentlyContinue"', (error, stdout) => {
                    resolve(!error && stdout.trim() !== '');
                });
            } else if (os.platform() === 'darwin') {
                exec('python -c "import Quartz; print(Quartz.CGSessionCopyCurrentDictionary())"', (error, stdout) => {
                    resolve(stdout.includes('CGSSessionScreenIsLocked'));
                });
            } else {
                // Linux - check if screensaver is active
                exec('gnome-screensaver-command -q', (error, stdout) => {
                    resolve(stdout.includes('is active'));
                });
            }
        });
    }

    // Register device with server
    async registerDevice(userEmail) {
        console.log('📡 Registering device with server...');
        
        try {
            const deviceInfo = await this.collectDeviceInfo();
            deviceInfo.ownerEmail = userEmail;
            
            const response = await this.sendToServer('/api/devices/register', 'POST', deviceInfo);
            
            if (response.success) {
                console.log('✅ Device registered successfully!');
                this.userEmail = userEmail;
                return true;
            } else {
                console.error('❌ Registration failed:', response.message);
                return false;
            }
        } catch (error) {
            console.error('❌ Registration error:', error.message);
            return false;
        }
    }

    // Send data to server
    async sendToServer(endpoint, method = 'POST', data = {}) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(data);
            const options = {
                hostname: 'localhost',
                port: 8086,
                path: endpoint,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'LaptopTracker-Agent/1.0'
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => responseData += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(responseData);
                        resolve(result);
                    } catch (error) {
                        resolve({ success: false, message: 'Invalid response' });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }

    // Start real-time monitoring
    async startMonitoring() {
        if (this.isRunning) return;
        
        console.log('🔄 Starting real-time monitoring...');
        this.isRunning = true;
        
        // Initial update
        await this.updateDeviceInfo();
        
        // Set up periodic updates
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.updateDeviceInfo();
            } catch (error) {
                console.error('❌ Monitoring error:', error.message);
            }
        }, this.updateInterval);
        
        console.log(`✅ Monitoring started (updates every ${this.updateInterval/1000} seconds)`);
    }

    // Update device information
    async updateDeviceInfo() {
        try {
            const deviceInfo = await this.collectDeviceInfo();
            const response = await this.sendToServer('/api/devices/update', 'POST', deviceInfo);
            
            if (response.success) {
                console.log(`📊 Device info updated - ${new Date().toLocaleTimeString()}`);
            }
        } catch (error) {
            console.error('❌ Update failed:', error.message);
        }
    }

    // Stop monitoring
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isRunning = false;
        console.log('🛑 Monitoring stopped');
    }

    // Main execution
    async run() {
        console.log('🚀 LaptopTracker Pro Enterprise Agent Starting...');
        console.log(`📱 Device ID: ${this.deviceId}`);
        console.log(`💻 Platform: ${os.platform()} ${os.arch()}`);
        console.log(`🏠 Hostname: ${os.hostname()}`);
        
        // Auto-install if needed
        await this.autoInstall();
        
        // Get user email for registration
        const userEmail = process.env.LAPTOPTRACKER_EMAIL || 'auto-detected@example.com';
        
        // Register device
        const registered = await this.registerDevice(userEmail);
        
        if (registered) {
            // Start monitoring
            await this.startMonitoring();
            
            // Keep running
            process.on('SIGINT', () => {
                console.log('\\n🛑 Shutting down agent...');
                this.stopMonitoring();
                process.exit(0);
            });
            
            console.log('✅ Agent is now running and tracking your device!');
        } else {
            console.error('❌ Failed to start agent - registration failed');
            process.exit(1);
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const agent = new LaptopTrackerAgent();
    agent.run().catch(console.error);
}

module.exports = LaptopTrackerAgent;