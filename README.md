# LAPSO — Device Tracking System

<div align="center">

**Real-time laptop & device tracking with privacy-first encryption.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-red)](https://orm.drizzle.team)
[![SQLite](https://img.shields.io/badge/SQLite-latest-blue)](https://sqlite.org)

</div>

---

## Features

### Core Tracking
- **Real-time GPS** — GPS + WiFi + Cell + BLE fusion, sub-meter accuracy, live updates every second
- **Offline Finding** — Crowd-sourced Bluetooth network finds devices even when offline via BLE beacon mesh
- **Live Map** — Leaflet-powered map with all device locations, animated markers, fit-to-bounds

### Security
- **Anti-Theft AI** — Detects theft patterns:陌生 location, unusual movement, rapid movement, foreign WiFi, SIM removal, airplane mode, mass unlock attempts, device wipe
- **E2E Encryption** — Signal-level encryption. Private keys never leave device. Server stores only encrypted shards.
- **Geofencing** — Custom zones with instant enter/exit alerts. Privacy zones pause tracking inside safe areas.
- **Evidence Capture** — Auto-screenshots, camera captures, audio, location dumps on threat detection

### Device Health
- Battery level + charging state, storage usage, last seen timestamp
- WiFi SSID visibility, IP address logging, agent version tracking

### Team & Enterprise
- **Team management** — Invite members with roles (owner/admin/manager/member), remove members
- **Audit logs** — Full action history per user, device, team with IP + user-agent tracking
- **Data export** — Download all your data as JSON: users, devices, locations, geofences, teams

### Architecture
- Event-driven — commands fan out to device agents, threat alerts emit WebSocket events
- No external DB dependency — runs on local SQLite

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Framer Motion |
| UI | Neubrutalism design system — 3px borders, 4px 4px 0 shadows, Phosphor Icons |
| Backend | Next.js API Routes, Drizzle ORM |
| Database | SQLite (better-sqlite3) — zero config |
| Real-time | Socket.IO via custom `socket-server` lib |
| Auth | JWT (Access + Refresh tokens), TOTP 2FA, agent tokens |
| Map | Leaflet + react-leaflet (OpenStreetMap tiles) |
| Encryption | Web Crypto API — RSA/EC keypairs, AES-GCM hybrid encryption |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    LAPSO Frontend                        │
│  Next.js App Router / (dashboard) / (auth)              │
└──────────────────────┬──────────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                   LAPSO API Routes                       │
│  /api/auth/*  /api/devices/*  /api/geo*  /api/alert*   │
│  /api/ingest/*  /api/team/*  /api/beacons/*            │
└──────┬──────────────────────────┬───────────────────────┘
       │ Drizzle ORM              │ Socket.IO
┌──────▼──────┐           ┌───────▼───────┐
│   SQLite    │           │ Socket Server  │
│  (lapso.db) │           │  (in-process)  │
└─────────────┘           └───────────────┘
                                  │
                         ┌────────▼────────┐
                         │ LAPSO Agent      │
                         │ (device-node)    │
                         │ Location ingest  │
                         │ Health reports   │
                         │ Threat telemetry │
                         └─────────────────┘
```

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/Jithendra123892/lapso.git
cd LAPSO
npm install
```

### 2. Start the dev server

```bash
npm run dev
# Open http://localhost:3000
```

> **No database setup needed.** LAPSO uses local SQLite at `./lapso.db`. First request auto-creates tables.

### 3. Create an account

Navigate to `/register`, enter name/email/password. No email verification required in dev mode.

### 4. Add your first device

1. Go to **Dashboard** → **Add Device**
2. Choose name, type (laptop/phone/tablet/desktop), and OS
3. Copy the **device ID** shown after creation

### 5. Install the agent (optional — needs live data)

```bash
cd agents/device-node
npm install --legacy-peer-deps
npm run build

# Run with your token from Settings → Agents
node dist/index.js \
  --server-url http://localhost:3000 \
  --token YOUR_AGENT_TOKEN
```

First run saves config to `~/.lapso/agent.json`. Subsequent runs reuse it.

---

## Environment Variables

```env
# Optional — leave blank to use local SQLite default
DATABASE_URL=                    # not needed, dev uses ./lapso.db
JWT_ACCESS_SECRET=                # auto-generated if missing
JWT_REFRESH_SECRET=               # auto-generated if missing
```

---

## API Routes

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account + E2E keypair |
| POST | `/api/auth/login` | Login, returns JWT pair |
| POST | `/api/auth/refresh` | Rotate refresh token |
| POST | `/api/auth/logout` | Revoke refresh token |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/auth/agent-token` | Generate device agent auth token |
| POST | `/api/auth/key/regenerate` | Regenerate E2E keypair |

### Devices
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/devices` | List user's devices |
| POST | `/api/devices` | Register new device |
| GET | `/api/devices/[id]` | Device detail + recent locations |
| PUT | `/api/devices/[id]` | Update device metadata |
| DELETE | `/api/devices/[id]` | Remove device |
| POST | `/api/devices/[id]/commands` | Send command (lock/unlock/wipe/alarm) |
| GET | `/api/devices/[id]/commands` | Command history |
| GET | `/api/devices/[id]/locations` | Location history |
| GET | `/api/devices/[id]/health` | Health snapshot |
| POST | `/api/devices/batch-commands` | Fan-out command to multiple devices |

### Location Ingest
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ingest/location` | Agent reports location + threat telemetry |
| POST | `/api/ingest/health` | Agent reports device health |

### Geofences
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/geofences` | List user's geofences |
| POST | `/api/geofences` | Create geofence |
| GET | `/api/geofences/[id]` | Geofence detail |
| PUT | `/api/geofences/[id]` | Update geofence |
| DELETE | `/api/geofences/[id]` | Delete geofence |
| GET | `/api/geofences/check` | Check proximity trigger status |

### Alerts
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/alerts` | List alerts (with `?unread=true` filter) |
| POST | `/api/alerts` | Create alert (internal) |
| GET | `/api/alerts/[id]` | Alert detail |
| PUT | `/api/alerts/[id]` | Mark read / update |
| DELETE | `/api/alerts/[id]` | Dismiss alert |

### Teams
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/team` | Get user's team + members |
| POST | `/api/team/invite` | Invite user to team |
| DELETE | `/api/team/members/[id]` | Remove member |

### Other
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/audit` | Audit log with filters |
| GET | `/api/export` | Download all user data as JSON |
| GET | `/api/beacons` | List BLE beacons |
| POST | `/api/beacons` | Register BLE beacon |
| GET | `/api/evidence` | List evidence for device/alert |

---

## Threat Detection Types

The anti-theft engine detects these threat patterns from agent telemetry:

| Threat | Severity | Trigger |
|--------|----------|---------|
| `foreign_location` | critical | Detected in country/area never seen before |
| `unusual_movement` | high | Speed impossible by foot (>80 km/h sustained) |
| `rapid_movement` | medium | Fast movement combined with heading changes |
| `unknown_wifi` | warning | Connected to WiFi network never seen before |
| `sim_removed` | critical | SIM card physically removed |
| `airplane_mode` | high | Device entered airplane mode |
| `mass_unlock_attempts` | critical | Multiple failed unlock attempts |
| `device_wiped` | critical | Remote wipe command executed |

---

## Design System

Neubrutalism style used throughout. Key tokens:

```css
/* Colors */
--color-primary:    #A855F7   /* purple */
--color-secondary:  #4ECDC4   /* teal */
--color-accent:    #FFE66D   /* yellow */
--color-danger:    #FF6B6B   /* red */
--color-dark:      #2D3436   /* near-black border */
--color-surface:   #F5F5F0   /* off-white card bg */

/* Typography */
font-heading: 'Space Grotesk', sans-serif  /* headings */
font-body: system-ui                           /* body */
font-mono: 'JetBrains Mono', monospace         /* data/code */

/* Borders & Shadows (neo-brutalist) */
border-width: 3px
border-color: var(--color-dark)
border-radius: 0px     /* never rounded */
box-shadow: 4px 4px 0 0 var(--color-dark)   /* sharp drop shadow */
```

Animation guidelines: `150–300ms` for micro-interactions, `400ms` max for transitions. Prefer CSS keyframes over JS-driven animations for background ambient effects.

---

## File Structure

```
src/
├── app/
│   ├── (auth)/           # Login, register pages
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── dashboard/
│   │   ├── devices/
│   │   ├── geofences/
│   │   ├── alerts/
│   │   ├── team/
│   │   ├── settings/
│   │   └── ...
│   └── api/
│       ├── auth/
│       ├── devices/
│       ├── geofences/
│       ├── ingest/
│       └── ...
├── components/
│   ├── devices/           # DeviceCard, DeviceHealth, DeviceGrid
│   ├── geofences/        # GeofenceCard, GeofenceMapPicker
│   ├── layout/           # Sidebar, Header
│   ├── illustrations/    # BlobDevice (animated SVG mascot)
│   └── map/              # LiveMap, LocationMarker
├── lib/
│   ├── auth/             # JWT helpers, password, middleware
│   ├── crypto/           # E2E keypair generation
│   ├── db/
│   │   ├── schema.ts     # Drizzle table definitions
│   │   └── index.ts      # DB client (SQLite)
│   ├── anti-theft.ts     # Threat detection logic
│   ├── socket-server.ts  # Socket.IO server
│   └── utils.ts          # timeAgo, etc.
└── styles/
    └── globals.css       # CSS variables, neubrutalist tokens

agents/
└── device-node/         # Node.js device agent
    └── README.md         # Agent setup instructions
```

---

## Deployment

### Vercel (recommended)

```bash
npm install
git push to Vercel — auto-deploys
```

For production SQLite → switch to Turso or LibSQL:

```ts
// drizzle.config.ts
dialect: 'sqlite'
dbCredentials: { url: process.env.DATABASE_URL }  // turso:// or file:
```

### Railway / Render

```bash
# Set start command
npm run build && npm start

# Environment
DATABASE_URL=file:./lapso.db
```

---

## License

MIT — Jithendra123892