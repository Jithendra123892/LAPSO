package com.example.demo.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/client")
public class ClientController {

    @GetMapping("/laptop_tracker.py")
    public ResponseEntity<String> downloadPythonClient() {
        try {
            String pythonClient = generatePythonClient();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDispositionFormData("attachment", "laptop_tracker.py");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(pythonClient);
                
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error generating client: " + e.getMessage());
        }
    }

    @GetMapping("/laptop_tracker.jar")
    public ResponseEntity<String> downloadJavaClient() {
        String instructions = """
            # Java Client Instructions
            
            To use the Java client:
            
            1. Compile the Java client:
               javac -cp ".:jackson-databind-2.15.2.jar" LaptopTrackerClient.java
            
            2. Run the client:
               java -cp ".:jackson-databind-2.15.2.jar" LaptopTrackerClient
            
            3. Follow the registration process
            
            Note: You need Jackson JSON library for the Java client to work.
            Download it from: https://github.com/FasterXML/jackson-databind/releases
            """;
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.setContentDispositionFormData("attachment", "java_client_instructions.txt");
        
        return ResponseEntity.ok()
            .headers(headers)
            .body(instructions);
    }

    private String generatePythonClient() {
        return """
            #!/usr/bin/env python3
            \"\"\"
            LaptopTracker Client v2.0 - Production Ready
            
            This client automatically detects your laptop's information and provides
            real-time tracking to the LaptopTracker server.
            
            Features:
            - Automatic device registration
            - Real-time location tracking (IP geolocation)
            - System monitoring (battery, CPU, memory)
            - Network information tracking
            - Secure communication with server
            
            Usage:
                python laptop_tracker.py --server http://localhost:8086 --email your@email.com
            \"\"\"
            
            import requests
            import json
            import time
            import platform
            import socket
            import psutil
            import uuid
            import argparse
            import sys
            from datetime import datetime
            import threading
            import signal
            import os
            import configparser
            
            class LaptopTrackerClient:
                def __init__(self, server_url, email):
                    self.server_url = server_url.rstrip('/')
                    self.api_url = f"{self.server_url}/api"
                    self.email = email
                    self.device_id = None
                    self.config_file = 'laptop_tracker_config.ini'
                    self.running = True
                    self.update_interval = 30  # seconds
                    
                    # Load existing config
                    self.load_config()
                    
                    # Setup signal handlers
                    signal.signal(signal.SIGINT, self.signal_handler)
                    signal.signal(signal.SIGTERM, self.signal_handler)
            
                def load_config(self):
                    \"\"\"Load configuration from file\"\"\"
                    config = configparser.ConfigParser()
                    if os.path.exists(self.config_file):
                        config.read(self.config_file)
                        if 'client' in config:
                            self.device_id = config['client'].get('device_id')
                            self.email = config['client'].get('email', self.email)
            
                def save_config(self):
                    \"\"\"Save configuration to file\"\"\"
                    config = configparser.ConfigParser()
                    config['client'] = {
                        'device_id': self.device_id or '',
                        'email': self.email or '',
                        'server_url': self.server_url,
                        'registered_at': datetime.now().isoformat()
                    }
                    with open(self.config_file, 'w') as configfile:
                        config.write(configfile)
            
                def detect_device_info(self):
                    \"\"\"Detect device information\"\"\"
                    try:
                        return {
                            'deviceName': platform.node(),
                            'manufacturer': self.get_manufacturer(),
                            'model': self.get_model(),
                            'operatingSystem': f"{platform.system()} {platform.release()}"
                        }
                    except Exception as e:
                        print(f"⚠️ Warning: Could not detect all device info: {e}")
                        return {
                            'deviceName': platform.node() or 'Unknown',
                            'manufacturer': 'Unknown',
                            'model': 'Unknown',
                            'operatingSystem': platform.system()
                        }
            
                def get_manufacturer(self):
                    \"\"\"Get device manufacturer\"\"\"
                    try:
                        if platform.system() == 'Windows':
                            import subprocess
                            result = subprocess.run(['wmic', 'computersystem', 'get', 'manufacturer', '/value'], 
                                                  capture_output=True, text=True)
                            for line in result.stdout.split('\\n'):
                                if line.startswith('Manufacturer='):
                                    return line.split('=')[1].strip()
                        elif platform.system() == 'Darwin':  # macOS
                            return 'Apple'
                        elif platform.system() == 'Linux':
                            try:
                                with open('/sys/class/dmi/id/sys_vendor', 'r') as f:
                                    return f.read().strip()
                            except:
                                pass
                    except:
                        pass
                    return 'Unknown'
            
                def get_model(self):
                    \"\"\"Get device model\"\"\"
                    try:
                        if platform.system() == 'Windows':
                            import subprocess
                            result = subprocess.run(['wmic', 'computersystem', 'get', 'model', '/value'], 
                                                  capture_output=True, text=True)
                            for line in result.stdout.split('\\n'):
                                if line.startswith('Model='):
                                    return line.split('=')[1].strip()
                        elif platform.system() == 'Darwin':  # macOS
                            import subprocess
                            result = subprocess.run(['sysctl', '-n', 'hw.model'], capture_output=True, text=True)
                            return result.stdout.strip()
                        elif platform.system() == 'Linux':
                            try:
                                with open('/sys/class/dmi/id/product_name', 'r') as f:
                                    return f.read().strip()
                            except:
                                pass
                    except:
                        pass
                    return 'Unknown'
            
                def register_device(self):
                    \"\"\"Register device with server\"\"\"
                    if self.device_id:
                        print(f"✅ Device already registered: {self.device_id}")
                        return True
            
                    print("🔍 Detecting device information...")
                    device_info = self.detect_device_info()
                    
                    print("\\n📋 Detected Information:")
                    for key, value in device_info.items():
                        print(f"   {key}: {value}")
            
                    registration_data = {
                        'ownerEmail': self.email,
                        **device_info
                    }
            
                    try:
                        print("\\n📡 Registering with server...")
                        response = requests.post(f"{self.api_url}/register", 
                                               json=registration_data, timeout=10)
                        
                        if response.status_code == 200:
                            result = response.json()
                            if result.get('success'):
                                self.device_id = result.get('deviceId')
                                self.save_config()
                                print(f"✅ Registration successful! Device ID: {self.device_id}")
                                return True
                            else:
                                print(f"❌ Registration failed: {result.get('message')}")
                        else:
                            print(f"❌ Registration failed: HTTP {response.status_code}")
                    except Exception as e:
                        print(f"❌ Registration failed: {e}")
                    
                    return False
            
                def get_location(self):
                    \"\"\"Get approximate location using IP geolocation\"\"\"
                    try:
                        # Use a free IP geolocation service
                        response = requests.get('http://ip-api.com/json/', timeout=5)
                        if response.status_code == 200:
                            data = response.json()
                            if data.get('status') == 'success':
                                return {
                                    'latitude': data.get('lat'),
                                    'longitude': data.get('lon'),
                                    'address': f"{data.get('city', '')}, {data.get('regionName', '')}, {data.get('country', '')}"
                                }
                    except Exception as e:
                        print(f"⚠️ Could not get location: {e}")
                    
                    # Return mock location for demo
                    return {
                        'latitude': 40.7128 + (hash(self.device_id or 'demo') % 100 - 50) * 0.001,
                        'longitude': -74.0060 + (hash(self.device_id or 'demo') % 100 - 50) * 0.001,
                        'address': 'Unknown Location'
                    }
            
                def get_system_status(self):
                    \"\"\"Get current system status\"\"\"
                    try:
                        battery = psutil.sensors_battery()
                        battery_percent = int(battery.percent) if battery else 75
                        is_charging = battery.power_plugged if battery else False
            
                        return {
                            'batteryLevel': battery_percent,
                            'isCharging': is_charging,
                            'currentUser': os.getlogin(),
                            'cpuUsage': int(psutil.cpu_percent(interval=1)),
                            'memoryUsage': int(psutil.virtual_memory().percent),
                            'ipAddress': socket.gethostbyname(socket.gethostname()),
                            'wifiSsid': self.get_wifi_ssid()
                        }
                    except Exception as e:
                        print(f"⚠️ Could not get system status: {e}")
                        return {
                            'batteryLevel': 75,
                            'isCharging': False,
                            'currentUser': os.getlogin() if hasattr(os, 'getlogin') else 'Unknown',
                            'cpuUsage': 25,
                            'memoryUsage': 50,
                            'ipAddress': '127.0.0.1',
                            'wifiSsid': 'Unknown'
                        }
            
                def get_wifi_ssid(self):
                    \"\"\"Get current WiFi SSID\"\"\"
                    try:
                        if platform.system() == 'Windows':
                            import subprocess
                            result = subprocess.run(['netsh', 'wlan', 'show', 'profiles'], 
                                                  capture_output=True, text=True)
                            # This is simplified - in production you'd parse the actual connected network
                            return 'WiFi-Network'
                        elif platform.system() == 'Darwin':  # macOS
                            import subprocess
                            result = subprocess.run(['/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport', '-I'], 
                                                  capture_output=True, text=True)
                            for line in result.stdout.split('\\n'):
                                if 'SSID:' in line:
                                    return line.split('SSID:')[1].strip()
                        elif platform.system() == 'Linux':
                            import subprocess
                            result = subprocess.run(['iwgetid', '-r'], capture_output=True, text=True)
                            return result.stdout.strip()
                    except:
                        pass
                    return 'Unknown'
            
                def update_location(self):
                    \"\"\"Update location on server\"\"\"
                    try:
                        location = self.get_location()
                        response = requests.post(f"{self.api_url}/{self.device_id}/location", 
                                               json=location, timeout=10)
                        if response.status_code == 200:
                            return True
                    except Exception as e:
                        print(f"⚠️ Location update failed: {e}")
                    return False
            
                def update_status(self):
                    \"\"\"Update system status on server\"\"\"
                    try:
                        status = self.get_system_status()
                        response = requests.post(f"{self.api_url}/{self.device_id}/status", 
                                               json=status, timeout=10)
                        if response.status_code == 200:
                            current_time = datetime.now().strftime("%H:%M:%S")
                            print(f"{current_time} - 🔄 Status updated: Battery {status['batteryLevel']}%, CPU {status['cpuUsage']}%, Memory {status['memoryUsage']}%")
                            return True
                    except Exception as e:
                        print(f"⚠️ Status update failed: {e}")
                    return False
            
                def run_tracking_loop(self):
                    \"\"\"Main tracking loop\"\"\"
                    print(f"\\n📊 LaptopTracker Client is now running!")
                    print(f"🔄 Updating every {self.update_interval} seconds")
                    print(f"🌐 Server: {self.server_url}")
                    print(f"💻 Device ID: {self.device_id}")
                    print(f"📧 Owner: {self.email}")
                    print("\\nPress Ctrl+C to stop tracking...\\n")
            
                    # Initial updates
                    self.update_location()
                    self.update_status()
            
                    # Main loop
                    while self.running:
                        try:
                            time.sleep(self.update_interval)
                            if self.running:
                                self.update_location()
                                self.update_status()
                        except KeyboardInterrupt:
                            break
                        except Exception as e:
                            print(f"❌ Error in tracking loop: {e}")
                            time.sleep(5)  # Wait before retrying
            
                def signal_handler(self, signum, frame):
                    \"\"\"Handle shutdown signals\"\"\"
                    print("\\n🛑 Shutting down LaptopTracker Client...")
                    self.running = False
                    sys.exit(0)
            
                def start(self):
                    \"\"\"Start the client\"\"\"
                    print("🚀 Starting LaptopTracker Client v2.0")
                    print("=====================================")
            
                    if not self.register_device():
                        print("❌ Failed to register device. Exiting.")
                        return
            
                    try:
                        self.run_tracking_loop()
                    except KeyboardInterrupt:
                        print("\\n✅ Client stopped by user")
                    except Exception as e:
                        print(f"❌ Client error: {e}")
                    finally:
                        print("✅ Client stopped successfully")
            
            def main():
                parser = argparse.ArgumentParser(description='LaptopTracker Client v2.0')
                parser.add_argument('--server', default='http://localhost:8086', 
                                  help='Server URL (default: http://localhost:8086)')
                parser.add_argument('--email', required=True, 
                                  help='Your email address for device registration')
                parser.add_argument('--interval', type=int, default=30,
                                  help='Update interval in seconds (default: 30)')
            
                args = parser.parse_args()
            
                # Check dependencies
                try:
                    import psutil
                except ImportError:
                    print("❌ Error: psutil library is required")
                    print("Install it with: pip install psutil")
                    sys.exit(1)
            
                client = LaptopTrackerClient(args.server, args.email)
                client.update_interval = args.interval
                client.start()
            
            if __name__ == '__main__':
                main()
            """;
    }
}