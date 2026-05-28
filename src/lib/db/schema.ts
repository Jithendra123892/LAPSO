import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  publicKey: text('public_key'),
  encryptedPrivateKey: text('encrypted_private_key'),
  keySalt: text('key_salt'),
  totpSecret: text('totp_secret'),
  totpEnabled: integer('totp_enabled', { mode: 'boolean' }).default(false),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Refresh Tokens
export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Devices
export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  deviceType: text('device_type').notNull(),
  platform: text('platform').notNull(),
  status: text('status').default('offline').notNull(),
  lastLatitude: real('last_latitude'),
  lastLongitude: real('last_longitude'),
  lastAccuracy: real('last_accuracy'),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),
  batteryLevel: integer('battery_level'),
  batteryCharging: integer('battery_charging', { mode: 'boolean' }),
  storageUsed: integer('storage_used'),
  storageTotal: integer('storage_total'),
  ipAddress: text('ip_address'),
  wifiSsid: text('wifi_ssid'),
  agentVersion: text('agent_version'),
  publicKey: text('public_key'),
  encryptedDeviceKey: text('encrypted_device_key'),
  metadata: text('metadata').default('{}'), // JSON stored as text
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Location History
export const locations = sqliteTable('locations', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  accuracy: real('accuracy'),
  altitude: real('altitude'),
  speed: real('speed'),
  heading: real('heading'),
  source: text('source').notNull(), // gps | wifi | cell | ble
  batteryLevel: integer('battery_level'),
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull(),
})

// Geofences
export const geofences = sqliteTable('geofences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  coordinates: text('coordinates').notNull(), // JSON: {lat, lng}
  radius: real('radius'),
  notifyOnEnter: integer('notify_on_enter', { mode: 'boolean' }).default(true),
  notifyOnExit: integer('notify_on_exit', { mode: 'boolean' }).default(true),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  color: text('color').default('#FF6B6B'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Commands
export const commands = sqliteTable('commands', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // lock | unlock | wipe | alarm | message | locate
  payload: text('payload').default('{}'), // JSON stored as text
  status: text('status').default('pending').notNull(),
  result: text('result'),
  executedAt: integer('executed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Alerts
export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceId: text('device_id').references(() => devices.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  severity: text('severity').default('info').notNull(), // info | warning | critical
  title: text('title').notNull(),
  message: text('message'),
  metadata: text('metadata').default('{}'), // JSON stored as text
  read: integer('read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Evidence
export const evidence = sqliteTable('evidence', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  alertId: text('alert_id').references(() => alerts.id, { onDelete: 'set null' }),
  type: text('type').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  lat: real('lat'),
  lng: real('lng'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Teams
export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Team Members
export const teamMembers = sqliteTable('team_members', {
  id: text('id').primaryKey(),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').default('member').notNull(), // owner | admin | manager | member
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull(),
})

// Audit Logs
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'set null' }),
  deviceId: text('device_id').references(() => devices.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  detail: text('detail'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Beacons
export const beacons = sqliteTable('beacons', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  uuid: text('uuid').notNull().unique(),
  major: integer('major'),
  minor: integer('minor'),
  lat: real('lat'),
  lng: real('lng'),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})