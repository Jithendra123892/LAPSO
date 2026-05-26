'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

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
  online: '#4ECDC4', offline: '#636E72', lost: '#FF4757', locked: '#A855F7', wiped: '#DFE6E9',
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