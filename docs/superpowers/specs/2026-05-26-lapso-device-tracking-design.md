# LAPSO — Device Tracking System

**Version:** 1.0.0  
**Date:** 2026-05-26  
**Status:** Approved

## 1. Vision

Premium device tracking that beats Windows Find My Device, Apple Find My, Prey/Cerberus. Real-time sub-meter location, offline finding via crowd BLE network, AI anti-theft detection, device health monitoring, enterprise team management. Neubrutalism UI with animations. E2E encryption where user holds keys.

**Differentiators:**
- Signal Clone E2E encryption — server cannot decrypt location data
- Offline Finding Network — crowd-sourced Bluetooth relays
- Anti-theft AI — pattern detection + auto evidence capture
- Unified dashboard — personal + business, web + mobile

## 2. Design Language

**Neubrutalism + Motion:**
- Bold 3px borders, 4px 4px 0 sharp shadows, 0px radius
- High contrast, saturated palette: `#FF6B6B` primary, `#4ECDC4` secondary, `#FFE66D` accent, `#2D3436` dark
- Typography: Space Grotesk heads, Inter body, JetBrains Mono code
- Blob character illustrations for device states
- Phosphor Icons (bold)
- Framer Motion: snappy 100-300ms, spring for emphasis

## 3. Architecture

### Services
| Service | Tech | Responsibility |
|---------|------|----------------|
| Auth Service | Node.js/TS | Users, JWT, E2E key exchange, OAuth2, TOTP |
| Location Service | Rust | GPS/WiFi/Cell fusion, geofencing, real-time streaming |
| Device Service | Go | Device registry, health telemetry, remote commands |
| Notification Service | Elixir/Phoenix | FCM/APNs push, email, SMS |
| Offline Finding Service | Rust + libp2p | Crowd BLE network, beacon management, DHT |
| WebSocket Gateway | Node.js/Socket.io | Real-time dashboard updates |
| API Gateway | Kong | Auth, rate limiting, routing |

### Data Stores
| Store | Data | Encryption |
|-------|------|------------|
| PostgreSQL | Users, devices, teams, audit logs | AES-256 at rest |
| TimescaleDB | Location history | Encrypted coordinates |
| Redis | Sessions, rate limits, pub/sub | In-transit only |
| S3/MinIO | Evidence captures | Client-side encrypted |

### Event Bus: Kafka (Confluent)

## 4. Features

### Personal
- Real-time location (GPS+WiFi+Cell fusion)
- Location history with heatmap
- Offline finding via crowd BLE network
- Geofencing with enter/exit alerts
- Anti-theft AI detection
- Auto evidence capture (screenshot, cam photo)
- Device health telemetry
- Remote lock/unlock/wipe/alarm/message
- Privacy zones

### Enterprise
- Team management with roles (Admin, Manager, Member)
- Device assignment & accountability
- Full audit logging
- Bulk actions
- Organization hierarchy
- SSO (SAML/OAuth2/LDAP)
- Compliance export

### Offline Finding Network
- Lost device broadcasts encrypted rotating BLE beacon
- Nearby LAPSO apps relay encrypted location to cloud
- ECDH key exchange per beacon cycle
- Dedicated BLE beacons for critical zones

## 5. Security

- User-controlled encryption keys (Signal protocol)
- Private keys derived from password via Argon2
- Server stores only encrypted key shards
- Recovery via social recovery or backup phrase
- Privacy zones pause tracking
- 30-day auto-delete location history (configurable)

## 6. API Design

### REST
```
Auth:    POST register/login/logout/refresh, 2fa/setup, 2fa/verify, key/exchange
Devices: GET/POST /devices, GET/PUT/DELETE /devices/:id, /devices/:id/commands, /health, /locations
Location: GET /locations/current, /locations/history, POST /locations/geofence
Geofences: GET/POST/PUT/DELETE /geofences
Teams: GET/POST/PUT/DELETE /teams, /teams/:id/members
Audit: GET /audit/logs, /audit/logs/:id
Beacons: GET/POST/PUT/DELETE /beacons
```

### WebSocket Events
```
Client→Server: subscribe:device, unsubscribe:device
Server→Client: location:update, device:status, alert:geofence, alert:theft, command:result
```

## 7. Device Agent

### Platforms: Windows, macOS, Linux (Rust), Android (Kotlin), iOS (Swift)

### Behavior
- GPS every 30s moving, WiFi/Cell every 5min idle
- Adaptive frequency based on battery
- BLE beacon 500ms, encryption rotates 15min
- Anti-theft triggers: 3 failed unlocks, offline after 11PM, >100km jump, SIM removed, airplane mode

## 8. Frontend

### Stack
- Next.js 14 App Router, Tailwind CSS + custom neubrutalism
- Framer Motion, Lottie illustrations, Three.js
- Zustand + React Query, Socket.io, Leaflet + Mapbox

### Screens
| Screen | Route |
|--------|-------|
| Dashboard | `/` — live map, device grid, alerts |
| Device Detail | `/devices/[id]` — location, health, commands, evidence |
| Location History | `/devices/[id]/history` — timeline, heatmap |
| Geofencing | `/geofences` — zone editor, alert rules |
| Offline Map | `/find` — crowd network, signal finder |
| Team | `/team` — members, roles, audit |
| Organization | `/org` — hierarchy |
| Beacons | `/beacons` — provision, locate |
| Settings | `/settings` — profile, security, keys |
| Onboarding | `/welcome` — guided setup |

### Component States
DeviceCard: online (green glow, happy blob), offline (gray, worried blob), lost (red pulse, scared blob), low battery (yellow, tired blob), locked (purple tint, padlock)

## 9. Phases

1. **Foundation:** Auth + E2E keys, device registry, basic tracking, web dashboard
2. **Real-time:** WebSocket, live map, geofencing engine
3. **Anti-theft:** AI detection, evidence capture, alert escalation
4. **Offline:** BLE crowd network, beacons, signal visualization
5. **Enterprise:** Teams, SSO, audit, bulk actions, org hierarchy

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Location accuracy | <5m indoors, <2m outdoors |
| Real-time latency | <500ms device→dashboard |
| Battery impact | <3%/hour active tracking |
| Offline finding | >80% within 24 hours |
| Uptime | 99.9% |