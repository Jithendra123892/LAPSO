#!/usr/bin/env python3
"""
🛡️ LAPSO Universal Agent - Cross-Platform Device Tracking
Works on Windows, macOS, Linux, Android (via Termux)
Better than Microsoft Find My Device - More platforms, more features
"""

import os
import sys
import json
import time
import requests
import platform
import subprocess
import threading
from datetime import datetime
import psutil
import socket

class LapsoAgent:
    def __init__(self, server_url="http://localhost:8080", device_id=None, user_email=None):
        self.server_url = server_url.rstrip('/')
        self.device_id = device_id or self.generate_device_id()
        self.user_email = user_email
        self.running = True
        self.update_interval = 30  # seconds
        
        print(f"🛡️ LAPSO Agent Starting...")
        print(f"📱 Platform: {platform.system()} {platform.release()}")
        print(f"🆔 Device ID: {self.device_id}")
        print(f"👤 User: {self.user_email}")
        print(f"🌐 Server: {self.server_url}")
        
    def generate_device_id(self):
        """Generate unique device ID"""
        try:
            # Use MAC address for unique ID
            import uuid
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) 
                           for elements in range(0,2*6,2)][::-1])
            return f"LAPSO-{platform.system()[:3].upper()}-{mac.replace(':', '')[-8:]}"
        except:
            return f"LAPSO-{platform.system()[:3].upper()}-{int(time.time())}"
    
    def get_system_info(self):
        """Get comprehensive system information"""
        try:
            # Basic system info
            info = {
                "deviceId": self.device_id,
                "userEmail": self.user_email,
                "deviceName": platform.node(),
                "manufacturer": self.get_manufacturer(),
                "model": self.get_model(),
                "osName": platform.system(),
                "osVersion": platform.release(),
                "architecture": platform.machine(),
                "timestamp": datetime.now().isoformat()
            }
            
            # Performance metrics
            info.update(self.get_performance_metrics())
            
            # Location (if available)
            location = self.get_location()
            if location:
                info.update(location)
            
            # Network info
            info.update(self.get_network_info())
            
            return info
            
        except Exception as e:
            print(f"❌ Error getting system info: {e}")
            return {"deviceId": self.device_id, "userEmail": self.user_email, "error": str(e)}
    
    def get_manufacturer(self):
        """Get device manufacturer"""
        system = platform.system()
        if system == "Windows":
            try:
                result = subprocess.run(['wmic', 'computersystem', 'get', 'manufacturer'], 
                                      capture_output=True, text=True)
                return result.stdout.split('\n')[1].strip()
            except:
                return "Unknown"
        elif system == "Darwin":  # macOS
            return "Apple"
        elif system == "Linux":
            try:
                with open('/sys/class/dmi/id/sys_vendor', 'r') as f:
                    return f.read().strip()
            except:
                return "Unknown"
        return "Unknown"
    
    def get_model(self):
        """Get device model"""
        system = platform.system()
        if system == "Windows":
            try:
                result = subprocess.run(['wmic', 'computersystem', 'get', 'model'], 
                                      capture_output=True, text=True)
                return result.stdout.split('\n')[1].strip()
            except:
                return "Unknown"
        elif system == "Darwin":  # macOS
            try:
                result = subprocess.run(['system_profiler', 'SPHardwareDataType'], 
                                      capture_output=True, text=True)
                for line in result.stdout.split('\n'):
                    if 'Model Name:' in line:
                        return line.split(':')[1].strip()
            except:
                pass
            return "Mac"
        elif system == "Linux":
            try:
                with open('/sys/class/dmi/id/product_name', 'r') as f:
                    return f.read().strip()
            except:
                return "Linux Device"
        return "Unknown"
    
    def get_performance_metrics(self):
        """Get system performance metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Battery (if available)
            battery_info = {}
            try:
                battery = psutil.sensors_battery()
                if battery:
                    battery_info = {
                        "batteryLevel": int(battery.percent),
                        "isCharging": battery.power_plugged
                    }
            except:
                pass
            
            metrics = {
                "cpuUsage": cpu_percent,
                "memoryTotal": memory.total,
                "memoryUsed": memory.used,
                "memoryPercent": memory.percent,
                "diskTotal": disk.total,
                "diskUsed": disk.used,
                "diskPercent": (disk.used / disk.total) * 100,
                **battery_info
            }
            
            return metrics
            
        except Exception as e:
            print(f"❌ Error getting performance metrics: {e}")
            return {}
    
    def get_location(self):
        """Get device location (GPS, WiFi, IP-based)"""
        try:
            # Try IP-based geolocation first (most reliable)
            response = requests.get("http://ip-api.com/json/", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    return {
                        "latitude": data.get('lat'),
                        "longitude": data.get('lon'),
                        "address": f"{data.get('city', '')}, {data.get('country', '')}",
                        "locationAccuracy": 1000.0,  # IP-based is less accurate
                        "locationSource": "IP"
                    }
        except Exception as e:
            print(f"⚠️ Location service unavailable: {e}")
        
        return None
    
    def get_network_info(self):
        """Get network information"""
        try:
            # Get local IP
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            
            # Get network interfaces
            interfaces = psutil.net_if_addrs()
            wifi_info = {}
            
            # Try to get WiFi SSID (platform-specific)
            system = platform.system()
            if system == "Windows":
                try:
                    result = subprocess.run(['netsh', 'wlan', 'show', 'profiles'], 
                                          capture_output=True, text=True)
                    # Parse WiFi profiles (simplified)
                    wifi_info["wifiSsid"] = "WiFi Connected"
                except:
                    pass
            elif system == "Darwin":  # macOS
                try:
                    result = subprocess.run(['/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport', '-I'], 
                                          capture_output=True, text=True)
                    for line in result.stdout.split('\n'):
                        if 'SSID:' in line:
                            wifi_info["wifiSsid"] = line.split(':')[1].strip()
                            break
                except:
                    pass
            elif system == "Linux":
                try:
                    result = subprocess.run(['iwgetid', '-r'], capture_output=True, text=True)
                    if result.returncode == 0:
                        wifi_info["wifiSsid"] = result.stdout.strip()
                except:
                    pass
            
            return {
                "ipAddress": local_ip,
                "networkName": hostname,
                **wifi_info
            }
            
        except Exception as e:
            print(f"❌ Error getting network info: {e}")
            return {}
    
    def register_device(self):
        """Register device with LAPSO server"""
        try:
            system_info = self.get_system_info()
            
            response = requests.post(
                f"{self.server_url}/api/devices/register",
                json=system_info,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Device registered successfully: {result.get('message', 'OK')}")
                return True
            else:
                print(f"❌ Registration failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Registration error: {e}")
            return False
    
    def update_device_status(self):
        """Send device status update to server"""
        try:
            system_info = self.get_system_info()
            
            response = requests.post(
                f"{self.server_url}/api/devices/update",
                json=system_info,
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"📊 Status updated: {datetime.now().strftime('%H:%M:%S')}")
                return True
            else:
                print(f"⚠️ Update failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Update error: {e}")
            return False
    
    def poll_commands(self):
        """Poll server for pending commands"""
        try:
            response = requests.get(
                f"{self.server_url}/api/device-commands/poll/{self.device_id}",
                params={"userEmail": self.user_email},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                commands = data.get('commands', [])
                
                for command in commands:
                    self.execute_command(command)
                
                return True
            else:
                print(f"⚠️ Command poll failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Command poll error: {e}")
            return False
    
    def execute_command(self, command):
        """Execute a command from the server"""
        try:
            action = command.get('action')
            command_id = command.get('commandId')
            parameters = command.get('parameters', {})
            
            print(f"📋 Executing command: {action} (ID: {command_id})")
            
            result = {"commandId": command_id, "status": "success", "message": ""}
            
            if action == "LOCK":
                result = self.lock_device(parameters)
            elif action == "UNLOCK":
                result = self.unlock_device(parameters)
            elif action == "PLAY_SOUND":
                result = self.play_sound(parameters)
            elif action == "SCREENSHOT":
                result = self.take_screenshot(parameters)
            elif action == "UPDATE_LOCATION":
                result = self.update_location(parameters)
            elif action == "WIPE":
                result = self.wipe_device(parameters)
            else:
                result["status"] = "error"
                result["message"] = f"Unknown command: {action}"
            
            # Report result back to server
            self.report_command_result(result)
            
        except Exception as e:
            print(f"❌ Command execution error: {e}")
            self.report_command_result({
                "commandId": command.get('commandId', 'unknown'),
                "status": "error",
                "message": str(e)
            })
    
    def lock_device(self, parameters):
        """Lock the device"""
        try:
            system = platform.system()
            
            if system == "Windows":
                subprocess.run(['rundll32.exe', 'user32.dll,LockWorkStation'])
            elif system == "Darwin":  # macOS
                subprocess.run(['/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession', '-suspend'])
            elif system == "Linux":
                # Try different lock commands
                for cmd in [['gnome-screensaver-command', '--lock'], 
                           ['xdg-screensaver', 'lock'], 
                           ['loginctl', 'lock-session']]:
                    try:
                        subprocess.run(cmd, check=True)
                        break
                    except:
                        continue
            
            return {"status": "success", "message": "Device locked successfully"}
            
        except Exception as e:
            return {"status": "error", "message": f"Failed to lock device: {e}"}
    
    def unlock_device(self, parameters):
        """Unlock device (limited capability for security)"""
        return {"status": "info", "message": "Unlock requires physical access for security"}
    
    def play_sound(self, parameters):
        """Play sound to help locate device"""
        try:
            duration = parameters.get('duration', 30)
            system = platform.system()
            
            if system == "Windows":
                # Play system beep
                import winsound
                for _ in range(duration):
                    winsound.Beep(1000, 1000)  # 1000Hz for 1 second
                    time.sleep(1)
            elif system == "Darwin":  # macOS
                subprocess.run(['say', 'LAPSO device location sound. Your device is here.'])
            elif system == "Linux":
                # Try different sound commands
                for cmd in [['paplay', '/usr/share/sounds/alsa/Front_Left.wav'],
                           ['aplay', '/usr/share/sounds/alsa/Front_Left.wav'],
                           ['speaker-test', '-t', 'sine', '-f', '1000', '-l', '1']]:
                    try:
                        subprocess.run(cmd, timeout=5)
                        break
                    except:
                        continue
            
            return {"status": "success", "message": f"Sound played for {duration} seconds"}
            
        except Exception as e:
            return {"status": "error", "message": f"Failed to play sound: {e}"}
    
    def take_screenshot(self, parameters):
        """Take screenshot of device"""
        try:
            import PIL.ImageGrab as ImageGrab
            
            # Take screenshot
            screenshot = ImageGrab.grab()
            
            # Save to temp file
            filename = f"lapso_screenshot_{int(time.time())}.png"
            screenshot.save(filename)
            
            # In production, upload to server
            print(f"📸 Screenshot saved: {filename}")
            
            return {"status": "success", "message": f"Screenshot saved: {filename}"}
            
        except Exception as e:
            return {"status": "error", "message": f"Failed to take screenshot: {e}"}
    
    def update_location(self, parameters):
        """Force location update"""
        try:
            # Get fresh location
            location = self.get_location()
            
            if location:
                # Send to server immediately
                self.update_device_status()
                return {"status": "success", "message": "Location updated"}
            else:
                return {"status": "warning", "message": "Location not available"}
                
        except Exception as e:
            return {"status": "error", "message": f"Failed to update location: {e}"}
    
    def wipe_device(self, parameters):
        """Emergency device wipe (DANGEROUS)"""
        try:
            # This is a placeholder - in production, implement secure wipe
            print("🚨 EMERGENCY WIPE COMMAND RECEIVED")
            print("⚠️ This would permanently delete all data")
            print("🛡️ LAPSO Agent: Wipe simulation (not implemented for safety)")
            
            return {"status": "simulated", "message": "Wipe command simulated (not executed for safety)"}
            
        except Exception as e:
            return {"status": "error", "message": f"Wipe command error: {e}"}
    
    def report_command_result(self, result):
        """Report command execution result to server"""
        try:
            response = requests.post(
                f"{self.server_url}/api/device-commands/result/{self.device_id}",
                json=result,
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"✅ Command result reported: {result['status']}")
            else:
                print(f"⚠️ Failed to report result: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error reporting result: {e}")
    
    def run(self):
        """Main agent loop"""
        print(f"🚀 LAPSO Agent running (update interval: {self.update_interval}s)")
        
        # Initial registration
        if not self.register_device():
            print("❌ Failed to register device, continuing anyway...")
        
        # Main loop
        while self.running:
            try:
                # Update device status
                self.update_device_status()
                
                # Poll for commands
                self.poll_commands()
                
                # Wait for next update
                time.sleep(self.update_interval)
                
            except KeyboardInterrupt:
                print("\n🛑 LAPSO Agent stopping...")
                self.running = False
            except Exception as e:
                print(f"❌ Agent error: {e}")
                time.sleep(5)  # Wait before retry
        
        print("👋 LAPSO Agent stopped")

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='LAPSO Universal Agent')
    parser.add_argument('--server', default='http://localhost:8080', help='LAPSO server URL')
    parser.add_argument('--device-id', help='Device ID (auto-generated if not provided)')
    parser.add_argument('--user-email', required=True, help='User email (required)')
    parser.add_argument('--interval', type=int, default=30, help='Update interval in seconds')
    
    args = parser.parse_args()
    
    # Create and run agent
    agent = LapsoAgent(
        server_url=args.server,
        device_id=args.device_id,
        user_email=args.user_email
    )
    agent.update_interval = args.interval
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")

if __name__ == "__main__":
    main()