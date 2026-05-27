# LAPSO Device Agent Setup Guide

## Quick Start

```bash
cd agents/device-node
npm install --legacy-peer-deps
npm run build

# Run agent
node dist/index.js \
  --server-url http://localhost:3000 \
  --token YOUR_AGENT_TOKEN
```

## Generate Agent Token

1. Open LAPSO → Settings → Agents
2. Click "Generate Agent Token"
3. Copy the token
4. Run the agent with `--token <copied-token>`

## CLI Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--device-id` | `-d` | auto | Device UUID (auto-generated and saved) |
| `--server-url` | `-s` | `http://localhost:3000` | LAPSO server URL |
| `--token` | `-t` | (required) | Agent token from Settings |
| `--location-interval` | | `30000` | Location push interval (ms) |
| `--health-interval` | | `60000` | Health push interval (ms) |

## Config File

On first run, config is saved to `~/.lapso/agent.json`:
```json
{
  "deviceId": "uuid-here",
  "serverUrl": "http://localhost:3000",
  "token": "your-token"
}
```

## Platform-Specific

### Linux
```bash
# Install as systemd service
sudo tee /etc/systemd/system/lapso-agent.service > /dev/null <<EOF
[Unit]
Description=LAPSO Device Tracking Agent
After=network.target

[Service]
ExecStart=/usr/local/bin/lapso-agent --server-url http://YOUR_SERVER --token TOKEN
Restart=always
User=youruser

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl enable lapso-agent
sudo systemctl start lapso-agent
```

### Using `systeminformation` for Real Health Data

Install optional dependency for real battery/wifi data:
```bash
npm install systeminformation
```

The agent will automatically detect and use it if available.

## Device Registration

Add a device in the dashboard first:
1. LAPSO → Dashboard → Add Device
2. Copy the device UUID shown
3. Run the agent with that device ID:
```bash
node dist/index.js -d DEVICE_UUID -t TOKEN -s SERVER_URL
```

## Troubleshooting

**"Connection error"**: Check server URL and that LAPSO server is running.

**"Unauthorized"**: Token expired or incorrect. Generate a new one in Settings → Agents.

**Location not updating**: Ensure the agent has network access. Check firewall rules.

**Battery shows "?"**: Install `systeminformation` for real battery data:
```bash
npm install systeminformation
```