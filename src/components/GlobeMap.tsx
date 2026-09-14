import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import type { GlobeMethods } from 'react-globe.gl';

// ── Public handle ──────────────────────────────────────────────────────────────
export interface GlobeMapHandle {
  /** Fly the globe to coords AND drop/update the search pin */
  showLocation(lat: number, lng: number, label: string, temp?: number): void;
}

// ── Marker types ───────────────────────────────────────────────────────────────
interface GlobeMarker {
  lat: number;
  lng: number;
  label: string;
  temp?: number;
  kind: 'user' | 'search';
}

// ── Reverse geocoding (Nominatim — free, no key) ───────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const data = await res.json() as {
      address?: { city?: string; town?: string; village?: string; county?: string; country?: string };
    };
    const a = data.address;
    const city = a?.city ?? a?.town ?? a?.village ?? a?.county ?? 'Your Location';
    return a?.country ? `${city}, ${a.country}` : city;
  } catch {
    return 'Your Location';
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
interface GlobeMapProps {
  onLocationName?: (name: string, lat: number, lng: number) => void;
}

const GlobeMap = forwardRef<GlobeMapHandle, GlobeMapProps>(function GlobeMap(
  { onLocationName },
  ref,
) {
  const globeEl      = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize]       = useState(560);
  const [markers, setMarkers] = useState<GlobeMarker[]>([]);

  // ── Expose showLocation ───────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    showLocation(lat, lng, label, temp) {
      const g = globeEl.current;
      if (!g) return;

      // Replace any existing search pin, keep user pin
      setMarkers((prev) => [
        ...prev.filter((m) => m.kind === 'user'),
        { lat, lng, label, temp, kind: 'search' },
      ]);

      // Fly there
      g.controls().autoRotate = false;
      g.pointOfView({ lat, lng, altitude: 1.8 }, 1200);
      setTimeout(() => {
        globeEl.current?.controls() && (globeEl.current.controls().autoRotate = true);
      }, 2400);
    },
  }));

  // ── Responsive canvas ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w > 0) setSize(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Globe init + live geolocation ─────────────────────────────────────────────
  useEffect(() => {
    const g = globeEl.current;
    if (!g) return;

    g.controls().autoRotate      = true;
    g.controls().autoRotateSpeed = 0.6;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        const cityName = await reverseGeocode(lat, lng);

        // Add user pin only
        setMarkers((prev) => [
          ...prev.filter((m) => m.kind !== 'user'),
          { lat, lng, label: cityName, kind: 'user' },
        ]);

        // Fly to user position
        globeEl.current?.pointOfView({ lat, lng, altitude: 1.8 }, 1500);

        onLocationName?.(cityName, lat, lng);
      },
      () => { /* permission denied — globe keeps rotating */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── HTML marker factory ───────────────────────────────────────────────────────
  const makeElement = (d: object): HTMLElement => {
    const m   = d as GlobeMarker;
    const wrap = document.createElement('div');

    if (m.kind === 'user') {
      wrap.innerHTML = `
        <div class="globe-user-pin">
          <div class="globe-user-pulse"></div>
          <div class="globe-user-dot"></div>
          <div class="globe-user-label">${m.label}</div>
        </div>`;
    } else {
      // Search pin
      const tempStr = m.temp !== undefined ? ` · ${m.temp}°C` : '';
      wrap.innerHTML = `
        <div class="globe-search-pin">
          <div class="globe-search-dot"></div>
          <div class="globe-search-label">${m.label}${tempStr}</div>
        </div>`;
    }

    return wrap;
  };

  return (
    <div ref={containerRef} className="globe-frame">
      <Globe
        ref={globeEl}
        width={size}
        height={size}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        htmlElementsData={markers}
        htmlElement={makeElement}
      />
    </div>
  );
});

export default GlobeMap;
