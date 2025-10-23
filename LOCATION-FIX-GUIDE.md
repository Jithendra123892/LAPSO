# 📍 How to Fix Incorrect Device Location

## The Problem
Your device is showing location at **17.385044, 78.486671** (Hyderabad), but you're not there.

## Why This Happens
1. **Windows Location Services disabled** - The agent can't get GPS
2. **IP-based geolocation fallback** - Uses internet IP which shows ISP location, not actual location
3. **Cached/stale data** - Old coordinates stored in database

## ✅ Quick Fix (Use the Button!)

### Step 1: Open the Map
1. Go to http://localhost:8080/map
2. Login with `jithu@gmail.com` / `password123`

### Step 2: Fix Location with One Click
1. Click the **"📍 Fix Location"** button in the top bar
2. Browser will ask: **"Allow location access?"** → Click **Allow**
3. Wait 2-5 seconds for GPS to acquire your actual location
4. Map will auto-reload with correct location! ✅

### What Happens Behind the Scenes:
```
Browser GPS → Your actual coordinates → Server updates device → Map refreshes
```

## 🔧 Manual Fix (If Button Doesn't Work)

### Option 1: Use REST API
```powershell
# Replace with your actual coordinates
$lat = YOUR_LATITUDE   # Example: 28.6139
$lng = YOUR_LONGITUDE  # Example: 77.2090

Invoke-RestMethod -Uri "http://localhost:8080/api/device-location/update" `
  -Method POST `
  -Body @{
    deviceId = "0B7ABA31-AD7B-4AE3-8301-C4C6E6EFCE32"
    latitude = $lat
    longitude = $lng
  } `
  -ContentType "application/x-www-form-urlencoded"
```

### Option 2: Update Database Directly
```sql
-- Connect to PostgreSQL
psql -U postgres -d postgres

-- Update your device location
UPDATE devices 
SET latitude = YOUR_LATITUDE, 
    longitude = YOUR_LONGITUDE,
    last_seen = NOW()
WHERE device_id = '0B7ABA31-AD7B-4AE3-8301-C4C6E6EFCE32';

-- Verify
SELECT name, latitude, longitude FROM devices WHERE device_id = '0B7ABA31-AD7B-4AE3-8301-C4C6E6EFCE32';
```

## 🛠️ Fix Windows Location Services (For Agent)

### Enable Windows Location:
1. Open **Settings** → **Privacy & Security** → **Location**
2. Turn ON **Location services**
3. Turn ON **Let apps access your location**
4. Scroll down and enable for **PowerShell** and **Windows Location Provider**

### Restart the Agent:
```powershell
# Stop current agent
Get-ScheduledTask | Where-Object {$_.TaskName -like "*LAPSO*"} | Stop-ScheduledTask

# Start agent (it will get fresh GPS location)
Get-ScheduledTask | Where-Object {$_.TaskName -like "*LAPSO*"} | Start-ScheduledTask
```

## 📍 How to Find Your Actual Coordinates

### Online Tools:
- **Google Maps**: Right-click anywhere → Click coordinates at bottom
- **GPS Status**: Open https://www.gps-coordinates.net/ in browser
- **Mappls**: Go to https://maps.mappls.com/ → Right-click → Copy coordinates

### PowerShell Command:
```powershell
# Get coordinates from IP (approximate)
$location = Invoke-RestMethod "http://ip-api.com/json/"
Write-Host "Latitude: $($location.lat)"
Write-Host "Longitude: $($location.lon)"
Write-Host "City: $($location.city), $($location.country)"
```

## 🗺️ New Map Features

After fixing location, you'll see:
- **Blue marker** = Your current location (from browser)
- **Green marker** = Your device (SUHASINI)
- **Dashed line** = Path/distance between them
- **Distance panel** = Shows exact distance in meters/km

## ⚡ Quick Test

Restart your app and test:
```powershell
# Stop the app (Ctrl+C in terminal)
# Then restart:
mvn spring-boot:run

# Open browser:
Start-Process "http://localhost:8080/map"
```

## 🎯 Expected Result

After clicking "Fix Location":
```
Your actual coordinates (from browser GPS)
    ↓
Updates device in database
    ↓
Map shows correct location with distance!
```

## 📝 Notes

- Browser location is usually accurate within 10-50 meters (if GPS available)
- Desktop computers without GPS will use WiFi triangulation (~100m accuracy)
- IP-based location is least accurate (city-level, ~1-10 km)
- The "Fix Location" button uses HIGH ACCURACY mode for best results
