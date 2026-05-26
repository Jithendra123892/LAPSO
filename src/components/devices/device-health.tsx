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
    <div className="neo-card">
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
                <div className={`h-full transition-all ${batteryLevel > 20 ? 'bg-secondary' : 'bg-danger'}`} style={{ width: `${batteryLevel}%` }} />
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
                <div className={`h-full transition-all ${storagePercent > 90 ? 'bg-danger' : storagePercent > 75 ? 'bg-accent' : 'bg-secondary'}`} style={{ width: `${storagePercent}%` }} />
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

        {agentVersion && <p className="text-xs text-dark-light">Agent v{agentVersion}</p>}
      </div>
    </div>
  )
}