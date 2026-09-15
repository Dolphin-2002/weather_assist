import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import type { GlobeMethods } from 'react-globe.gl'

export interface GlobeMapHandle {
  flyTo(lat: number, lng: number): void
  showLocation(lat: number, lng: number, label: string, temp?: number): void
}

interface GlobeMarker {
  lat: number
  lng: number
  city?: string
  temp?: number
  label?: string
  kind: 'city' | 'user' | 'search'
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    )
    const data = await response.json() as {
      address?: {
        city?: string
        town?: string
        village?: string
        county?: string
        country?: string
      }
    }
    const address = data.address
    const city = address?.city ?? address?.town ?? address?.village ?? address?.county ?? 'Your Location'
    return address?.country ? `${city}, ${address.country}` : city
  } catch {
    return 'Your Location'
  }
}

interface GlobeMapProps {
  onLocationName?: (name: string, lat: number, lng: number) => void
}

const GlobeMap = forwardRef<GlobeMapHandle, GlobeMapProps>(function GlobeMap(
  { onLocationName },
  ref,
) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(560)
  const [markers, setMarkers] = useState<GlobeMarker[]>([])

  useImperativeHandle(ref, () => ({
    flyTo(lat, lng) {
      const globe = globeRef.current
      if (!globe) return
      globe.controls().autoRotate = false
      globe.pointOfView({ lat, lng, altitude: 1.8 }, 1200)
      window.setTimeout(() => {
        if (globeRef.current) globeRef.current.controls().autoRotate = true
      }, 2200)
    },

    showLocation(lat, lng, label, temp) {
      setMarkers((previous) => [
        ...previous.filter((marker) => marker.kind === 'user'),
        { lat, lng, label, temp, kind: 'search' },
      ])

      const globe = globeRef.current
      if (!globe) return
      globe.controls().autoRotate = false
      globe.pointOfView({ lat, lng, altitude: 1.8 }, 1200)
      window.setTimeout(() => {
        if (globeRef.current) globeRef.current.controls().autoRotate = true
      }, 2200)
    },
  }), [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      if (width > 0) setSize(width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const globe = globeRef.current
    if (!globe || !navigator.geolocation) return

    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.6

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        const cityName = await reverseGeocode(lat, lng)
        globeRef.current?.pointOfView({ lat, lng, altitude: 1.8 }, 1500)
        setMarkers((previous) => [
          ...previous.filter((marker) => marker.kind !== 'user'),
          { lat, lng, label: cityName, kind: 'user' },
        ])
        onLocationName?.(cityName, lat, lng)
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    )
  }, [onLocationName])

  const makeElement = (data: object): HTMLElement => {
    const marker = data as GlobeMarker
    const wrapper = document.createElement('div')

    if (marker.kind === 'user') {
      wrapper.innerHTML = `
        <div class="globe-user-pin">
          <div class="globe-user-pulse"></div>
          <div class="globe-user-dot"></div>
          <div class="globe-user-label">${marker.label ?? 'Your Location'}</div>
        </div>`
      return wrapper
    }

    if (marker.kind === 'search') {
      const tempText = marker.temp === undefined ? '' : ` · ${marker.temp}°C`
      wrapper.innerHTML = `
        <div class="globe-search-pin">
          <div class="globe-search-dot"></div>
          <div class="globe-search-label">${marker.label ?? ''}${tempText}</div>
        </div>`
      return wrapper
    }

    wrapper.innerHTML = `<div class="globe-city-pin"><b>${marker.city ?? ''}</b>: ${marker.temp ?? 0}°C</div>`
    wrapper.addEventListener('click', () => {
      const globe = globeRef.current
      if (!globe) return
      globe.controls().autoRotate = false
      globe.pointOfView({ lat: marker.lat, lng: marker.lng, altitude: 1.8 }, 800)
      window.setTimeout(() => {
        if (globeRef.current) globeRef.current.controls().autoRotate = true
      }, 1500)
    })
    return wrapper
  }

  return (
    <div ref={containerRef} className="globe-frame">
      <Globe
        ref={globeRef}
        width={size}
        height={size}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        htmlElementsData={markers}
        htmlElement={makeElement}
      />
    </div>
  )
})

export default GlobeMap
