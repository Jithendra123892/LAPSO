import {
  pgTable, uuid, varchar, text, timestamp, doublePrecision,
  boolean, jsonb, pgEnum, integer
} from 'drizzle-orm/pg-core'

// Enums
export const deviceStatusEnum = pgEnum('device_status', ['online', 'offline', 'lost', 'locked', 'wiped'])
export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'manager', 'member'])
export const alertSeverityEnum = pgEnum('alert_severity', ['info', 'warning', 'critical'])
export const commandTypeEnum = pgEnum('command_type', ['lock', 'unlock', 'wipe', 'alarm', 'message', 'locate'])
export const locationSourceEnum = pgEnum('location_source', ['gps', 'wifi', 'cell', 'ble'])

// Users
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
})

// Refresh Tokens
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Devices
export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  deviceType: varchar('device_type', { length: 50 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  status: deviceStatusEnum('status').default('offline').notNull(),
  lastLatitude: doublePrecision('last_latitude'),
  lastLongitude: doublePrecision('last_longitude'),
  lastAccuracy: doublePrecision('last_accuracy'),
  lastSeenAt: timestamp('last_seen_at'),
  batteryLevel: integer('battery_level'),
  batteryCharging: boolean('battery_charging'),
  storageUsed: integer('storage_used'),
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

// Location History
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'cascade' }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  accuracy: doublePrecision('accuracy'),
  altitude: doublePrecision('altitude'),
  speed: doublePrecision('speed'),
  heading: doublePrecision('heading'),
  source: locationSourceEnum('source').notNull(),
  batteryLevel: integer('battery_level'),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
})

// Geofences
export const geofences = pgTable('geofences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  coordinates: jsonb('coordinates').notNull(),
  radius: doublePrecision('radius'),
  notifyOnEnter: boolean('notify_on_enter').default(true),
  notifyOnExit: boolean('notify_on_exit').default(true),
  enabled: boolean('enabled').default(true),
  color: varchar('color', { length: 7 }).default('#FF6B6B'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Commands
export const commands = pgTable('commands', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'cascade' }).notNull(),
  type: commandTypeEnum('type').notNull(),
  payload: jsonb('payload').default({}),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  result: text('result'),
  executedAt: timestamp('executed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Alerts
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  severity: alertSeverityEnum('severity').default('info').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  metadata: jsonb('metadata').default({}),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Evidence
export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'cascade' }).notNull(),
  alertId: uuid('alert_id').references(() => alerts.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 20 }).notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Teams
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Team Members
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: userRoleEnum('role').default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
})

// Audit Logs
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

// Beacons
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