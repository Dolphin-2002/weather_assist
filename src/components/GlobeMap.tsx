import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { Map } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
export const GlobeMap = forwardRef<{ flyTo: (query: string) => void }, { place: string }>(({ place }, ref) => {
  const container = useRef<HTMLDivElement>(null); const map = useRef<Map | null>(null)
  useEffect(() => { if (!container.current || map.current) return; const instance = new maplibregl.Map({ container: container.current, style: 'https://demotiles.maplibre.org/globe.json', center: [0, 15], zoom: 1.3, attributionControl: false }); map.current = instance; instance.on('load', () => instance.setProjection({ type: 'globe' })); return () => { instance.remove(); map.current = null } }, [])
  useImperativeHandle(ref, () => ({ flyTo: async (query: string) => { try { const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`); const data = await response.json(); const result = data.results?.[0]; if (result) map.current?.flyTo({ center: [result.longitude, result.latitude], zoom: 5, duration: 1900, essential: true }) } catch { /* Location lookup gracefully fails offline. */ } } }))
  return <div className="globe-map"><div ref={container} className="map-canvas" /><div className="map-pin" /><div className="map-overlay">Viewing {place}</div></div>
})
GlobeMap.displayName = 'GlobeMap'
