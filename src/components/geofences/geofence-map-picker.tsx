'use client'

import { MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet'
import { Crosshair } from '@phosphor-icons/react'

function AddGeofenceMode({ onAdd }: { onAdd: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onAdd(e.latlng.lat, e.latlng.lng) },
  })
  return null
}

interface GeofenceMapPickerProps {
  selectedCoords: { lat: number; lng: number } | null
  onSelect: (c: { lat: number; lng: number } | null) => void
  radius: number
  color: string
}

export function GeofenceMapPicker({ selectedCoords, onSelect, radius, color }: GeofenceMapPickerProps) {
  return (
    <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <AddGeofenceMode onAdd={(lat, lng) => onSelect({ lat, lng })} />
      {selectedCoords && (
        <Circle
          center={[selectedCoords.lat, selectedCoords.lng]}
          radius={radius}
          pathOptions={{ color, fillOpacity: 0.2, weight: 3, dashArray: '5,5' }}
        />
      )}
    </MapContainer>
  )
}