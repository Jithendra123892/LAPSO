import { BatteryHigh, BatteryLow, BatteryMedium, BatteryWarning, Lightning, WifiHigh, Cpu, HardDrive } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface DeviceHealthProps {
  batteryLevel: number | null
  batteryCharging: boolean | null
  storageUsed: number | number | null
  storageTotal: number | null
  ipAddress: string | null
  wifiSsid: string | null
  agentVersion: string | null
}

function MetricBar({ percent, color, label, icon: Icon }: { percent: number; color: string; label: string; icon: any }) {
  const isCritical = percent > 90
  const isWarning = percent > 75 && !isCritical

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 border-2 border-dark flex items-center justify-center flex-shrink-0" style={{ background: color + '22' }}>
        <Icon size={16} weight="bold" style={{ color }} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-heading font-bold text-xs text-dark">{label}</span>
          <span className="font-mono font-bold text-xs" style={{ color }}>
            {percent}%
          </span>
        </div>
        <div className="h-3 border-2 border-dark bg-surface-alt overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="h-full relative"
            style={{ backgroundColor: color }}
          >
            {(isCritical || isWarning) && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="absolute inset-0 bg-white/30"
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, value }: { icon: any; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={14} weight="bold" className="text-secondary flex-shrink-0" />
      <span className="font-mono text-xs text-dark-light break-all">{value}</span>
    </div>
  )
}

export function DeviceHealth({ batteryLevel, batteryCharging, storageUsed, storageTotal, ipAddress, wifiSsid, agentVersion }: DeviceHealthProps) {
  const storagePercent = storageUsed && storageTotal ? Math.round((Number(storageUsed) / Number(storageTotal)) * 100) : null

  const batColor = batteryLevel === null ? '#636E72' : batteryLevel > 40 ? '#4ECDC4' : batteryLevel > 20 ? '#FFE66D' : '#FF4757'
  const storColor = storagePercent === null ? '#636E72' : storagePercent > 90 ? '#FF4757' : storagePercent > 75 ? '#FFE66D' : '#4ECDC4'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className="neo-card"
    >
      <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-none bg-secondary inline-block animate-pulse" />
        Health
      </h3>
      <div className="space-y-4">
        {batteryLevel !== null && (
          <MetricBar percent={batteryLevel} color={batColor} label="Battery" icon={batteryLevel > 60 ? BatteryHigh : batteryLevel > 20 ? BatteryMedium : BatteryLow} />
        )}
        {storagePercent !== null && (
          <MetricBar percent={storagePercent} color={storColor} label="Storage" icon={HardDrive} />
        )}
        {wifiSsid && <InfoRow icon={WifiHigh} value={wifiSsid} />}
        {ipAddress && <InfoRow icon={Cpu} value={ipAddress} />}
        {batteryCharging && (
          <div className="flex items-center gap-2 text-xs font-heading font-bold text-secondary">
            <Lightning size={14} weight="fill" />
            Charging
          </div>
        )}
        {agentVersion && <p className="font-mono text-[10px] text-dark-light pt-1">Agent v{agentVersion}</p>}
      </div>
    </motion.div>
  )
}