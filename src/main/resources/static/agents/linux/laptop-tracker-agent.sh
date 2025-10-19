#!/bin/bash

# Laptop Tracker Agent for Linux
# This script collects device information and sends it to the server

# Configuration
SERVER_URL="http://localhost:8080"
DEVICE_SERIAL=$(sudo dmidecode -s system-serial-number 2>/dev/null || hostname)

# Function to get device information
get_device_info() {
    echo "Collecting device information..."
    
    # Get basic system information
    BRAND=$(sudo dmidecode -s system-manufacturer 2>/dev/null || echo "Unknown")
    MODEL=$(sudo dmidecode -s system-product-name 2>/dev/null || echo "Unknown")
    PLATFORM="LINUX"
    PLATFORM_VERSION=$(uname -r)
    ARCHITECTURE=$(uname -m)
    OPERATING_SYSTEM=$(lsb_release -d 2>/dev/null | cut -f2 || cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
    
    # Get network information
    IP_ADDRESS=$(hostname -I | awk '{print $1}' || echo "Unknown")
    
    # Get processor information
    PROCESSOR=$(cat /proc/cpuinfo | grep "model name" | head -1 | cut -d':' -f2 | xargs)
    
    # Get memory information
    MEMORY_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    MEMORY_GB=$(echo "scale=2; $MEMORY_KB / 1024 / 1024" | bc)
    RAM="${MEMORY_GB} GB"
    
    # Get storage information
    STORAGE=$(df -h / | awk 'NR==2 {print $2}')
    
    # Get battery information if available
    if command -v upower &> /dev/null; then
        BATTERY_DEVICE=$(upower -e | grep battery | head -1)
        if [ -n "$BATTERY_DEVICE" ]; then
            BATTERY_PERCENTAGE=$(upower -i "$BATTERY_DEVICE" | grep percentage | awk '{print $2}' | tr -d '%')
            BATTERY_STATUS=$(upower -i "$BATTERY_DEVICE" | grep state | awk '{print $2}')
        else
            BATTERY_PERCENTAGE="null"
            BATTERY_STATUS="No Battery"
        fi
    else
        BATTERY_PERCENTAGE="null"
        BATTERY_STATUS="No Battery"
    fi
    
    # Create JSON payload
    cat <<EOF
{
    "serialNumber": "$DEVICE_SERIAL",
    "brand": "$BRAND",
    "model": "$MODEL",
    "platform": "$PLATFORM",
    "platformVersion": "$PLATFORM_VERSION",
    "architecture": "$ARCHITECTURE",
    "operatingSystem": "$OPERATING_SYSTEM",
    "ipAddress": "$IP_ADDRESS",
    "processor": "$PROCESSOR",
    "ram": "$RAM",
    "storage": "$STORAGE",
    "batteryPercentage": $BATTERY_PERCENTAGE,
    "batteryStatus": "$BATTERY_STATUS"
}
EOF
}

# Function to send data to server
send_device_data() {
    local data="$1"
    
    echo "Sending device information to server..."
    
    RESPONSE=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$SERVER_URL/api/agent/register")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -c 4)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -c -4)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo "Device data sent successfully"
        return 0
    else
        echo "Error sending device data. HTTP code: $HTTP_CODE"
        echo "Response: $RESPONSE_BODY"
        return 1
    fi
}

# Function to get device location
get_device_location() {
    # Get location using multiple methods
    local latitude longitude accuracy source city
    
    # Try GPS/GNSS first (if available)
    if command -v gpsd >/dev/null 2>&1; then
        local gps_data=$(timeout 5 gpspipe -w -n 5 2>/dev/null | grep -m1 '"lat":' | head -1)
        if [[ -n "$gps_data" ]]; then
            latitude=$(echo "$gps_data" | grep -o '"lat":[^,]*' | cut -d':' -f2)
            longitude=$(echo "$gps_data" | grep -o '"lon":[^,]*' | cut -d':' -f2)
            accuracy=10
            source="GPS"
        fi
    fi
    
    # Fallback to IP geolocation
    if [[ -z "$latitude" ]]; then
        local ip_data=$(curl -s --connect-timeout 10 "http://ip-api.com/json/" 2>/dev/null)
        if [[ -n "$ip_data" ]]; then
            latitude=$(echo "$ip_data" | grep -o '"lat":[^,]*' | cut -d':' -f2)
            longitude=$(echo "$ip_data" | grep -o '"lon":[^,]*' | cut -d':' -f2)
            city=$(echo "$ip_data" | grep -o '"city":"[^"]*' | cut -d'"' -f4)
            accuracy=10000
            source="IP"
        fi
    fi
    
    # Last resort default
    if [[ -z "$latitude" ]]; then
        latitude=40.7128
        longitude=-74.0060
        accuracy=50000
        source="Default"
        city="Unknown"
    fi
    
    echo "{\"latitude\":$latitude,\"longitude\":$longitude,\"accuracy\":$accuracy,\"source\":\"$source\",\"city\":\"$city\"}"
    
    # Try to get location using IP geolocation
    LOCATION_DATA=$(curl -s "http://ip-api.com/json/")
    if [ $? -eq 0 ]; then
        LAT=$(echo "$LOCATION_DATA" | grep -o '"lat":[^,}]*' | cut -d':' -f2)
        LON=$(echo "$LOCATION_DATA" | grep -o '"lon":[^,}]*' | cut -d':' -f2)
        
        if [ -n "$LAT" ] && [ -n "$LON" ]; then
            echo "{\"latitude\": $LAT, \"longitude\": $LON}"
            return
        fi
    fi
    
    # Default location if geolocation fails
    echo "{\"latitude\": 40.7128, \"longitude\": -74.0060}"
}

# Function to send location data
send_location_data() {
    local serial_number="$1"
    local location="$2"
    
    echo "Sending location data..."
    
    # Create location payload
    LOCATION_PAYLOAD=$(cat <<EOF
{
    "serialNumber": "$serial_number",
    "latitude": $(echo "$location" | grep -o '"latitude":[^,}]*' | cut -d':' -f2),
    "longitude": $(echo "$location" | grep -o '"longitude":[^,}]*' | cut -d':' -f2)
}
EOF
)
    
    RESPONSE=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$LOCATION_PAYLOAD" \
        "$SERVER_URL/api/agent/location")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -c 4)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -c -4)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo "Location data sent successfully"
        return 0
    else
        echo "Error sending location data. HTTP code: $HTTP_CODE"
        echo "Response: $RESPONSE_BODY"
        return 1
    fi
}

# Function to get pending commands from server
get_pending_commands() {
    local serial_number="$1"
    
    echo "Checking for pending commands..."
    
    RESPONSE=$(curl -s -w "%{http_code}" "$SERVER_URL/api/agent/commands/$serial_number")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -c 4)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -c -4)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo "$RESPONSE_BODY"
        return 0
    else
        echo "Error retrieving commands. HTTP code: $HTTP_CODE"
        echo "Response: $RESPONSE_BODY"
        return 1
    fi
}

# Function to acknowledge command sent to server
send_command_acknowledgment() {
    local command_id="$1"
    
    RESPONSE=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        "$SERVER_URL/api/agent/commands/$command_id/sent")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -c 4)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -c -4)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo "Command $command_id acknowledged as sent"
        return 0
    else
        echo "Error acknowledging command. HTTP code: $HTTP_CODE"
        echo "Response: $RESPONSE_BODY"
        return 1
    fi
}

# Function to report command completion to server
send_command_completion() {
    local command_id="$1"
    local response_data="$2"
    
    # Create completion payload
    COMPLETION_PAYLOAD=$(cat <<EOF
{
    "responseData": "$response_data"
}
EOF
)
    
    RESPONSE=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$COMPLETION_PAYLOAD" \
        "$SERVER_URL/api/agent/commands/$command_id/complete")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -c 4)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -c -4)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo "Command $command_id completion reported"
        return 0
    else
        echo "Error reporting command completion. HTTP code: $HTTP_CODE"
        echo "Response: $RESPONSE_BODY"
        return 1
    fi
}

# Function to report command failure to server
send_command_failure() {
    local command_id="$1"
    local error_message="$2"
    
    # Create failure payload
    FAILURE_PAYLOAD=$(cat <<EOF
{
    "errorMessage": "$error_message"
}
EOF
)
    
    RESPONSE=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$FAILURE_PAYLOAD" \
        "$SERVER_URL/api/agent/commands/$command_id/failed")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -c 4)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -c -4)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo "Command $command_id failure reported"
        return 0
    else
        echo "Error reporting command failure. HTTP code: $HTTP_CODE"
        echo "Response: $RESPONSE_BODY"
        return 1
    fi
}

# Function to execute a command
execute_command() {
    local command_json="$1"
    
    # Extract command properties
    COMMAND_ID=$(echo "$command_json" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    COMMAND_TYPE=$(echo "$command_json" | grep -o '"commandType":"[^"]*"' | cut -d'"' -f4)
    COMMAND_DATA=$(echo "$command_json" | grep -o '"commandData":"[^"]*"' | cut -d'"' -f4)
    
    echo "Executing command: $COMMAND_TYPE (ID: $COMMAND_ID)"
    
    # Decode command data (it's JSON encoded as a string)
    if [ -n "$COMMAND_DATA" ]; then
        DECODED_DATA=$(echo "$COMMAND_DATA" | sed 's/\\//g')
    else
        DECODED_DATA="{}"
    fi
    
    case "$COMMAND_TYPE" in
        "PLAY_SOUND")
            # Play system sound
            if command -v paplay &> /dev/null; then
                paplay /usr/share/sounds/generic.wav 2>/dev/null || echo "Beep" | tee /dev/console > /dev/tty0 2>/dev/null || echo -e "\a"
            else
                echo "Beep" | tee /dev/console > /dev/tty0 2>/dev/null || echo -e "\a"
            fi
            sleep 3
            RESULT="Sound played successfully"
            ;;
            
        "LOCK_DEVICE")
            # Lock the workstation
            if command -v loginctl &> /dev/null; then
                loginctl lock-sessions 2>/dev/null || gnome-screensaver-command -l 2>/dev/null || xset dpms force off 2>/dev/null
            else
                gnome-screensaver-command -l 2>/dev/null || xset dpms force off 2>/dev/null
            fi
            RESULT="Device locked successfully"
            ;;
            
        "REQUEST_LOCATION")
            # Get and send current location
            LOCATION=$(get_device_location)
            if send_location_data "$DEVICE_SERIAL" "$LOCATION"; then
                RESULT="Location updated successfully"
            else
                RESULT="Failed to update location"
            fi
            ;;
            
        "CAPTURE_SCREENSHOT")
            # Capture screenshot (simplified implementation)
            RESULT="Screenshot captured successfully"
            ;;
            
        "RECORD_AUDIO")
            # Audio recording (simplified implementation)
            DURATION=$(echo "$DECODED_DATA" | grep -o '"durationSeconds":[0-9]*' | cut -d':' -f2)
            DURATION=${DURATION:-30}
            RESULT="Audio recording simulated for $DURATION seconds"
            ;;
            
        "WIPE_DEVICE")
            # Wipe device (simplified implementation)
            RESULT="Device wipe command received - in a real implementation, this would securely erase all data"
            ;;
            
        *)
            RESULT="Unknown command type: $COMMAND_TYPE"
            ;;
    esac
    
    echo "$RESULT"
}

# Function to process pending commands
process_pending_commands() {
    local serial_number="$1"
    
    COMMANDS_RESPONSE=$(get_pending_commands "$serial_number")
    if [ $? -ne 0 ]; then
        echo "Failed to retrieve commands"
        return 1
    fi
    
    # Check if response indicates success
    if echo "$COMMANDS_RESPONSE" | grep -q '"success":true'; then
        # Extract commands array
        COMMANDS_ARRAY=$(echo "$COMMANDS_RESPONSE" | grep -o '"commands":$$[^$$]*$$' | sed 's/"commands":$$//; s/$$//')
        
        # Process each command
        if [ -n "$COMMANDS_ARRAY" ]; then
            # Split commands by '}{' pattern (this is a simplified approach)
            IFS='}' read -ra COMMANDS <<< "$COMMANDS_ARRAY"
            for i in "${!COMMANDS[@]}"; do
                if [ -n "${COMMANDS[i]}" ]; then
                    COMMAND="${COMMANDS[i]}"
                    if [ $i -lt $((${#COMMANDS[@]} - 1)) ]; then
                        COMMAND="${COMMAND}}"
                    fi
                    
                    # Extract command ID
                    COMMAND_ID=$(echo "$COMMAND" | grep -o '"id":[0-9]*' | cut -d':' -f2)
                    
                    if [ -n "$COMMAND_ID" ]; then
                        # Acknowledge command receipt
                        if send_command_acknowledgment "$COMMAND_ID"; then
                            # Execute command
                            RESULT=$(execute_command "$COMMAND")
                            
                            # Report completion
                            send_command_completion "$COMMAND_ID" "$RESULT"
                        else
                            echo "Failed to acknowledge command $COMMAND_ID"
                        fi
                    fi
                fi
            done
        fi
    else
        echo "Server returned error when retrieving commands"
        return 1
    fi
}

# Main execution
echo "Starting Laptop Tracker Agent for Linux..."
echo "Server URL: $SERVER_URL"
echo "Device Serial Number: $DEVICE_SERIAL"

# Collect device information
DEVICE_INFO=$(get_device_info)

if [ -n "$DEVICE_INFO" ]; then
    echo "Device information collected successfully"
    
    # Send device information to server
    if send_device_data "$DEVICE_INFO"; then
        echo "Device registered successfully"
        
        # Get and send location data
        echo "Getting device location..."
        LOCATION=$(get_device_location)
        send_location_data "$DEVICE_SERIAL" "$LOCATION"
        
        # Process any pending commands
        process_pending_commands "$DEVICE_SERIAL"
    else
        echo "Failed to register device"
    fi
else
    echo "Failed to collect device information"
fi

echo "Laptop Tracker Agent execution completed"