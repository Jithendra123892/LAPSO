# 🧪 Testing Lock/Screenshot/Wipe Features

## ✅ What's Working Now:
1. ✅ Server is running (localhost:8080)
2. ✅ Agent is installed and running
3. ✅ Agent is polling every 30 seconds
4. ✅ Device registered: **SUHASINI** (0B7ABA31-AD7B-4AE3-8301-C4C6E6EFCE32)
5. ✅ Battery: 96%

## 🔍 Why Lock Wasn't Working:
The Lock button needs you to **login through the browser UI** first. Direct API calls fail with "Authentication required".

## 📋 Step-by-Step Test Instructions:

### Test 1: Lock Your Device

1. **Open Browser**:
   ```
   http://localhost:8080/login
   ```

2. **Login**:
   - Email: `jithu@gmail.com`
   - Password: (your password)

3. **Go to Map View**:
   - Click "Dashboard" or "Map" menu
   - You should see your device "SUHASINI" on the map

4. **Open Browser Console** (IMPORTANT!):
   - Press `F12`
   - Go to "Console" tab
   - Keep it open to see logs

5. **Select Your Device**:
   - At top of map, select device from ComboBox
   - Should show: "Using device: SUHASINI"

6. **Click Lock Button** (🔒):
   - Watch console, you should see:
   ```
   🔒 Sending lock command to: /api/quick-actions/lock/0B7ABA31-AD7B-4AE3-8301-C4C6E6EFCE32
   Lock response status: 200
   Lock response data: {success: true, message: "Device locked successfully"}
   ```
   - Green notification should appear: "🔒 Lock command queued! Device will lock within 30 seconds."

7. **Wait 30 seconds**:
   - Agent polls every 30 seconds
   - **YOUR LAPTOP SHOULD LOCK** (Windows lock screen appears)
   - Press `Ctrl+Alt+Del` to see if you need to enter password

8. **Check Agent Log**:
   ```powershell
   Get-Content "C:\ProgramData\Lapso\agent.log" -Tail 20
   ```
   - Should show:
   ```
   [INFO] Retrieved 1 pending commands
   [INFO] Executing command: LOCK
   [INFO] Locking workstation...
   [INFO] Command completed: LOCK
   ```

### Test 2: Screenshot

1. **Click Screenshot Button** (📸)
2. **Console should show**:
   ```
   📸 Sending screenshot command to: /api/quick-actions/screenshot/...
   Screenshot response status: 200
   ```
3. **Wait 30 seconds**:
   - Agent takes screenshot
   - Uploads to server
   - UI should show screenshot in modal

### Test 3: Wipe (BE CAREFUL!)

1. **Click Wipe Button** (💣)
2. **First Dialog** should appear **ON TOP of map** (not behind it)
3. **Click "I Understand - Proceed"**
4. **Second Dialog** should appear
5. **Type**: `WIPE_CONFIRMED`
6. **Click "WIPE DEVICE NOW"**
7. **Console should show**:
   ```
   💣 Sending wipe command to: /api/quick-actions/wipe/...
   Wipe response status: 200
   ```

## 🐛 Troubleshooting:

### If Lock Button Does Nothing:

1. **Check browser console for errors**:
   - Red errors = JavaScript problem
   - 401 = Not logged in
   - 403 = Device doesn't belong to your account
   - 404 = Device not selected or doesn't exist

2. **Verify device is selected**:
   - ComboBox at top should show your device name
   - Console should show: "Using device: SUHASINI"

3. **Check if logged in**:
   - Try refreshing page
   - Login again

4. **Check agent is running**:
   ```powershell
   Get-Process -Name "powershell" | Where-Object {$_.CommandLine -like "*lapso*"}
   ```

### If Lock Button Works But Device Doesn't Lock:

1. **Check agent log**:
   ```powershell
   Get-Content "C:\ProgramData\Lapso\agent.log" -Tail 30
   ```

2. **Look for**:
   - "Retrieved X pending commands" (should be > 0)
   - "Executing command: LOCK"
   - "Command completed: LOCK"

3. **If no commands retrieved**:
   - Agent might not be polling
   - Server might have restarted and cleared queue

4. **Restart agent**:
   ```powershell
   # Stop
   Get-ScheduledTask -TaskName "LAPSO Agent" | Stop-ScheduledTask
   
   # Start
   Get-ScheduledTask -TaskName "LAPSO Agent" | Start-ScheduledTask
   ```

## 📊 Quick Health Check:

Run this to verify everything:
```powershell
.\test-lock-command.ps1
```

## 🎯 Expected End Result:

When you click Lock button:
1. ✅ Browser console shows successful API call
2. ✅ Green notification appears
3. ✅ Within 30 seconds, **your laptop locks** (Windows lock screen)
4. ✅ Agent log shows command execution

---

**If it still doesn't work, share**:
1. Browser console output (copy/paste the logs)
2. Agent log last 30 lines
3. Screenshot of any error messages
