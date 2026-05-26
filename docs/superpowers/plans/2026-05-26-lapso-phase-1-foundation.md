# LAPSO Phase 1: Foundation MVP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Working MVP — users can register, log in, register devices, see live location on neubrutalism dashboard, send remote commands.

**Architecture:** Next.js 14 monorepo with a single server project. Backend API routes in Next.js API directory (can extract to microservices later). PostgreSQL with Drizzle ORM for users/devices. WebSocket for real-time location. JWT auth with E2E key exchange scaffolded.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL, Socket.io, Framer Motion, Zustand, React Query, Leaflet, Phosphor Icons, shadcn/ui base + neubrutalism override

---

## File Map

```
lapso/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── .env.local.example
├── drizzle.config.ts
├── docker-compose.yml
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts, providers
│   │   ├── page.tsx                # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Auth gated, sidebar nav
│   │   │   ├── dashboard/page.tsx  # Live map + device grid
│   │   │   ├── devices/
│   │   │   │   ├── page.tsx        # All devices
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx    # Device detail
│   │   │   │       └── history/page.tsx
│   │   │   ├── geofences/page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   └── security/page.tsx
│   │   │   └── welcome/page.tsx    # Onboarding
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── me/route.ts
│   │       ├── devices/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── commands/route.ts
│   │       │       ├── health/route.ts
│   │       │       └── locations/route.ts
│   │       ├── locations/
│   │       │   └── route.ts
│   │       └── socket/
│   │           └── route.ts        # WebSocket handler
│   │
│   ├── components/
│   │   ├── ui/                     # N* neubrutalism primitives
│   │   │   ├── n-button.tsx
│   │   │   ├── n-card.tsx
│   │   │   ├── n-input.tsx
│   │   │   ├── n-modal.tsx
│   │   │   ├── n-badge.tsx
│   │   │   ├── n-switch.tsx
│   │   │   ├── n-select.tsx
│   │   │   └── n-avatar.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── devices/
│   │   │   ├── device-card.tsx
│   │   │   ├── device-grid.tsx
│   │   │   ├── device-commands.tsx
│   │   │   └── device-health.tsx
│   │   ├── map/
│   │   │   ├── live-map.tsx
│   │   │   ├── location-marker.tsx
│   │   │   └── geofence-editor.tsx
│   │   ├── alerts/
│   │   │   ├── alert-list.tsx
│   │   │   └── alert-toast.tsx
│   │   └── illustrations/
│   │       ├── blob-device.tsx
│   │       └── empty-state.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts          # Drizzle schema
│   │   │   ├── index.ts           # DB connection
│   │   │   └── migrate.ts
│   │   ├── auth/
│   │   │   ├── jwt.ts             # JWT sign/verify
│   │   │   ├── middleware.ts      # Auth middleware
│   │   │   └── password.ts        # Argon2 hashing
│   │   ├── crypto/
│   │   │   └── e2e.ts             # Key generation, exchange
│   │   ├── socket/
│   │   │   └── server.ts          # Socket.io server
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-devices.ts
│   │   ├── use-locations.ts
│   │   └── use-socket.ts
│   │
│   ├── store/
│   │   └── app-store.ts           # Zustand store
│   │
│   └── styles/
│       └── globals.css            # Tailwind + neubrutalism tokens
│
├── __tests__/
│   ├── auth.test.ts
│   ├── devices.test.ts
│   └── e2e/
│       └── auth.spec.ts
│
└── public/
    ├── illustrations/
    │   ├── device-laptop.svg
    │   ├── device-phone.svg
    │   ├── empty-devices.svg
    │   └── onboarding-hero.svg
    └── sounds/
        ├── alert.mp3
        └── lock.mp3
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `.env.local.example`, `docker-compose.yml`

- [ ] **Step 1: Initialize Next.js project**

```bash
npx create-next-app@latest lapso --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

Expected: Next.js 14 project scaffolded with App Router, TypeScript, Tailwind.

- [ ] **Step 2: Install all dependencies**

```bash
cd lapso
npm install drizzle-orm postgres dotenv @next/bundle-analyzer
npm install @phosphor-icons/react framer-motion zustand @tanstack/react-query leaflet react-leaflet socket.io socket.io-client
npm install jsonwebtoken argon2 zod uuid
npm install -D drizzle-kit @types/jsonwebtoken @types/leaflet vitest @testing-library/react @testing-library/jest-dom jsdom playwright
```

Expected: All packages install without errors.

- [ ] **Step 3: Create docker-compose.yml**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: lapso
      POSTGRES_PASSWORD: lapso_dev
      POSTGRES_DB: lapso
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  pgdata:
```

```bash
docker compose up -d
```

Expected: PostgreSQL and Redis running.

- [ ] **Step 4: Create .env.local.example**

```
DATABASE_URL=postgresql://lapso:lapso_dev@localhost:5432/lapso
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-change-in-production
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
ENCRYPTION_KEY=dev-encryption-key-change-in-production
```

```bash
cp .env.local.example .env.local
```

- [ ] **Step 5: Configure tailwind.config.ts — neubrutalism tokens**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#FF6B6B', hover: '#FF5252', light: '#FF8E8E' },
        secondary: { DEFAULT: '#4ECDC4', hover: '#3DBDB5', light: '#7EDDD6' },
        accent: { DEFAULT: '#FFE66D', hover: '#FFE033', light: '#FFF0A3' },
        dark: { DEFAULT: '#2D3436', light: '#636E72' },
        surface: { DEFAULT: '#FFFFFF', alt: '#F7F7F7' },
        danger: { DEFAULT: '#FF4757', hover: '#FF3344' },
        purple: { DEFAULT: '#A855F7', hover: '#9333EA' },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neo': '4px 4px 0 0 #2D3436',
        'neo-sm': '2px 2px 0 0 #2D3436',
        'neo-lg': '6px 6px 0 0 #2D3436',
        'neo-hover': '6px 6px 0 0 #2D3436',
      },
      borderWidth: { '3': '3px' },
      borderRadius: { 'none': '0px' },
      animation: {
        'bounce-in': 'bounceIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'shake': 'shake 0.4s ease-in-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.2s cubic-bezier(0.2, 0, 0, 1)',
        'squish': 'squish 0.15s ease-in-out',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 107, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 107, 107, 0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        squish: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 6: Create src/styles/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@layer base {
  * {
    @apply border-dark;
  }

  body {
    @apply bg-surface-alt text-dark font-body antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-heading font-bold;
  }
}

@layer components {
  .neo-card {
    @apply bg-surface border-3 shadow-neo p-6;
  }

  .neo-card-hover {
    @apply transition-all duration-100 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo-hover;
  }

  .neo-card-active {
    @apply active:translate-x-0 active:translate-y-0 active:shadow-neo-sm;
  }

  .neo-input {
    @apply border-3 bg-surface px-4 py-2 font-body text-dark placeholder:text-dark-light/50
           focus:outline-none focus:ring-0 focus:border-primary;
  }

  .neo-divider {
    @apply border-2 border-dark;
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: scaffold Next.js 14 project with neubrutalism design tokens"
```

---

### Task 2: Database Schema & Connection

**Files:**
- Create: `src/lib/db/schema.ts`, `src/lib/db/index.ts`, `drizzle.config.ts`

- [ ] **Step 1: Create drizzle.config.ts**

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

- [ ] **Step 2: Create src/lib/db/schema.ts — all tables**

```typescript
import {
  pgTable, uuid, varchar, text, timestamp, doublePrecision,
  boolean, jsonb, pgEnum, integer, uniqueIndex
} from 'drizzle-orm/pg-core'

export const deviceStatusEnum = pgEnum('device_status', ['online', 'offline', 'lost', 'locked', 'wiped'])
export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'manager', 'member'])
export const alertSeverityEnum = pgEnum('alert_severity', ['info', 'warning', 'critical'])
export const commandTypeEnum = pgEnum('command_type', ['lock', 'unlock', 'wipe', 'alarm', 'message', 'locate'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  publicKey: text('public_key'),
  encryptedPrivateKey: text('encrypted_private_key'),
  keySalt: text('key_salt'),
  totpSecret: text('totp_secret'),
  totpEnabled: boolean('totp_enabled').default(false),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('email_idx').on(table.email),
}))

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  deviceType: varchar('device_type', { length: 50 }).notNull(), // laptop, phone, tablet
  platform: varchar('platform', { length: 50 }).notNull(), // windows, macos, linux, android, ios
  status: deviceStatusEnum('status').default('offline').notNull(),
  lastLatitude: doublePrecision('last_latitude'),
  lastLongitude: doublePrecision('last_longitude'),
  lastAccuracy: doublePrecision('last_accuracy'),
  lastSeenAt: timestamp('last_seen_at'),
  batteryLevel: integer('battery_level'),
  batteryCharging: boolean('battery_charging'),
  storageUsed: integer('storage_used'), // GB
  storageTotal: integer('storage_total'),
  ipAddress: varchar('ip_address', { length: 45 }),
  wifiSsid: varchar('wifi_ssid', { length: 255 }),
  agentVersion: varchar('agent_version', { length: 20 }),
  publicKey: text('public_key'),
  encryptedDeviceKey: text('encrypted_device_key'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'cascade' }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  accuracy: doublePrecision('accuracy'),
  altitude: doublePrecision('altitude'),
  speed: doublePrecision('speed'),
  heading: doublePrecision('heading'),
  source: varchar('source', { length: 20 }).notNull(), // gps, wifi, cell, ble
  batteryLevel: integer('battery_level'),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
})

export const geofences = pgTable('geofences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  coordinates: jsonb('coordinates').notNull(), // GeoJSON polygon
  radius: doublePrecision('radius'), // meters, for circular zones
  notifyOnEnter: boolean('notify_on_enter').default(true),
  notifyOnExit: boolean('notify_on_exit').default(true),
  enabled: boolean('enabled').default(true),
  color: varchar('color', { length: 7 }).default('#FF6B6B'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const commands = pgTable('commands', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'cascade' }).notNull(),
  type: commandTypeEnum('type').notNull(),
  payload: jsonb('payload').default({}),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, sent, executed, failed
  result: text('result'),
  executedAt: timestamp('executed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // geofence_enter, geofence_exit, theft, low_battery, offline
  severity: alertSeverityEnum('severity').default('info').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  metadata: jsonb('metadata').default({}),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'cascade' }).notNull(),
  alertId: uuid('alert_id').references(() => alerts.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 20 }).notNull(), // screenshot, photo, audio
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: userRoleEnum('role').default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
  deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  detail: text('detail'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const beacons = pgTable('beacons', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  uuid: varchar('uuid', { length: 36 }).notNull().unique(),
  major: integer('major'),
  minor: integer('minor'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

- [ ] **Step 3: Create src/lib/db/index.ts**

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, { max: 10 })
export const db = drizzle(client, { schema })
```

- [ ] **Step 4: Run migration**

```bash
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

Expected: Tables created in PostgreSQL.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: database schema with Drizzle ORM — users, devices, locations, geofences, commands, alerts"
```

---

### Task 3: Auth Utilities (JWT, Password, Crypto)

**Files:**
- Create: `src/lib/auth/jwt.ts`, `src/lib/auth/password.ts`, `src/lib/auth/middleware.ts`, `src/lib/crypto/e2e.ts`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create src/lib/auth/jwt.ts**

```typescript
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

export interface TokenPayload {
  sub: string // user id
  email: string
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m', jwtid: uuid() })
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d', jwtid: uuid() })
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload
}
```

- [ ] **Step 2: Create src/lib/auth/password.ts**

```typescript
import argon2 from 'argon2'

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  })
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password)
}
```

- [ ] **Step 3: Create src/lib/auth/middleware.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, type TokenPayload } from './jwt'

export interface AuthContext {
  user: TokenPayload
}

export async function authenticate(req: NextRequest): Promise<AuthContext | NextResponse> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  try {
    const user = verifyAccessToken(token)
    return { user }
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
}

export function getAuthUser(req: NextRequest): TokenPayload | null {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    return verifyAccessToken(authHeader.slice(7))
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Create src/lib/crypto/e2e.ts** (scaffolding for E2E encryption)

```typescript
import { generateKeyPairSync, publicEncrypt, privateDecrypt, randomBytes, createCipheriv, createDecipheriv } from 'crypto'

export function generateUserKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  return { publicKey, privateKey }
}

export function generateDeviceKeyPair(): { publicKey: string; privateKey: string } {
  return generateUserKeyPair()
}

export function encryptWithPublicKey(publicKey: string, data: string): string {
  const buffer = Buffer.from(data, 'utf-8')
  const encrypted = publicEncrypt(publicKey, buffer)
  return encrypted.toString('base64')
}

export function decryptWithPrivateKey(privateKey: string, encryptedData: string): string {
  const buffer = Buffer.from(encryptedData, 'base64')
  const decrypted = privateDecrypt(privateKey, buffer)
  return decrypted.toString('utf-8')
}

export function generateSymmetricKey(): string {
  return randomBytes(32).toString('hex')
}

export function encryptSymmetric(key: string, data: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv)
  const encrypted = Buffer.concat([cipher.update(data, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return JSON.stringify({
    iv: iv.toString('hex'),
    data: encrypted.toString('hex'),
    tag: tag.toString('hex'),
  })
}

export function decryptSymmetric(key: string, encrypted: string): string {
  const { iv, data, tag } = JSON.parse(encrypted)
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()])
  return decrypted.toString('utf-8')
}
```

- [ ] **Step 5: Create src/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function formatBattery(level: number | null): string {
  if (level === null) return '--'
  return `${level}%`
}

export function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function getDeviceEmoji(type: string): string {
  const map: Record<string, string> = {
    laptop: '💻',
    phone: '📱',
    tablet: '📟',
    desktop: '🖥️',
    watch: '⌚',
  }
  return map[type] ?? '💻'
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: auth utilities — JWT, Argon2 hashing, E2E crypto scaffolding"
```

---

### Task 4: Auth API Routes (Register, Login, Logout, Me)

**Files:**
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`

- [ ] **Step 1: Create POST /api/auth/register**

```typescript
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth/password'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { generateUserKeyPair } from '@/lib/crypto/e2e'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const { email, password, name } = parsed.data

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const { publicKey, privateKey } = generateUserKeyPair()

    const [user] = await db.insert(users).values({
      email,
      name,
      passwordHash,
      publicKey,
      encryptedPrivateKey: privateKey, // Will be encrypted with derived key in production
    }).returning({ id: users.id, email: users.email, name: users.name })

    const accessToken = signAccessToken({ sub: user.id, email: user.email })
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email })

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
    })

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create POST /api/auth/login**

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '@/lib/auth/password'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const { email, password } = parsed.data

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await verifyPassword(user.passwordHash, password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email })
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email })

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
    })

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create POST /api/auth/logout**

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('refresh_token', '', { httpOnly: true, path: '/', maxAge: 0 })
  return response
}
```

- [ ] **Step 4: Create GET /api/auth/me**

```typescript
// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [profile] = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    avatarUrl: users.avatarUrl,
    totpEnabled: users.totpEnabled,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, user.sub)).limit(1)

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(profile)
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: auth API routes — register, login, logout, me"
```

---

### Task 5: Neubrutalism UI Components (N* Primitives)

**Files:**
- Create: `src/components/ui/n-button.tsx`
- Create: `src/components/ui/n-card.tsx`
- Create: `src/components/ui/n-input.tsx`
- Create: `src/components/ui/n-modal.tsx`
- Create: `src/components/ui/n-badge.tsx`
- Create: `src/components/ui/n-switch.tsx`
- Create: `src/components/ui/n-avatar.tsx`

- [ ] **Step 1: Create NButton**

```typescript
// src/components/ui/n-button.tsx
'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type NButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost'
type NButtonSize = 'sm' | 'md' | 'lg'

interface NButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: NButtonVariant
  size?: NButtonSize
  loading?: boolean
}

const variantClasses: Record<NButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-secondary text-white hover:bg-secondary-hover',
  accent: 'bg-accent text-dark hover:bg-accent-hover',
  danger: 'bg-danger text-white hover:bg-danger-hover',
  ghost: 'bg-transparent text-dark hover:bg-surface-alt',
}

const sizeClasses: Record<NButtonSize, string> = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-5 py-2 text-base',
  lg: 'px-7 py-3 text-lg',
}

export const NButton = forwardRef<HTMLButtonElement, NButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={!disabled ? { scale: 1.02, x: -1, y: -1 } : {}}
        whileTap={!disabled ? { scale: 0.97, x: 0, y: 0 } : {}}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-heading font-bold',
          'border-3 shadow-neo transition-colors duration-100',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        {...(props as any)}
      >
        {loading ? (
          <span className="inline-flex gap-1">
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        ) : (
          children
        )}
      </motion.button>
    )
  }
)

NButton.displayName = 'NButton'
```

- [ ] **Step 2: Create NCard**

```typescript
// src/components/ui/n-card.tsx
'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface NCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
}

export function NCard({ children, className, hover = false, onClick, padding = 'md' }: NCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, x: -2 } : undefined}
      className={cn(
        'bg-surface border-3 shadow-neo',
        hover && 'cursor-pointer transition-shadow hover:shadow-neo-hover',
        paddingClasses[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 3: Create NInput**

```typescript
// src/components/ui/n-input.tsx
'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface NInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const NInput = forwardRef<HTMLInputElement, NInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="font-heading font-bold text-sm text-dark">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'neo-input font-body',
            error && 'border-danger animate-shake',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-danger text-sm font-medium">{error}</span>
        )}
      </div>
    )
  }
)

NInput.displayName = 'NInput'
```

- [ ] **Step 4: Create NBadge**

```typescript
// src/components/ui/n-badge.tsx
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface NBadgeProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'default'
  className?: string
}

const variants = {
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary text-white',
  accent: 'bg-accent text-dark',
  danger: 'bg-danger text-white',
  default: 'bg-dark text-white',
}

export function NBadge({ children, variant = 'default', className }: NBadgeProps) {
  return (
    <span className={cn(
      'inline-block px-2 py-0.5 text-xs font-heading font-bold border-2 border-dark',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
```

- [ ] **Step 5: Create NModal**

```typescript
// src/components/ui/n-modal.tsx
'use client'

import { useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from '@phosphor-icons/react'

interface NModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function NModal({ open, onClose, title, children }: NModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-dark/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative bg-surface border-3 shadow-neo-lg max-w-lg w-full max-h-[85vh] overflow-auto"
          >
            {title && (
              <div className="flex items-center justify-between p-5 border-b-3 border-dark">
                <h2 className="text-xl font-heading font-bold">{title}</h2>
                <button onClick={onClose} className="hover:bg-surface-alt p-1 transition-colors">
                  <X size={20} weight="bold" />
                </button>
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: neubrutalism UI primitives — NButton, NCard, NInput, NBadge, NModal"
```

---

### Task 6: Illustration Components (Blob Characters)

**Files:**
- Create: `src/components/illustrations/blob-device.tsx`
- Create: `src/components/illustrations/empty-state.tsx`
- Create: `public/illustrations/device-laptop.svg`
- Create: `public/illustrations/device-phone.svg`
- Create: `public/illustrations/empty-devices.svg`

- [ ] **Step 1: Create BlobDevice — status-aware blob character**

```typescript
// src/components/illustrations/blob-device.tsx
'use client'

import { motion } from 'framer-motion'

type DeviceMood = 'happy' | 'worried' | 'scared' | 'tired' | 'neutral'

interface BlobDeviceProps {
  mood?: DeviceMood
  type?: 'laptop' | 'phone' | 'tablet'
  size?: number
  animate?: boolean
}

const moodColors: Record<DeviceMood, { body: string; eyes: string }> = {
  happy: { body: '#4ECDC4', eyes: '#2D3436' },
  worried: { body: '#FFE66D', eyes: '#2D3436' },
  scared: { body: '#FF6B6B', eyes: '#FFFFFF' },
  tired: { body: '#DFE6E9', eyes: '#2D3436' },
  neutral: { body: '#A855F7', eyes: '#FFFFFF' },
}

const faceByMood: Record<DeviceMood, string> = {
  happy: 'M 30 42 Q 37 50 44 42',
  worried: 'M 30 42 Q 37 38 44 42',
  scared: 'M 30 40 Q 37 44 44 40',
  tired: 'M 30 43 Q 37 40 44 43',
  neutral: 'M 30 42 Q 37 43 44 42',
}

export function BlobDevice({ mood = 'neutral', type = 'laptop', size = 120, animate = true }: BlobDeviceProps) {
  const colors = moodColors[mood]

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      animate={animate ? {
        y: [0, -4, 0, -2, 0],
        rotate: [0, 1, -1, 0.5, 0],
      } : {}}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Body blob */}
      <motion.path
        d="M 15 20 C 15 8, 65 8, 65 20 L 65 55 C 65 67, 15 67, 15 55 Z"
        fill={colors.body}
        stroke="#2D3436"
        strokeWidth="3"
        animate={animate ? {
          d: [
            'M 15 20 C 15 8, 65 8, 65 20 L 65 55 C 65 67, 15 67, 15 55 Z',
            'M 15 21 C 10 8, 70 8, 65 20 L 65 54 C 63 68, 17 68, 15 55 Z',
            'M 15 20 C 18 8, 62 8, 65 20 L 65 56 C 68 66, 12 66, 15 55 Z',
            'M 15 19 C 15 8, 65 8, 65 21 L 65 55 C 65 67, 15 67, 15 56 Z',
          ]
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Screen */}
      <rect x="22" y="19" width="36" height="24" rx="2" fill="white" stroke="#2D3436" strokeWidth="2.5" />
      {/* Screen content lines */}
      <line x1="26" y1="25" x2="42" y2="25" stroke="#2D3436" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="29" x2="48" y2="29" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="33" x2="36" y2="33" stroke="#4ECDC4" strokeWidth="2" strokeLinecap="round" />
      {type === 'laptop' && (
        <rect x="18" y="43" width="44" height="4" rx="1" fill={colors.body} stroke="#2D3436" strokeWidth="2.5" />
      )}
      {type === 'phone' && (
        <circle cx="40" cy="47" r="3" fill="none" stroke="#2D3436" strokeWidth="2" />
      )}
      {/* Eyes */}
      <motion.circle
        cx="32" cy="39" r="2.5" fill={colors.eyes}
        animate={mood === 'scared' ? { r: [2.5, 3, 2.5] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <motion.circle
        cx="48" cy="39" r="2.5" fill={colors.eyes}
        animate={mood === 'scared' ? { r: [2.5, 3, 2.5] } : {}}
        transition={{ duration: 1, repeat: Infinity, delay: 0.15 }}
      />
      {/* Mouth */}
      <path d={faceByMood[mood]} fill="none" stroke={colors.eyes} strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
  )
}
```

- [ ] **Step 2: Create EmptyState component**

```typescript
// src/components/illustrations/empty-state.tsx
import { NButton } from '@/components/ui/n-button'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  icon?: ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-6">{icon}</div>}
      <h3 className="text-xl font-heading font-bold text-dark mb-2">{title}</h3>
      <p className="text-dark-light max-w-sm mb-6">{description}</p>
      {action && (
        <NButton variant="primary" onClick={action.onClick}>
          {action.label}
        </NButton>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create placeholder SVG illustrations**

Create `public/illustrations/device-laptop.svg`, `public/illustrations/device-phone.svg`, `public/illustrations/empty-devices.svg` as simple blob shapes. For Phase 1, use inline blob SVGs in BlobDevice component (already handled above).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: illustration components — BlobDevice status-based characters, EmptyState"
```

---

### Task 7: Layout & Auth Pages

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Create root layout with providers**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import '@/styles/globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'LAPSO — Device Tracking',
  description: 'Never lose a device again. Premium tracking with real-time location, geofencing, and anti-theft AI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

```typescript
// src/app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30 * 1000, retry: 1 } }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

- [ ] **Step 2: Create auth layout**

```typescript
// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create login page**

```typescript
// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NCard } from '@/components/ui/n-card'
import { NInput } from '@/components/ui/n-input'
import { NButton } from '@/components/ui/n-button'
import { BlobDevice } from '@/components/illustrations/blob-device'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Login failed')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <BlobDevice mood="happy" size={100} />
      <NCard className="w-full">
        <h1 className="text-2xl font-heading font-bold text-center mb-6">Welcome back</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <NInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <NInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-danger text-sm font-medium">{error}</p>}
          <NButton type="submit" loading={loading} className="w-full">
            Log In
          </NButton>
        </form>
        <p className="text-center text-sm text-dark-light mt-4">
          Don't have an account?{' '}
          <Link href="/register" className="font-bold text-primary hover:underline">Register</Link>
        </p>
      </NCard>
    </div>
  )
}
```

- [ ] **Step 4: Create register page**

```typescript
// src/app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NCard } from '@/components/ui/n-card'
import { NInput } from '@/components/ui/n-input'
import { NButton } from '@/components/ui/n-button'
import { BlobDevice } from '@/components/illustrations/blob-device'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Registration failed')
      setLoading(false)
      return
    }

    router.push('/welcome')
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <BlobDevice mood="happy" size={100} />
      <NCard className="w-full">
        <h1 className="text-2xl font-heading font-bold text-center mb-6">Create your account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <NInput label="Name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <NInput label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <NInput label="Password" type="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-danger text-sm font-medium">{error}</p>}
          <NButton type="submit" loading={loading} className="w-full">
            Create Account
          </NButton>
        </form>
        <p className="text-center text-sm text-dark-light mt-4">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">Log in</Link>
        </p>
      </NCard>
    </div>
  )
}
```

- [ ] **Step 5: Create sidebar**

```typescript
// src/components/layout/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  House, Devices, MapPin, Shield, Bell, Users, Gear, SignOut
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { BlobDevice } from '@/components/illustrations/blob-device'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: House },
  { href: '/devices', label: 'Devices', icon: Devices },
  { href: '/geofences', label: 'Geofences', icon: MapPin },
  { href: '/find', label: 'Find', icon: Shield },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/settings', label: 'Settings', icon: Gear },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r-3 border-dark bg-surface h-screen sticky top-0">
      <div className="p-5 border-b-3 border-dark flex items-center gap-3">
        <BlobDevice mood="happy" size={36} animate={false} />
        <span className="text-xl font-heading font-bold">LAPSO</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 font-heading font-bold text-sm transition-all duration-100',
                active
                  ? 'bg-primary text-white border-2 border-dark -translate-x-1 -translate-y-0.5 shadow-neo-sm'
                  : 'hover:bg-surface-alt border-2 border-transparent'
              )}
            >
              <Icon size={20} weight="bold" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t-3 border-dark">
        <button
          onClick={() => fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.href = '/login')}
          className="flex items-center gap-3 px-3 py-2.5 font-heading font-bold text-sm w-full hover:bg-surface-alt border-2 border-transparent transition-colors"
        >
          <SignOut size={20} weight="bold" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 6: Create header (mobile)**

```typescript
// src/components/layout/header.tsx
'use client'

import { List, X } from '@phosphor-icons/react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { cn } from '@/lib/utils'
import {
  House, Devices, MapPin, Shield, Bell, Users, Gear, SignOut
} from '@phosphor-icons/react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: House },
  { href: '/devices', label: 'Devices', icon: Devices },
  { href: '/geofences', label: 'Geofences', icon: MapPin },
  { href: '/find', label: 'Find', icon: Shield },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/settings', label: 'Settings', icon: Gear },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-surface border-b-3 border-dark">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <BlobDevice mood="happy" size={28} animate={false} />
          <span className="text-lg font-heading font-bold">LAPSO</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 border-2 border-dark hover:bg-surface-alt transition-colors"
        >
          {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
        </button>
      </div>

      {open && (
        <nav className="border-t-3 border-dark p-2 space-y-1 bg-surface">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 font-heading font-bold text-sm',
                  active && 'bg-primary text-white border-2 border-dark'
                )}
              >
                <Icon size={20} weight="bold" />
                {item.label}
              </Link>
            )
          })}
          <button
            onClick={() => {
              fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.href = '/login')
            }}
            className="flex items-center gap-3 px-3 py-2.5 font-heading font-bold text-sm w-full"
          >
            <SignOut size={20} weight="bold" />
            Sign Out
          </button>
        </nav>
      )}
    </header>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: auth pages (login/register), layout components (sidebar, header)"
```

---

### Task 8: Landing Page & Onboarding

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/welcome/page.tsx`

- [ ] **Step 1: Create landing page**

```typescript
// src/app/page.tsx
import Link from 'next/link'
import { NButton } from '@/components/ui/n-button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-alt">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <header className="flex items-center justify-between mb-24">
          <span className="text-2xl font-heading font-bold tracking-tight">LAPSO</span>
          <div className="flex gap-3">
            <Link href="/login">
              <NButton variant="ghost">Log In</NButton>
            </Link>
            <Link href="/register">
              <NButton variant="primary">Get Started</NButton>
            </Link>
          </div>
        </header>

        <section className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl sm:text-6xl font-heading font-bold leading-tight mb-6">
            Never lose a device <span className="text-primary">ever again</span>
          </h1>
          <p className="text-xl text-dark-light mb-8 max-w-xl mx-auto">
            Real-time tracking, offline finding, anti-theft AI. Your devices, always found. Built with privacy-first encryption.
          </p>
          <Link href="/register">
            <NButton size="lg">Start Tracking — It's Free</NButton>
          </Link>
        </section>

        <section className="grid md:grid-cols-3 gap-6 mb-20">
          {[
            { title: 'Real-Time Location', desc: 'GPS + WiFi + Cell fusion. Sub-meter accuracy, live updating every second.', emoji: '📍' },
            { title: 'Offline Finding', desc: 'Crowd-sourced Bluetooth network finds devices even when they're offline.', emoji: '🔍' },
            { title: 'Anti-Theft AI', desc: 'Detects theft patterns instantly. Auto-captures screenshots and photos.', emoji: '🛡️' },
            { title: 'Geofencing', desc: 'Custom zones with instant alerts. Know when devices leave safe areas.', emoji: '🗺️' },
            { title: 'Device Health', desc: 'Battery, storage, CPU monitoring. Prevent issues before they happen.', emoji: '💚' },
            { title: 'E2E Encrypted', desc: 'Your keys, your data. Signal-level encryption. We can't see your location.', emoji: '🔐' },
          ].map((feature) => (
            <div key={feature.title} className="bg-surface border-3 border-dark shadow-neo p-6 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-neo-hover transition-all">
              <span className="text-3xl mb-3 block">{feature.emoji}</span>
              <h3 className="font-heading font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-dark-light text-sm">{feature.desc}</p>
            </div>
          ))}
        </section>

        <footer className="text-center border-t-3 border-dark pt-8">
          <p className="text-dark-light text-sm">LAPSO — Built with privacy and power. Open source.</p>
        </footer>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create onboarding page**

```typescript
// src/app/welcome/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NButton } from '@/components/ui/n-button'
import { NCard } from '@/components/ui/n-card'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { motion, AnimatePresence } from 'framer-motion'

const steps = [
  {
    title: 'Welcome to LAPSO',
    description: 'Your premium device tracking system. We'll help you set up your first device and get tracking in under 2 minutes.',
    mood: 'happy' as const,
  },
  {
    title: 'Install the Agent',
    description: 'Download the LAPSO agent for your device. It runs quietly in the background and reports location securely.',
    mood: 'neutral' as const,
  },
  {
    title: 'Encryption Keys',
    description: 'Your data is encrypted end-to-end. Only you hold the keys. Even we can't see your location data.',
    mood: 'neutral' as const,
  },
  {
    title: 'You're All Set!',
    description: 'Your tracking is live. Add more devices, set up geofences, and customize alerts anytime.',
    mood: 'happy' as const,
  },
]

export default function WelcomePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center p-4">
      <NCard className="max-w-md w-full text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-center mb-6">
              <BlobDevice mood={steps[step].mood} size={100} />
            </div>
            <h2 className="text-2xl font-heading font-bold mb-3">{steps[step].title}</h2>
            <p className="text-dark-light mb-8">{steps[step].description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 justify-center mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`w-3 h-3 border-2 border-dark ${i === step ? 'bg-primary' : 'bg-surface-alt'}`} />
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          {step > 0 && (
            <NButton variant="ghost" onClick={() => setStep(step - 1)}>Back</NButton>
          )}
          {step < steps.length - 1 ? (
            <NButton variant="primary" onClick={() => setStep(step + 1)}>Next</NButton>
          ) : (
            <NButton variant="primary" onClick={() => router.push('/dashboard')}>Go to Dashboard</NButton>
          )}
        </div>
      </NCard>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: landing page with feature highlights, 4-step onboarding flow"
```

---

### Task 9: Device API Routes

**Files:**
- Create: `src/app/api/devices/route.ts`
- Create: `src/app/api/devices/[id]/route.ts`
- Create: `src/app/api/devices/[id]/commands/route.ts`
- Create: `src/app/api/devices/[id]/health/route.ts`
- Create: `src/app/api/devices/[id]/locations/route.ts`

- [ ] **Step 1: Create GET/POST /api/devices**

```typescript
// src/app/api/devices/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { devices } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userDevices = await db.select().from(devices)
    .where(eq(devices.userId, user.sub))
    .orderBy(desc(devices.updatedAt))

  return NextResponse.json(userDevices)
}

const createDeviceSchema = z.object({
  name: z.string().min(1).max(255),
  deviceType: z.enum(['laptop', 'phone', 'tablet', 'desktop', 'watch']),
  platform: z.enum(['windows', 'macos', 'linux', 'android', 'ios']),
})

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createDeviceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const [device] = await db.insert(devices).values({
      ...parsed.data,
      userId: user.sub,
    }).returning()

    return NextResponse.json(device, { status: 201 })
  } catch (error) {
    console.error('Create device error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create GET/PUT/DELETE /api/devices/[id]**

```typescript
// src/app/api/devices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { devices } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

async function getDevice(req: NextRequest, deviceId: string) {
  const user = getAuthUser(req)
  if (!user) return null

  const [device] = await db.select().from(devices)
    .where(and(eq(devices.id, deviceId), eq(devices.userId, user.sub)))
    .limit(1)

  return device
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const device = await getDevice(req, params.id)
  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(device)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const device = await getDevice(req, params.id)
  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await req.json()
    const [updated] = await db.update(devices)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(devices.id, params.id))
      .returning()

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update device error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const device = await getDevice(req, params.id)
  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(devices).where(eq(devices.id, params.id))
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Create POST /api/devices/[id]/commands**

```typescript
// src/app/api/devices/[id]/commands/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { devices, commands } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const commandSchema = z.object({
  type: z.enum(['lock', 'unlock', 'wipe', 'alarm', 'message', 'locate']),
  payload: z.record(z.any()).optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [device] = await db.select().from(devices)
    .where(and(eq(devices.id, params.id), eq(devices.userId, user.sub)))
    .limit(1)

  if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = commandSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const [command] = await db.insert(commands).values({
      deviceId: params.id,
      type: parsed.data.type,
      payload: parsed.data.payload || {},
    }).returning()

    // In production: publish command to device via WebSocket/Kafka
    return NextResponse.json(command, { status: 201 })
  } catch (error) {
    console.error('Command error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create GET /api/devices/[id]/health**

```typescript
// src/app/api/devices/[id]/health/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { devices } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [device] = await db.select({
    batteryLevel: devices.batteryLevel,
    batteryCharging: devices.batteryCharging,
    storageUsed: devices.storageUsed,
    storageTotal: devices.storageTotal,
    ipAddress: devices.ipAddress,
    wifiSsid: devices.wifiSsid,
    agentVersion: devices.agentVersion,
    lastSeenAt: devices.lastSeenAt,
  }).from(devices)
    .where(and(eq(devices.id, params.id), eq(devices.userId, user.sub)))
    .limit(1)

  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(device)
}
```

- [ ] **Step 5: Create GET /api/devices/[id]/locations**

```typescript
// src/app/api/devices/[id]/locations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db'
import { devices, locations } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [device] = await db.select({ id: devices.id }).from(devices)
    .where(and(eq(devices.id, params.id), eq(devices.userId, user.sub)))
    .limit(1)

  if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

  const locs = await db.select().from(locations)
    .where(eq(locations.deviceId, params.id))
    .orderBy(desc(locations.recordedAt))
    .limit(limit)

  return NextResponse.json(locs)
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: device CRUD API, command dispatch, health & location endpoints"
```

---

### Task 10: Zustand Store & React Query Hooks

**Files:**
- Create: `src/store/app-store.ts`
- Create: `src/hooks/use-auth.ts`
- Create: `src/hooks/use-devices.ts`
- Create: `src/hooks/use-locations.ts`

- [ ] **Step 1: Create Zustand store**

```typescript
// src/store/app-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  totpEnabled?: boolean
}

interface AppState {
  user: User | null
  accessToken: string | null
  selectedDeviceId: string | null
  mapCenter: [number, number]
  mapZoom: number

  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  setSelectedDeviceId: (id: string | null) => void
  setMapCenter: (center: [number, number]) => void
  setMapZoom: (zoom: number) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      selectedDeviceId: null,
      mapCenter: [20.5937, 78.9629], // India center
      mapZoom: 5,

      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setSelectedDeviceId: (id) => set({ selectedDeviceId: id }),
      setMapCenter: (center) => set({ mapCenter: center }),
      setMapZoom: (zoom) => set({ mapZoom: zoom }),
      logout: () => set({ user: null, accessToken: null, selectedDeviceId: null }),
    }),
    {
      name: 'lapso-storage',
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
)
```

- [ ] **Step 2: Create useAuth hook**

```typescript
// src/hooks/use-auth.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { useRouter } from 'next/navigation'

async function fetchMe(token: string) {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Unauthorized')
  return res.json()
}

export function useAuth() {
  const { user, accessToken, setUser, setAccessToken, logout: clearStore } = useAppStore()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => fetchMe(accessToken!),
    enabled: !!accessToken,
    retry: false,
    onSuccess: (data: any) => setUser(data),
    onError: () => clearStore(),
  })

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Login failed')
      }
      return res.json()
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
      setUser(data.user)
      router.push('/dashboard')
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Registration failed')
      }
      return res.json()
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
      setUser(data.user)
      router.push('/welcome')
    },
  })

  const logout = () => {
    clearStore()
    queryClient.clear()
    router.push('/login')
  }

  return {
    user,
    accessToken,
    isLoading,
    login: loginMutation.mutate,
    loginError: loginMutation.error?.message,
    loginLoading: loginMutation.isPending,
    register: registerMutation.mutate,
    registerError: registerMutation.error?.message,
    registerLoading: registerMutation.isPending,
    logout,
  }
}
```

- [ ] **Step 3: Create useDevices hook**

```typescript
// src/hooks/use-devices.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export function useDevices() {
  const accessToken = useAppStore((s) => s.accessToken)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await fetch('/api/devices', { headers: headers(accessToken!) })
      if (!res.ok) throw new Error('Failed to fetch devices')
      return res.json()
    },
    enabled: !!accessToken,
  })

  const createDevice = useMutation({
    mutationFn: async (data: { name: string; deviceType: string; platform: string }) => {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: headers(accessToken!),
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create device')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devices'] }),
  })

  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
        headers: headers(accessToken!),
      })
      if (!res.ok) throw new Error('Failed to delete device')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devices'] }),
  })

  const sendCommand = useMutation({
    mutationFn: async ({ deviceId, type, payload }: { deviceId: string; type: string; payload?: any }) => {
      const res = await fetch(`/api/devices/${deviceId}/commands`, {
        method: 'POST',
        headers: headers(accessToken!),
        body: JSON.stringify({ type, payload }),
      })
      if (!res.ok) throw new Error('Failed to send command')
      return res.json()
    },
  })

  return { ...query, createDevice, deleteDevice, sendCommand }
}
```

- [ ] **Step 4: Create useLocations hook**

```typescript
// src/hooks/use-locations.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'

export function useLocations(deviceId: string | null) {
  const accessToken = useAppStore((s) => s.accessToken)

  return useQuery({
    queryKey: ['locations', deviceId],
    queryFn: async () => {
      const res = await fetch(`/api/devices/${deviceId}/locations?limit=200`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('Failed to fetch locations')
      return res.json()
    },
    enabled: !!accessToken && !!deviceId,
  })
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: Zustand store with persistence, React Query hooks for auth/devices/locations"
```

---

### Task 11: Dashboard Page with Live Map

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/components/map/live-map.tsx`
- Create: `src/components/map/location-marker.tsx`
- Create: `src/components/devices/device-card.tsx`
- Create: `src/components/devices/device-grid.tsx`

- [ ] **Step 1: Create dashboard layout (auth gated)**

```typescript
// src/app/(dashboard)/layout.tsx
'use client'

import { useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.push('/login')
    }
  }, [accessToken, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-alt">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-3 h-3 bg-primary animate-bounce border-2 border-dark" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!accessToken) return null

  return (
    <div className="min-h-screen bg-surface-alt">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px]">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create DeviceCard component**

```typescript
// src/components/devices/device-card.tsx
'use client'

import Link from 'next/link'
import { NCard } from '@/components/ui/n-card'
import { NBadge } from '@/components/ui/n-badge'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { BatteryHigh, BatteryLow, BatteryMedium, BatteryWarning } from '@phosphor-icons/react'
import { timeAgo } from '@/lib/utils'
import type { Device } from '@/lib/db/schema' // Using inferred type

const statusMood: Record<string, 'happy' | 'worried' | 'scared' | 'tired' | 'neutral'> = {
  online: 'happy',
  offline: 'worried',
  lost: 'scared',
  locked: 'neutral',
  wiped: 'tired',
}

const statusColor: Record<string, 'secondary' | 'default' | 'danger' | 'primary' | 'accent'> = {
  online: 'secondary',
  offline: 'default',
  lost: 'danger',
  locked: 'primary',
  wiped: 'accent',
}

function BatteryIcon({ level, charging }: { level: number | null; charging?: boolean | null }) {
  if (level === null) return <BatteryWarning size={16} weight="bold" />
  if (level > 75) return <BatteryHigh size={16} weight="bold" />
  if (level > 40) return <BatteryMedium size={16} weight="bold" />
  if (level > 15) return <BatteryLow size={16} weight="bold" />
  return <BatteryWarning size={16} weight="bold" />
}

export function DeviceCard({ device }: { device: any }) {
  return (
    <Link href={`/devices/${device.id}`}>
      <NCard hover className="flex items-center gap-4 h-full">
        <BlobDevice mood={statusMood[device.status] || 'neutral'} type={device.deviceType} size={56} animate={false} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading font-bold text-sm truncate">{device.name}</h3>
            <NBadge variant={statusColor[device.status] || 'default'}>{device.status}</NBadge>
          </div>
          <div className="flex items-center gap-3 text-xs text-dark-light">
            {device.batteryLevel !== null && (
              <span className="flex items-center gap-1">
                <BatteryIcon level={device.batteryLevel} charging={device.batteryCharging} />
                {device.batteryLevel}%
              </span>
            )}
            {device.lastSeenAt && (
              <span>{timeAgo(device.lastSeenAt)}</span>
            )}
          </div>
          {device.lastLatitude && device.lastLongitude && (
            <p className="text-xs text-dark-light mt-1 truncate">
              {device.lastLatitude.toFixed(4)}, {device.lastLongitude.toFixed(4)}
            </p>
          )}
        </div>
      </NCard>
    </Link>
  )
}
```

- [ ] **Step 3: Create DeviceGrid component**

```typescript
// src/components/devices/device-grid.tsx
import { DeviceCard } from './device-card'
import { EmptyState } from '@/components/illustrations/empty-state'
import { BlobDevice } from '@/components/illustrations/blob-device'

export function DeviceGrid({ devices, onAddClick }: { devices: any[]; onAddClick: () => void }) {
  if (devices.length === 0) {
    return (
      <EmptyState
        title="No devices yet"
        description="Add your first device to start tracking. Install the LAPSO agent on your laptop or phone."
        action={{ label: 'Add Device', onClick: onAddClick }}
        icon={<BlobDevice mood="neutral" size={80} />}
      />
    )
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create LiveMap component**

```typescript
// src/components/map/live-map.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { LocationMarker } from './location-marker'

// Dynamic import for Leaflet (SSR-safe)
import dynamic from 'next/dynamic'

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
)

interface DeviceLocation {
  id: string
  name: string
  deviceType: string
  status: string
  lat: number
  lng: number
  accuracy?: number
}

export function LiveMap({ devices }: { devices: DeviceLocation[] }) {
  const { mapCenter, mapZoom, setMapCenter, setMapZoom } = useAppStore()
  const mapRef = useRef<any>(null)

  // Center on active devices
  useEffect(() => {
    const active = devices.filter((d) => d.lat && d.lng)
    if (active.length > 0 && mapRef.current) {
      const bounds = active.map((d) => [d.lat, d.lng] as [number, number])
      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [devices])

  return (
    <div className="border-3 border-dark shadow-neo overflow-hidden h-[400px] lg:h-[500px]">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full"
        ref={mapRef}
        whenReady={(map: any) => { mapRef.current = map.target }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {devices.map((device) => (
          device.lat && device.lng && (
            <LocationMarker key={device.id} device={device} />
          )
        ))}
      </MapContainer>
    </div>
  )
}
```

- [ ] **Step 5: Create LocationMarker**

```typescript
// src/components/map/location-marker.tsx
'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

interface DeviceLocation {
  id: string
  name: string
  deviceType: string
  status: string
  lat: number
  lng: number
  accuracy?: number
}

const statusColors: Record<string, string> = {
  online: '#4ECDC4',
  offline: '#636E72',
  lost: '#FF4757',
  locked: '#A855F7',
  wiped: '#DFE6E9',
}

export function LocationMarker({ device }: { device: DeviceLocation }) {
  const color = statusColors[device.status] || '#2D3436'

  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 16px; height: 16px;
      background: ${color};
      border: 3px solid #2D3436;
      transform: rotate(45deg);
      box-shadow: 2px 2px 0 #2D3436;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })

  return (
    <Marker position={[device.lat, device.lng]} icon={icon}>
      <Popup>
        <div className="font-heading font-bold text-sm">
          {device.name}
          <span className="ml-2 px-1.5 py-0.5 text-xs border-2 border-dark" style={{ background: color, color: 'white' }}>
            {device.status}
          </span>
          {device.accuracy && (
            <p className="text-xs font-normal mt-1">±{Math.round(device.accuracy)}m accuracy</p>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
```

- [ ] **Step 6: Create dashboard page**

```typescript
// src/app/(dashboard)/dashboard/page.tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useDevices } from '@/hooks/use-devices'
import { DeviceGrid } from '@/components/devices/device-grid'
import { NButton } from '@/components/ui/n-button'
import { NModal } from '@/components/ui/n-modal'
import { NInput } from '@/components/ui/n-input'

const LiveMap = dynamic(
  () => import('@/components/map/live-map').then((m) => m.LiveMap),
  { ssr: false }
)

export default function DashboardPage() {
  const { data: devices = [], createDevice } = useDevices()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('laptop')
  const [newPlatform, setNewPlatform] = useState('windows')

  const mapDevices = devices
    .filter((d: any) => d.lastLatitude && d.lastLongitude)
    .map((d: any) => ({
      id: d.id,
      name: d.name,
      deviceType: d.deviceType,
      status: d.status,
      lat: d.lastLatitude,
      lng: d.lastLongitude,
      accuracy: d.lastAccuracy,
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
          <p className="text-dark-light text-sm">{devices.length} device{devices.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <NButton onClick={() => setShowAdd(true)}>+ Add Device</NButton>
      </div>

      <LiveMap devices={mapDevices} />

      <div>
        <h2 className="text-lg font-heading font-bold mb-4">Your Devices</h2>
        <DeviceGrid devices={devices} onAddClick={() => setShowAdd(true)} />
      </div>

      <NModal open={showAdd} onClose={() => setShowAdd(false)} title="Add Device">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createDevice.mutate({ name: newName, deviceType: newType, platform: newPlatform })
            setShowAdd(false)
            setNewName('')
          }}
          className="space-y-4"
        >
          <NInput label="Device Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Laptop" />
          <div className="flex flex-col gap-1.5">
            <label className="font-heading font-bold text-sm">Type</label>
            <select value={newType} onChange={(e) => setNewType(e.target.value)} className="neo-input">
              <option value="laptop">Laptop</option>
              <option value="phone">Phone</option>
              <option value="tablet">Tablet</option>
              <option value="desktop">Desktop</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-heading font-bold text-sm">Platform</label>
            <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className="neo-input">
              <option value="windows">Windows</option>
              <option value="macos">macOS</option>
              <option value="linux">Linux</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </select>
          </div>
          <NButton type="submit" className="w-full" loading={createDevice.isPending}>
            Add Device
          </NButton>
        </form>
      </NModal>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: dashboard page with live map, device cards, device grid, add device modal"
```

---

### Task 12: Device Detail Page

**Files:**
- Create: `src/app/(dashboard)/devices/[id]/page.tsx`
- Create: `src/components/devices/device-commands.tsx`
- Create: `src/components/devices/device-health.tsx`

- [ ] **Step 1: Create device commands component**

```typescript
// src/components/devices/device-commands.tsx
'use client'

import { NButton } from '@/components/ui/n-button'
import { NCard } from '@/components/ui/n-card'
import { Lock, LockOpen, Bell, Trash, MapPin, ChatText } from '@phosphor-icons/react'

interface DeviceCommandsProps {
  deviceId: string
  status: string
  onCommand: (type: string) => void
  loading?: boolean
}

export function DeviceCommands({ deviceId, status, onCommand, loading }: DeviceCommandsProps) {
  const isLocked = status === 'locked'

  return (
    <NCard>
      <h3 className="font-heading font-bold mb-4">Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        <NButton
          variant={isLocked ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => onCommand(isLocked ? 'unlock' : 'lock')}
          loading={loading}
        >
          {isLocked ? <LockOpen size={16} weight="bold" /> : <Lock size={16} weight="bold" />}
          {isLocked ? 'Unlock' : 'Lock'}
        </NButton>
        <NButton variant="accent" size="sm" onClick={() => onCommand('alarm')} loading={loading}>
          <Bell size={16} weight="bold" /> Alarm
        </NButton>
        <NButton variant="ghost" size="sm" onClick={() => onCommand('locate')} loading={loading}>
          <MapPin size={16} weight="bold" /> Locate
        </NButton>
        <NButton variant="danger" size="sm" onClick={() => onCommand('wipe')} loading={loading}>
          <Trash size={16} weight="bold" /> Wipe
        </NButton>
      </div>
    </NCard>
  )
}
```

- [ ] **Step 2: Create device health component**

```typescript
// src/components/devices/device-health.tsx
'use client'

import { NCard } from '@/components/ui/n-card'
import { BatteryHigh, HardDrive, Wifi, Cpu } from '@phosphor-icons/react'

interface DeviceHealthProps {
  batteryLevel: number | null
  batteryCharging: boolean | null
  storageUsed: number | null
  storageTotal: number | null
  ipAddress: string | null
  wifiSsid: string | null
  agentVersion: string | null
}

export function DeviceHealth({ batteryLevel, batteryCharging, storageUsed, storageTotal, ipAddress, wifiSsid, agentVersion }: DeviceHealthProps) {
  const storagePercent = storageUsed && storageTotal ? Math.round((storageUsed / storageTotal) * 100) : null

  return (
    <NCard>
      <h3 className="font-heading font-bold mb-4">Health</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <BatteryHigh size={20} weight="bold" />
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Battery</span>
              <span className="font-bold">{batteryLevel !== null ? `${batteryLevel}%` : '--'} {batteryCharging ? '⚡' : ''}</span>
            </div>
            {batteryLevel !== null && (
              <div className="h-3 border-2 border-dark bg-surface-alt">
                <div
                  className={`h-full transition-all ${batteryLevel > 20 ? 'bg-secondary' : 'bg-danger'}`}
                  style={{ width: `${batteryLevel}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <HardDrive size={20} weight="bold" />
          <div className="flex-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Storage</span>
              <span className="font-bold">{storageUsed}/{storageTotal} GB ({storagePercent}%)</span>
            </div>
            {storagePercent !== null && (
              <div className="h-3 border-2 border-dark bg-surface-alt mt-1">
                <div
                  className={`h-full transition-all ${storagePercent > 90 ? 'bg-danger' : storagePercent > 75 ? 'bg-accent' : 'bg-secondary'}`}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {wifiSsid && (
          <div className="flex items-center gap-3 text-sm">
            <Wifi size={20} weight="bold" />
            <span>{wifiSsid}</span>
          </div>
        )}

        {ipAddress && (
          <div className="flex items-center gap-3 text-sm">
            <Cpu size={20} weight="bold" />
            <span className="font-mono text-xs">{ipAddress}</span>
          </div>
        )}

        {agentVersion && (
          <p className="text-xs text-dark-light">Agent v{agentVersion}</p>
        )}
      </div>
    </NCard>
  )
}
```

- [ ] **Step 3: Create device detail page**

```typescript
// src/app/(dashboard)/devices/[id]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { useDevices } from '@/hooks/use-devices'
import { useLocations } from '@/hooks/use-locations'
import { NCard } from '@/components/ui/n-card'
import { NBadge } from '@/components/ui/n-badge'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { DeviceCommands } from '@/components/devices/device-commands'
import { DeviceHealth } from '@/components/devices/device-health'
import { timeAgo } from '@/lib/utils'
import dynamic from 'next/dynamic'

const LiveMap = dynamic(
  () => import('@/components/map/live-map').then((m) => m.LiveMap),
  { ssr: false }
)

const statusMood: Record<string, 'happy' | 'worried' | 'scared' | 'tired' | 'neutral'> = {
  online: 'happy', offline: 'worried', lost: 'scared', locked: 'neutral', wiped: 'tired',
}

const statusColor: Record<string, 'secondary' | 'default' | 'danger' | 'primary' | 'accent'> = {
  online: 'secondary', offline: 'default', lost: 'danger', locked: 'primary', wiped: 'accent',
}

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: devices = [], sendCommand } = useDevices()
  const { data: locations = [] } = useLocations(id)

  const device = devices.find((d: any) => d.id === id)

  if (!device) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <BlobDevice mood="worried" size={80} />
          <h2 className="font-heading font-bold text-xl mt-4">Device not found</h2>
        </div>
      </div>
    )
  }

  const mapDevices = device.lastLatitude && device.lastLongitude ? [{
    id: device.id,
    name: device.name,
    deviceType: device.deviceType,
    status: device.status,
    lat: device.lastLatitude,
    lng: device.lastLongitude,
    accuracy: device.lastAccuracy,
  }] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BlobDevice mood={statusMood[device.status]} type={device.deviceType} size={64} animate={false} />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold">{device.name}</h1>
            <NBadge variant={statusColor[device.status]}>{device.status}</NBadge>
          </div>
          <p className="text-dark-light text-sm">
            {device.platform} • {device.deviceType}
            {device.lastSeenAt && ` • Last seen ${timeAgo(device.lastSeenAt)}`}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LiveMap devices={mapDevices} />

          {locations.length > 0 && (
            <NCard>
              <h3 className="font-heading font-bold mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {locations.slice(0, 10).map((loc: any) => (
                  <div key={loc.id} className="flex items-center justify-between py-1.5 border-b-2 border-dark/10 last:border-0">
                    <span className="text-sm">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </span>
                    <span className="text-xs text-dark-light">{timeAgo(loc.recordedAt)}</span>
                  </div>
                ))}
              </div>
            </NCard>
          )}
        </div>

        <div className="space-y-4">
          <DeviceCommands
            deviceId={device.id}
            status={device.status}
            onCommand={(type) => sendCommand.mutate({ deviceId: device.id, type })}
            loading={sendCommand.isPending}
          />

          <DeviceHealth
            batteryLevel={device.batteryLevel}
            batteryCharging={device.batteryCharging}
            storageUsed={device.storageUsed}
            storageTotal={device.storageTotal}
            ipAddress={device.ipAddress}
            wifiSsid={device.wifiSsid}
            agentVersion={device.agentVersion}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: device detail page with live map, health stats, remote commands"
```

---

### Task 13: Socket.io WebSocket Server & Client

**Files:**
- Create: `src/lib/socket/server.ts`
- Create: `src/app/api/socket/route.ts`
- Create: `src/hooks/use-socket.ts`

- [ ] **Step 1: Create Socket.io server utility**

```typescript
// src/lib/socket/server.ts
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import type { NextApiResponse } from 'next'

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & { io?: SocketIOServer }
  }
}

export function getSocketIO(res: NextApiResponseWithSocket): SocketIOServer {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: { origin: '*' },
    })

    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`)

      socket.on('subscribe:device', (deviceId: string) => {
        socket.join(`device:${deviceId}`)
      })

      socket.on('unsubscribe:device', (deviceId: string) => {
        socket.leave(`device:${deviceId}`)
      })

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`)
      })
    })

    res.socket.server.io = io
  }
  return res.socket.server.io
}

export function emitDeviceLocation(io: SocketIOServer, deviceId: string, location: {
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  batteryLevel?: number
  recordedAt: string
}) {
  io.to(`device:${deviceId}`).emit('location:update', { deviceId, ...location })
}
```

- [ ] **Step 2: Create Socket.io route handler**

```typescript
// src/app/api/socket/route.ts
import { NextRequest } from 'next/server'
import { getSocketIO } from '@/lib/socket/server'
import type { NextApiResponseWithSocket } from '@/lib/socket/server'

// Socket.io uses a custom handler approach with Next.js
// In App Router, socket.io is initialized via a custom server or middleware
// For Phase 1, we use a simple Server-Sent Events fallback

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const deviceId = searchParams.get('deviceId')

  if (!deviceId) {
    return new Response('Missing deviceId', { status: 400 })
  }

  let closed = false
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval)
          return
        }
        try {
          controller.enqueue(`data: {"type":"heartbeat","timestamp":"${new Date().toISOString()}"}\n\n`)
        } catch { clearInterval(interval) }
      }, 15000)

      req.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(interval)
      })
    },
    cancel() {
      closed = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

- [ ] **Step 3: Create useSocket hook**

```typescript
// src/hooks/use-socket.ts
'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/app-store'

export function useSocket(deviceId: string | null, onLocationUpdate?: (data: any) => void) {
  const accessToken = useAppStore((s) => s.accessToken)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!deviceId || !accessToken) return

    const es = new EventSource(`/api/socket?deviceId=${deviceId}`)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'location:update') {
          onLocationUpdate?.(data)
        }
      } catch {}
    }

    es.onerror = () => {
      es.close()
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          const newEs = new EventSource(`/api/socket?deviceId=${deviceId}`)
          eventSourceRef.current = newEs
        }
      }, 5000)
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [deviceId, accessToken, onLocationUpdate])
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: real-time socket layer — SSE fallback for Phase 1, Socket.io server scaffolded"
```

---

### Task 14: Location Ingestion Endpoint (Device Agent API)

**Files:**
- Create: `src/app/api/ingest/location/route.ts`
- Create: `src/app/api/ingest/health/route.ts`

- [ ] **Step 1: Create location ingestion endpoint**

```typescript
// src/app/api/ingest/location/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devices, locations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const locationSchema = z.object({
  deviceId: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  source: z.enum(['gps', 'wifi', 'cell', 'ble']),
  batteryLevel: z.number().min(0).max(100).optional(),
  storageUsed: z.number().optional(),
  storageTotal: z.number().optional(),
  ipAddress: z.string().optional(),
  wifiSsid: z.string().optional(),
  agentVersion: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const agentToken = req.headers.get('x-agent-token')

  // Phase 1: use device-specific token or JWT
  if (!agentToken) {
    return NextResponse.json({ error: 'Missing agent token' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = locationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Verify device exists
    const [device] = await db.select({ id: devices.id }).from(devices).where(eq(devices.id, data.deviceId)).limit(1)
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    // Update device status
    const updateData: any = {
      status: 'online',
      lastLatitude: data.latitude,
      lastLongitude: data.longitude,
      lastAccuracy: data.accuracy,
      lastSeenAt: new Date(),
    }
    if (data.batteryLevel !== undefined) updateData.batteryLevel = data.batteryLevel
    if (data.ipAddress) updateData.ipAddress = data.ipAddress
    if (data.wifiSsid) updateData.wifiSsid = data.wifiSsid
    if (data.agentVersion) updateData.agentVersion = data.agentVersion
    if (data.storageUsed !== undefined) updateData.storageUsed = data.storageUsed
    if (data.storageTotal !== undefined) updateData.storageTotal = data.storageTotal

    await db.update(devices).set({ ...updateData, updatedAt: new Date() }).where(eq(devices.id, data.deviceId))

    // Store location record
    const [location] = await db.insert(locations).values({
      deviceId: data.deviceId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      altitude: data.altitude,
      speed: data.speed,
      heading: data.heading,
      source: data.source,
      batteryLevel: data.batteryLevel,
    }).returning()

    // In production: publish to Kafka for real-time fan-out

    return NextResponse.json({ success: true, locationId: location.id })
  } catch (error) {
    console.error('Location ingestion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create health ingestion endpoint**

```typescript
// src/app/api/ingest/health/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { devices } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const healthSchema = z.object({
  deviceId: z.string().uuid(),
  batteryLevel: z.number().min(0).max(100).optional(),
  batteryCharging: z.boolean().optional(),
  storageUsed: z.number().optional(),
  storageTotal: z.number().optional(),
  ipAddress: z.string().optional(),
  wifiSsid: z.string().optional(),
  agentVersion: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const agentToken = req.headers.get('x-agent-token')
  if (!agentToken) {
    return NextResponse.json({ error: 'Missing agent token' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = healthSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const data = parsed.data
    const updateData: any = { lastSeenAt: new Date() }

    if (data.batteryLevel !== undefined) updateData.batteryLevel = data.batteryLevel
    if (data.batteryCharging !== undefined) updateData.batteryCharging = data.batteryCharging
    if (data.storageUsed !== undefined) updateData.storageUsed = data.storageUsed
    if (data.storageTotal !== undefined) updateData.storageTotal = data.storageTotal
    if (data.ipAddress) updateData.ipAddress = data.ipAddress
    if (data.wifiSsid) updateData.wifiSsid = data.wifiSsid
    if (data.agentVersion) updateData.agentVersion = data.agentVersion

    await db.update(devices).set(updateData).where(eq(devices.id, data.deviceId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Health ingestion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: device agent ingestion endpoints — location and health data intake"
```

---

### Task 15: Wire Everything Together & Test

**Files:** N/A (integration testing, bug fixes)

- [ ] **Step 1: Generate drizzle migrations**

```bash
npx drizzle-kit generate:pg
```

Expected: Migration files generated in `drizzle/` folder.

- [ ] **Step 2: Push migrations to database**

```bash
npx drizzle-kit push:pg
```

Expected: Tables created from schema. Verify: `docker exec -it lapso-postgres-1 psql -U lapso -c "\dt"`

- [ ] **Step 3: Seed test data**

```sql
-- Run in psql or via drizzle
INSERT INTO users (id, email, name, password_hash) VALUES 
  (gen_random_uuid(), 'demo@lapso.dev', 'Demo User', '$argon2id$...');
```

Or create a seed script:

```typescript
// src/lib/db/seed.ts
import { db } from './index'
import { users } from './schema'
import { hashPassword } from '../auth/password'

async function seed() {
  const passwordHash = await hashPassword('demo123456')
  await db.insert(users).values({ email: 'demo@lapso.dev', name: 'Demo', passwordHash })
  console.log('Seed complete')
}

seed()
```

```bash
npx tsx src/lib/db/seed.ts
```

- [ ] **Step 4: Start dev server and test**

```bash
npm run dev
```

Expected flow:
1. Visit `http://localhost:3000` → Landing page
2. Click "Get Started" → Register page
3. Register → Redirected to `/welcome`
4. Complete onboarding → Dashboard
5. Add a device → Device card appears
6. Click device → Device detail page
7. Send a command → 201 response

- [ ] **Step 5: Install and run Vitest for integration tests**

```bash
npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: database migrations, seed data, integration smoke tests"
```

---

**Phase 1 MVP Complete.** User can register, log in, add devices, see live map, view device health, send commands, and devices can report location via agent API.

---

*(Phases 2-5 will be planned after Phase 1 is built and validated)*