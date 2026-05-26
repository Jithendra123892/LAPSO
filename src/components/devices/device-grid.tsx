import { DeviceCard } from './device-card'
import { BlobDevice } from './blob-device'

export function DeviceGrid({ devices, onAddClick }: { devices: any[]; onAddClick: () => void }) {
  if (devices.length === 0) {
    return (
      <div className="neo-card text-center py-16">
        <div className="flex justify-center mb-4">
          <BlobDevice mood="neutral" size={80} />
        </div>
        <h3 className="font-heading font-bold text-xl mb-2">No devices yet</h3>
        <p className="text-dark-light text-sm mb-6 max-w-sm mx-auto">
          Add your first device to start tracking. Install the LAPSO agent on your laptop or phone.
        </p>
        <button className="neo-btn-primary" onClick={onAddClick}>+ Add Device</button>
      </div>
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