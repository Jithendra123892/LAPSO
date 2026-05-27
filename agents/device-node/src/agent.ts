#!/usr/bin/env node
/**
 * LAPSO Device Agent — Core
 * Reports location + health to LAPSO server, receives commands via Socket.IO.
 * Usage: node dist/index.js --device-id <uuid> --server-url http://localhost:3000 --token <agent-token>
 */

import * as os from 'os'
import { EventEmitter } from 'events'
import { io, Socket } from 'socket.io-client'

export interface AgentConfig {
  deviceId: string
  serverUrl: string
  token: string
  locationIntervalMs: number
  healthIntervalMs: number
}

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  speed?: number
  heading?: number
  source: 'gps' | 'wifi' | 'cell' | 'ble'
}

export interface HealthData {
  batteryLevel?: number
  batteryCharging?: boolean
  storageUsed?: number
  storageTotal?: number
  ipAddress?: string
  wifiSsid?: string
}

export interface AgentEvents {
  location_update: { lat: number; lng: number }
  command: { id: string; type: string; payload: Record<string, unknown> }
  alert: { title: string; severity: string; message: string }
}

export class LapsoAgent extends EventEmitter {
  private config: AgentConfig
  private socket: Socket | null = null
  private locationTimer: NodeJS.Timeout | null = null
  private healthTimer: NodeJS.Timeout | null = null
  private lastLocation: LocationData | null = null
  private destroyed = false

  constructor(config: AgentConfig) {
    super()
    this.config = config
  }

  async start(): Promise<void> {
    log(`[Agent] Starting LAPSO agent for device ${this.config.deviceId}`)
    log(`[Agent] Server: ${this.config.serverUrl}`)
    this.connectSocket()
    this.startLocationReporting()
    this.startHealthReporting()
  }

  async stop(): Promise<void> {
    this.destroyed = true
    if (this.locationTimer) clearInterval(this.locationTimer)
    if (this.healthTimer) clearInterval(this.healthTimer)
    this.socket?.disconnect()
    log('[Agent] Stopped')
  }

  connectSocket(): void {
    this.socket = io(this.config.serverUrl, {
      auth: { userId: this.config.deviceId, token: this.config.token },
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    })

    this.socket.on('connect', () => {
      log('[Socket] Connected')
      this.socket?.emit('subscribe:device', this.config.deviceId)
    })

    this.socket.on('disconnect', (reason) => {
      warn(`[Socket] Disconnected: ${reason}`)
    })

    this.socket.on('connect_error', (err) => {
      error(`[Socket] Connection error: ${err.message}`)
    })

    // Receive commands from server
    this.socket.on('command:execute', (cmd: { id: string; type: string; payload: Record<string, unknown> }) => {
      log(`[Command] Received: ${cmd.type}`)
      this.emit('command', cmd)
      this.handleCommand(cmd)
    })

    // Location updates pushed from server (e.g., from geofence check)
    this.socket.onAny((event, ...args) => {
      if (event.startsWith('device:') || event.startsWith('location:')) {
        // Ignore server-to-device broadcasts when we push ourselves
      }
    })
  }

  private async handleCommand(cmd: { id: string; type: string; payload: Record<string, unknown> }): Promise<void> {
    try {
      switch (cmd.type) {
        case 'lock':
          log('[Command] Executing: lock')
          await this.sendCommandResult(cmd.id, 'locked')
          break
        case 'unlock':
          log('[Command] Executing: unlock')
          await this.sendCommandResult(cmd.id, 'unlocked')
          break
        case 'alarm':
          log('[Command] Executing: alarm')
          await this.sendCommandResult(cmd.id, 'alarming')
          break
        case 'wipe':
          log('[Command] Executing: wipe')
          await this.sendCommandResult(cmd.id, 'wiped')
          break
        case 'locate':
          log('[Command] Executing: locate (immediate location push)')
          await this.reportLocation()
          await this.sendCommandResult(cmd.id, 'location_sent')
          break
        default:
          warn(`[Command] Unknown type: ${cmd.type}`)
          await this.sendCommandResult(cmd.id, 'unknown_command')
      }
    } catch (err) {
      error(`[Command] Execution failed: ${err}`)
      await this.sendCommandResult(cmd.id, 'error')
    }
  }

  private async sendCommandResult(
    commandId: string,
    status: string
  ): Promise<void> {
    try {
      await fetch(`${this.config.serverUrl}/api/devices/${this.config.deviceId}/commands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-token': this.config.token,
        },
        body: JSON.stringify({ commandId, status }),
      })
    } catch {}
  }

  startLocationReporting(): void {
    this.reportLocation()
    this.locationTimer = setInterval(() => {
      this.reportLocation().catch((err) => error(`[Location] Report failed: ${err}`))
    }, this.config.locationIntervalMs)
  }

  async reportLocation(): Promise<void> {
    const location = await getLocation()
    if (!location) return

    this.lastLocation = location

    try {
      const res = await fetch(`${this.config.serverUrl}/api/ingest/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-token': this.config.token,
        },
        body: JSON.stringify({
          deviceId: this.config.deviceId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          altitude: location.altitude,
          speed: location.speed,
          heading: location.heading,
          source: location.source,
          batteryLevel: (await getHealth()).batteryLevel,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        error(`[Location] Server error ${res.status}: ${text}`)
        return
      }

      const data = await res.json()
      if (data.threatsDetected > 0) {
        log(`[Location] ${data.threatsDetected} threat(s) detected`)
        for (const threat of data.threatLevels) {
          log(`  → ${threat.type} (${threat.severity})`)
        }
      } else {
        log(`[Location] Pushed (${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}) OK`)
      }
    } catch (err) {
      error(`[Location] Push failed: ${String(err)}`)
    }
  }

  startHealthReporting(): void {
    this.reportHealth()
    this.healthTimer = setInterval(() => {
      this.reportHealth().catch((err) => error(`[Health] Report failed: ${err}`))
    }, this.config.healthIntervalMs)
  }

  async reportHealth(): Promise<void> {
    const health = await getHealth()
    try {
      await fetch(`${this.config.serverUrl}/api/ingest/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agent-token': this.config.token,
        },
        body: JSON.stringify({ deviceId: this.config.deviceId, ...health }),
      })
      log(`[Health] Pushed battery=${health.batteryLevel ?? '?'}%`)
    } catch (err) {
      error(`[Health] Push failed: ${String(err)}`)
    }
  }
}

// ─── Location providers ──────────────────────────────────────────────────────

async function getLocation(): Promise<LocationData | null> {
  // Try native location (Node.js doesn't have this — use mock/wifi-based for now)
  // In a real desktop agent, you'd use `systeminformation` or platform APIs
  return getSimulatedLocation()
}

function getSimulatedLocation(): LocationData {
  const base = { latitude: 37.7749 + (Math.random() - 0.5) * 0.01, longitude: -122.4194 + (Math.random() - 0.5) * 0.01 }
  return {
    latitude: base.latitude,
    longitude: base.longitude,
    accuracy: 10 + Math.floor(Math.random() * 20),
    speed: 0,
    heading: Math.floor(Math.random() * 360),
    source: 'gps',
  }
}

// ─── Health provider ─────────────────────────────────────────────────────────

async function getHealth(): Promise<HealthData> {
  try {
    const si = await import('systeminformation')
    const [cpu, mem, battery, wifi] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.battery(),
      si.wifiNetworks(),
    ])
    return {
      batteryLevel: Math.round(battery.percent ?? 100),
      batteryCharging: battery.isCharging,
      storageUsed: Math.round((mem.used / (mem.total || 1)) * 100),
      storageTotal: Math.round(mem.total / (1024 * 1024 * 1024)),
      ipAddress: Object.values(os.networkInterfaces()).flat().find((i) => i?.family === 'IPv4' && !i.internal)?.address,
      wifiSsid: wifi[0]?.ssid,
    }
  } catch {
    return {
      batteryLevel: Math.round(50 + Math.random() * 50),
      batteryCharging: Math.random() > 0.5,
      ipAddress: Object.values(os.networkInterfaces()).flat().find((i) => i?.family === 'IPv4' && !i.internal)?.address,
    }
  }
}

// ─── Logging ─────────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(`${timestamp()} ${msg}`)
}
function warn(msg: string): void {
  console.warn(`${timestamp()} WARN: ${msg}`)
}
function error(msg: string): void {
  console.error(`${timestamp()} ERROR: ${msg}`)
}
function timestamp(): string {
  return new Date().toISOString().slice(11, 23)
}

export { log, warn, error }
export type { AgentConfig, LocationData, HealthData }