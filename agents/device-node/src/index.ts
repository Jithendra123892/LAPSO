#!/usr/bin/env node
/**
 * LAPSO Device Agent — CLI entry point
 */
import * as fs from 'fs'
import * as path from 'path'
import { homedir } from 'os'
import { randomUUID } from 'crypto'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { LapsoAgent, log, warn, error } from './agent'

const CONFIG_PATH = path.join(homedir(), '.lapso', 'agent.json')

interface SavedConfig {
  deviceId: string
  serverUrl: string
  token: string
}

function saveConfig(config: SavedConfig): void {
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

function loadConfig(): SavedConfig | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
    }
  } catch {}
  return null
}

async function main() {
  const savedConfig = loadConfig()

  const argv = await yargs(hideBin(process.argv))
    .option('device-id', {
      alias: 'd',
      type: 'string',
      describe: 'Device UUID (generates new if not provided)',
    })
    .option('server-url', {
      alias: 's',
      type: 'string',
      describe: 'LAPSO server URL',
      default: savedConfig?.serverUrl || process.env.LAPSO_SERVER_URL || 'http://localhost:3000',
    })
    .option('token', {
      alias: 't',
      type: 'string',
      describe: 'Agent token from LAPSO settings',
    })
    .option('location-interval', {
      type: 'number',
      default: 30000,
      describe: 'Location report interval (ms)',
    })
    .option('health-interval', {
      type: 'number',
      default: 60000,
      describe: 'Health report interval (ms)',
    })
    .demandOption(['token'])
    .argv

  const deviceId: string = argv['device-id'] || savedConfig?.deviceId || randomUUID()
  const serverUrl: string = argv['server-url']
  const token: string = argv['token']

  const config: SavedConfig = { deviceId, serverUrl, token }
  saveConfig(config)

  const agent = new LapsoAgent({
    deviceId,
    serverUrl,
    token,
    locationIntervalMs: argv['location-interval'],
    healthIntervalMs: argv['health-interval'],
  })

  // Handle command events (from server pushed commands)
  agent.on('command', (cmd) => {
    log(`Server command: ${cmd.type}`)
  })

  // Clean shutdown
  process.on('SIGINT', async () => {
    log('Received SIGINT, shutting down...')
    await agent.stop()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    log('Received SIGTERM, shutting down...')
    await agent.stop()
    process.exit(0)
  })

  try {
    await agent.start()
    log(`[CLI] Agent running. Config saved to ${CONFIG_PATH}`)
  } catch (err) {
    error(`Failed to start: ${err}`)
    process.exit(1)
  }
}

main()