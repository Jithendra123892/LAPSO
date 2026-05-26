/**
 * Anti-theft detection engine.
 * Rule-based pattern detection for suspicious device behavior.
 * Triggers: 3 failed unlocks, offline after 11PM, >100km jump, SIM removed, airplane mode.
 */

export interface DeviceContext {
  deviceId: string
  userId: string
  status: string
  lastLatitude?: number | null
  lastLongitude?: number | null
  lastSeenAt?: Date | null
  batteryLevel?: number | null
  batteryCharging?: boolean | null
  ipAddress?: string | null
  metadata?: Record<string, any>
  failedUnlockAttempts?: number
  lastFailedUnlockAt?: Date | null
  airplaneMode?: boolean
  simRemoved?: boolean
  isWiped?: boolean
}

export interface ThreatEvent {
  deviceId: string
  type: ThreatType
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  metadata: Record<string, any>
  createdAt: Date
}

export type ThreatType =
  | 'failed_unlock'
  | 'suspicious_offline'
  | 'location_jump'
  | 'sim_removed'
  | 'airplane_mode'
  | 'device_wiped'
  | 'unusual_movement'
  | '陌生的_location'

const THRESHOLDS = {
  maxFailedUnlocks: 3,
  suspiciousHourStart: 23, // 11 PM
  suspiciousHourEnd: 6,   // 6 AM
  maxJumpKm: 100,
  maxJumpSpeedKmh: 500,   // physically impossible = stolen in transit
}

export function detectThreats(
  device: DeviceContext,
  previousLocation?: { lat: number; lng: number; timestamp: Date }
): ThreatEvent[] {
  const threats: ThreatEvent[] = []
  const now = new Date()

  // 1. Failed unlock attempts
  if ((device.failedUnlockAttempts ?? 0) >= THRESHOLDS.maxFailedUnlocks) {
    threats.push({
      deviceId: device.deviceId,
      type: 'failed_unlock',
      severity: 'high',
      title: 'Multiple failed unlock attempts',
      message: `${device.failedUnlockAttempts} failed unlock attempts detected. Device may be tampered with.`,
      metadata: {
        attemptCount: device.failedUnlockAttempts,
        lastAttemptAt: device.lastFailedUnlockAt?.toISOString(),
      },
      createdAt: now,
    })
  }

  // 2. Offline during suspicious hours
  if (
    device.status === 'offline' &&
    device.lastSeenAt
  ) {
    const lastSeen = new Date(device.lastSeenAt)
    const hour = lastSeen.getHours()
    if (hour >= THRESHOLDS.suspiciousHourStart || hour < THRESHOLDS.suspiciousHourEnd) {
      threats.push({
        deviceId: device.deviceId,
        type: 'suspicious_offline',
        severity: 'medium',
        title: 'Device went offline at unusual hour',
        message: `Device offline since ${lastSeen.toLocaleTimeString()} — unusual time for this device.`,
        metadata: { lastSeenAt: lastSeen.toISOString(), hour },
        createdAt: now,
      })
    }
  }

  // 3. Impossible location jump
  if (
    previousLocation &&
    device.lastLatitude != null &&
    device.lastLongitude != null &&
    device.lastSeenAt
  ) {
    const jumpDistKm = haversine(
      previousLocation.lat, previousLocation.lng,
      device.lastLatitude, device.lastLongitude
    )
    const timeDeltaHours = (new Date(device.lastSeenAt).getTime() - previousLocation.timestamp.getTime()) / 3600000
    const impliedSpeedKmh = timeDeltaHours > 0 ? jumpDistKm / timeDeltaHours : Infinity

    if (jumpDistKm > THRESHOLDS.maxJumpKm) {
      threats.push({
        deviceId: device.deviceId,
        type: 'location_jump',
        severity: impliedSpeedKmh > THRESHOLDS.maxJumpSpeedKmh ? 'critical' : 'high',
        title: 'Impossible location jump detected',
        message: impliedSpeedKmh > THRESHOLDS.maxJumpSpeedKmh
          ? `Device jumped ${Math.round(jumpDistKm)}km in ${timeDeltaHours.toFixed(1)}h — physically impossible.`
          : `Device jumped ${Math.round(jumpDistKm)}km — verify with user.`,
        metadata: {
          jumpKm: jumpDistKm,
          timeDeltaHours: timeDeltaHours.toFixed(2),
          impliedSpeedKmh: Math.round(impliedSpeedKmh),
          fromLat: previousLocation.lat,
          fromLng: previousLocation.lng,
          toLat: device.lastLatitude,
          toLng: device.lastLongitude,
        },
        createdAt: now,
      })
    }
  }

  // 4. SIM removed
  if (device.simRemoved) {
    threats.push({
      deviceId: device.deviceId,
      type: 'sim_removed',
      severity: 'critical',
      title: 'SIM card removed',
      message: 'SIM card was removed from the device. High risk of theft.',
      metadata: { simRemoved: true },
      createdAt: now,
    })
  }

  // 5. Airplane mode
  if (device.airplaneMode) {
    threats.push({
      deviceId: device.deviceId,
      type: 'airplane_mode',
      severity: 'medium',
      title: 'Airplane mode activated',
      message: 'Device entered airplane mode. Could indicate attempt to evade tracking.',
      metadata: { airplaneMode: true },
      createdAt: now,
    })
  }

  // 6. Device wiped
  if (device.isWiped) {
    threats.push({
      deviceId: device.deviceId,
      type: 'device_wiped',
      severity: 'critical',
      title: 'Device remotely wiped',
      message: 'Device has been remotely wiped. Recovery mode limited.',
      metadata: { isWiped: true },
      createdAt: now,
    })
  }

  return threats
}

/** Compute threat level from device context — for UI display only */
export function computeOverallThreatLevel(device: DeviceContext): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  const threats = detectThreats(device)
  if (threats.length === 0) return 'none'
  const maxSeverity = threats.reduce((max, t) => {
    const order = { low: 1, medium: 2, high: 3, critical: 4 }
    return order[t.severity] > order[max] ? t.severity : max
  }, 'low' as ThreatEvent['severity'])
  return maxSeverity
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}