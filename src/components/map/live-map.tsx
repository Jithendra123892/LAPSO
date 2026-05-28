'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { LocationMarker } from './location-marker'

interface DeviceLocation {
  id: string
  name: string
  deviceType: string
  status: string
  lat: number
  lng: number
  accuracy?: number
}

function MapFitter({ devices }: { devices: DeviceLocation[] }) {
  const map = useMap()
  useEffect(() => {
    const active = devices.filter((d) => d.lat && d.lng)
    if (active.length > 0) {
      const bounds = active.map((d) => [d.lat, d.lng] as [number, number])
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [devices, map])
  return null
}

export function LiveMap({ devices }: { devices: DeviceLocation[] }) {
  const mapRef = useRef<L.Map | null>(null)

  return (
    <div className="relative border-3 border-dark shadow-neo overflow-hidden" style={{ height: '400px' }}>
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        className="h-full w-full"
        ref={mapRef as any}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {devices.map((device) => (
          device.lat && device.lng && <LocationMarker key={device.id} device={device} />
        ))}
        <MapFitter devices={devices} />
      </MapContainer>
    </div>
  )
}