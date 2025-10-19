package com.example.demo.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/agents")
@CrossOrigin(origins = "*")
public class AgentDownloadController {

    /**
     * Serve Windows PowerShell installer directly
     */
    @GetMapping(value = "/install-windows.ps1", produces = "text/plain")
    public ResponseEntity<String> downloadWindowsInstaller() {
        try {
            String powershellScript = """
                # LaptopTracker Pro Enterprise - Auto Installer for Windows
                # Superior to Microsoft Find My Device
                
                param(
                    [Parameter(Mandatory=$false)]
                    [string]$UserEmail = "",
                    [Parameter(Mandatory=$false)]
                    [string]$ServerUrl = "http://localhost:8086"
                )
                
                Write-Host "🚀 LaptopTracker Pro Enterprise - Auto Installer" -ForegroundColor Cyan
                Write-Host "📱 Superior Device Tracking Solution" -ForegroundColor Green
                Write-Host ""
                
                # Check if running as administrator
                $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
                
                if (-not $isAdmin) {
                    Write-Host "⚠️  Requesting administrator privileges for full system access..." -ForegroundColor Yellow
                    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`" -UserEmail `"$UserEmail`" -ServerUrl `"$ServerUrl`"" -Verb RunAs
                    exit
                }
                
                Write-Host "✅ Running with administrator privileges" -ForegroundColor Green
                
                # Configuration
                $agentUrl = "$ServerUrl/agents/laptop-tracker-agent.js"
                $agentDir = "$env:USERPROFILE\\.laptoptracker"
                $agentPath = "$agentDir\\laptop-tracker-agent.js"
                
                # Create directory
                Write-Host "📁 Creating installation directory..." -ForegroundColor Cyan
                if (-not (Test-Path $agentDir)) {
                    New-Item -Path $agentDir -ItemType Directory -Force | Out-Null
                    Write-Host "✅ Directory created: $agentDir" -ForegroundColor Green
                } else {
                    Write-Host "✅ Directory exists: $agentDir" -ForegroundColor Green
                }
                
                # Check Node.js
                Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Cyan
                try {
                    $nodeVersion = node --version 2>$null
                    if ($nodeVersion) {
                        Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
                    } else {
                        throw "Node.js not found"
                    }
                } catch {
                    Write-Host "⚠️  Node.js not found. Installing..." -ForegroundColor Yellow
                    
                    $nodeInstaller = "$env:TEMP\\nodejs-installer.msi"
                    Write-Host "📥 Downloading Node.js..." -ForegroundColor Cyan
                    
                    try {
                        Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.9.0/node-v20.9.0-x64.msi" -OutFile $nodeInstaller -TimeoutSec 60
                        Write-Host "🔧 Installing Node.js..." -ForegroundColor Cyan
                        Start-Process msiexec -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart" -Wait
                        
                        # Update PATH
                        $env:PATH = "$env:PATH;$env:ProgramFiles\\nodejs"
                        
                        Start-Sleep 3
                        $nodeVersion = node --version 2>$null
                        if ($nodeVersion) {
                            Write-Host "✅ Node.js installed successfully: $nodeVersion" -ForegroundColor Green
                        } else {
                            Write-Host "❌ Node.js installation failed. Please install manually from https://nodejs.org" -ForegroundColor Red
                            Read-Host "Press Enter after installing Node.js"
                        }
                        Remove-Item $nodeInstaller -Force -ErrorAction SilentlyContinue
                    } catch {
                        Write-Host "❌ Failed to install Node.js automatically" -ForegroundColor Red
                        Write-Host "🌐 Please install Node.js from: https://nodejs.org" -ForegroundColor Yellow
                        Read-Host "Press Enter after installing Node.js"
                    }
                }
                
                # Download agent
                Write-Host "📥 Downloading LaptopTracker Agent..." -ForegroundColor Cyan
                try {
                    Invoke-WebRequest -Uri $agentUrl -OutFile $agentPath -TimeoutSec 30
                    Write-Host "✅ Agent downloaded successfully!" -ForegroundColor Green
                } catch {
                    Write-Host "⚠️  Download failed. Creating minimal agent..." -ForegroundColor Yellow
                    
                    $minimalAgent = @'
#!/usr/bin/env node
const os = require('os');
const http = require('http');

console.log('🚀 LaptopTracker Pro Agent Starting...');
const deviceId = require('crypto').randomBytes(8).toString('hex');
console.log('📱 Device ID:', deviceId);

const deviceInfo = {
    deviceId: deviceId,
    ownerEmail: process.env.LAPTOPTRACKER_EMAIL || "user@example.com",
    deviceName: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    osVersion: os.release(),
    totalMemory: os.totalmem(),
    lastSeen: new Date().toISOString()
};

// Register with server
const data = JSON.stringify(deviceInfo);
const options = {
    hostname: 'localhost',
    port: 8086,
    path: '/api/devices/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

console.log('📝 Registering device with server...');
const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', chunk => responseData += chunk);
    res.on('end', () => {
        console.log('✅ Device registered successfully!');
        console.log('📊 Response:', responseData);
        
        // Start monitoring
        console.log('🔄 Starting monitoring (every 30 seconds)...');
        setInterval(() => {
            console.log('💓 Sending heartbeat...');
            
            const heartbeat = {
                deviceId: deviceId,
                timestamp: new Date().toISOString(),
                status: 'active'
            };
            
            const heartbeatData = JSON.stringify(heartbeat);
            const heartbeatOptions = {
                hostname: 'localhost',
                port: 8086,
                path: '/api/devices/heartbeat',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(heartbeatData)
                }
            };
            
            const heartbeatReq = http.request(heartbeatOptions, (res) => {
                console.log('💚 Heartbeat sent');
            });
            
            heartbeatReq.on('error', (e) => {
                console.warn('⚠️ Heartbeat failed:', e.message);
            });
            
            heartbeatReq.write(heartbeatData);
            heartbeatReq.end();
        }, 30000);
    });
});

req.on('error', (e) => {
    console.error('❌ Registration failed:', e.message);
    console.log('🔄 Retrying in 10 seconds...');
    setTimeout(() => process.exit(1), 10000);
});

req.write(data);
req.end();
'@
                    
                    $minimalAgent | Out-File -FilePath $agentPath -Encoding UTF8
                    Write-Host "✅ Minimal agent created!" -ForegroundColor Green
                }
                
                # Create startup entry
                Write-Host "🔧 Configuring auto-startup..." -ForegroundColor Cyan
                try {
                    $taskName = "LaptopTracker Pro Agent"
                    
                    # Remove existing task
                    schtasks /delete /tn "$taskName" /f 2>$null | Out-Null
                    
                    # Create batch file
                    $batchContent = @"
@echo off
cd /d "$agentDir"
node laptop-tracker-agent.js
"@
                    
                    $batchPath = "$agentDir\\start-agent.bat"
                    $batchContent | Out-File -FilePath $batchPath -Encoding ASCII
                    
                    # Create scheduled task
                    $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batchPath`""
                    $trigger = New-ScheduledTaskTrigger -AtLogOn
                    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
                    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
                    
                    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
                    
                    Write-Host "✅ Auto-startup configured!" -ForegroundColor Green
                } catch {
                    Write-Host "⚠️  Auto-startup configuration failed: $($_.Exception.Message)" -ForegroundColor Yellow
                }
                
                # Start the agent
                Write-Host "🚀 Starting LaptopTracker Pro Agent..." -ForegroundColor Green
                try {
                    Start-Process -FilePath "node" -ArgumentList "`"$agentPath`"" -WorkingDirectory $agentDir -WindowStyle Hidden
                    Write-Host "✅ Agent started successfully!" -ForegroundColor Green
                } catch {
                    Write-Host "⚠️  Failed to start agent automatically" -ForegroundColor Yellow
                    Write-Host "🔧 You can start it manually: node `"$agentPath`"" -ForegroundColor Cyan
                }
                
                Write-Host ""
                Write-Host "🎉 Installation Complete!" -ForegroundColor Green
                Write-Host "===========================================" -ForegroundColor Green
                Write-Host "📂 Installation: $agentDir" -ForegroundColor Cyan
                Write-Host "🌐 Dashboard: http://localhost:8086" -ForegroundColor Cyan
                Write-Host "✨ Your device appears in the dashboard shortly!" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "🏆 Superior to Microsoft Find My Device!" -ForegroundColor Magenta
                Read-Host "Press Enter to exit"
                """;
            
            return ResponseEntity.ok()
                .header("Content-Type", "text/plain; charset=utf-8")
                .header("Content-Disposition", "attachment; filename=install-windows.ps1")
                .body(powershellScript);
                
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("# Failed to generate installer: " + e.getMessage());
        }
    }

    /**
     * Serve the Node.js agent file
     */
    @GetMapping(value = "/laptop-tracker-agent.js", produces = "application/javascript")
    public ResponseEntity<String> downloadAgent() {
        try {
            // Read the agent file from resources
            Resource resource = new ClassPathResource("static/agents/laptop-tracker-agent.js");
            String content = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
            
            return ResponseEntity.ok()
                .header("Content-Type", "application/javascript; charset=utf-8")
                .header("Content-Disposition", "attachment; filename=laptop-tracker-agent.js")
                .body(content);
                
        } catch (IOException e) {
            // Return a minimal agent if file not found
            String minimalAgent = """
                #!/usr/bin/env node
                const os = require('os');
                const http = require('http');
                
                console.log('🚀 LaptopTracker Pro Agent Starting...');
                const deviceId = require('crypto').randomBytes(8).toString('hex');
                console.log('📱 Device ID:', deviceId);
                
                const deviceInfo = {
                    deviceId: deviceId,
                    ownerEmail: process.env.LAPTOPTRACKER_EMAIL || "user@example.com",
                    deviceName: os.hostname(),
                    platform: os.platform(),
                    architecture: os.arch(),
                    osVersion: os.release(),
                    totalMemory: os.totalmem(),
                    lastSeen: new Date().toISOString()
                };
                
                // Register with server
                const data = JSON.stringify(deviceInfo);
                const options = {
                    hostname: 'localhost',
                    port: 8086,
                    path: '/api/devices/register',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data)
                    }
                };
                
                console.log('📝 Registering device...');
                const req = http.request(options, (res) => {
                    console.log('✅ Device registered!');
                    setInterval(() => {
                        console.log('💓 Heartbeat...');
                    }, 30000);
                });
                
                req.on('error', (e) => {
                    console.error('❌ Error:', e.message);
                });
                
                req.write(data);
                req.end();
                """;
                
            return ResponseEntity.ok()
                .header("Content-Type", "application/javascript; charset=utf-8")
                .body(minimalAgent);
        }
    }
}