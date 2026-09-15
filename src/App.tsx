import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowUpRight, Bot, CloudSun, Droplets,
  House, Map as MapIcon, Navigation,
  Search, Sunrise, Sun, Wind,
} from 'lucide-react'
import GlobeMap from './components/GlobeMap.tsx'
import type { GlobeMapHandle } from './components/GlobeMap.tsx'
import { fetchWeather } from './lib/weather.ts'
import type { WeatherData } from './lib/weather.ts'
import { FluidOrb } from './components/FluidOrb'
import { GooeyNav } from './components/ui/gooey-nav'
import ChatBox from './components/ChatBox.tsx'
import logo from './assets/images/weather_assist_logo.jpg'
import bannerOne from './assets/images/2.jpg'
import bannerTwo from './assets/images/3.jpg'
import bannerThree from './assets/images/4.jpg'
import bannerFour from './assets/images/5.jpg'
import './App.css'
import './nav-ai.css'

// ── Static data ────────────────────────────────────────────────────────────────
const banners  = [bannerOne, bannerTwo, bannerThree, bannerFour]
const navItems = [
  { label: 'Home',    href: '#home',  icon: House    },
  { label: 'Weather', href: '#today', icon: CloudSun },
  { label: 'Map',     href: '#world', icon: MapIcon  },
  { label: 'AI',      href: '#ai',    icon: Bot      },
]

// ── UV label helper ────────────────────────────────────────────────────────────
function uvLabel(uv: number) {
  if (uv <= 2)  return 'Low'
  if (uv <= 5)  return 'Moderate'
  if (uv <= 7)  return 'High'
  if (uv <= 10) return 'Very High'
  return 'Extreme'
}

// ── Open-Meteo geocoding — free, no API key ────────────────────────────────────
interface GeoResult { lat: number; lng: number; label: string }

async function geocodeCity(query: string): Promise<GeoResult | null> {
  try {
    const res  = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
    )
    const data = await res.json() as {
      results?: Array<{ latitude: number; longitude: number; name: string; country: string }>
    }
    if (!data.results?.length) return null
    const r = data.results[0]
    return { lat: r.latitude, lng: r.longitude, label: `${r.name}, ${r.country}` }
  } catch {
    return null
  }
}

// ── App ────────────────────────────────────────────────────────────────────────
function App() {
  const [activeBanner, setActiveBanner]   = useState(0)
  const [activeNav, setActiveNav]         = useState(0)
  const [place, setPlace]                 = useState('Detecting location…')
  const [searchValue, setSearchValue]     = useState('')
  const [isSearching, setIsSearching]     = useState(false)
  const [weather, setWeather]             = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [showForecastDetails, setShowForecastDetails] = useState(false)
  const mapRef = useRef<GlobeMapHandle>(null)

  // ── Load weather for a given lat/lng ──────────────────────────────────────────
  const loadWeather = useCallback(async (lat: number, lng: number) => {
    setWeatherLoading(true)
    try {
      const data = await fetchWeather(lat, lng)
      setWeather(data)
      return data
    } catch {
      // keep previous data on error
    } finally {
      setWeatherLoading(false)
    }
  }, [])

  // ── On user's live location resolved (from GlobeMap) ──────────────────────────
  const handleLocationName = useCallback((name: string, lat?: number, lng?: number) => {
    setPlace(name)
    if (lat !== undefined && lng !== undefined) loadWeather(lat, lng)
  }, [loadWeather])

  // ── Banner auto-cycle ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = window.setInterval(() => setActiveBanner((c) => (c + 1) % banners.length), 3000)
    return () => window.clearInterval(t)
  }, [])

  // ── Geocode text search → fly globe + fetch weather ───────────────────────────
  const searchLocation = async (event: FormEvent) => {
    event.preventDefault()
    const value = searchValue.trim()
    if (!value || isSearching) return
    setIsSearching(true)
    const result = await geocodeCity(value)
    setIsSearching(false)
    if (!result) return

    setPlace(result.label)
    setSearchValue('')

    // 1. Fly + pin immediately (no temp yet — feels instant)
    mapRef.current?.showLocation(result.lat, result.lng, result.label)
    document.querySelector('#world')?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // 2. Fetch weather, then update the pin label with the live temperature
    const weatherData = await loadWeather(result.lat, result.lng)
    if (weatherData) {
      mapRef.current?.showLocation(result.lat, result.lng, result.label, weatherData.current.temp)
    }
  }

  // ── Derived display values ─────────────────────────────────────────────────────
  const cur      = weather?.current
  const forecast = weather?.forecast ?? []

  const tempDisplay    = cur  ? `${cur.temp}`            : '—'
  const feelsDisplay   = cur  ? `Feels like ${cur.feelsLike}°` : ''
  const humDisplay     = cur  ? `${cur.humidity}%`       : '—'
  const windDisplay    = cur  ? `${cur.windSpeed} km/h`  : '—'
  const uvDisplay      = cur  ? String(cur.uvIndex)      : '—'
  const uvLabelText    = cur  ? uvLabel(cur.uvIndex)     : ''
  const sunsetDisplay  = cur  ? cur.sunset               : '—'
  const conditionLabel = cur  ? cur.conditionLabel       : 'Loading…'
  const tempLow        = forecast[0]?.low  ?? '—'
  const tempHigh       = forecast[0]?.high ?? '—'

  return (
    <main>
      {/* ── Top nav ── */}
      <nav className="topbar">
        <a className="brand" href="#home" aria-label="Weather Assist home">
          <img src={logo} alt="Weather Assist" />
          <span>weather<span>assist</span></span>
        </a>
        <GooeyNav items={navItems} value={activeNav} onChange={setActiveNav} />
      </nav>

      {/* ── Hero / banner ── */}
      <section id="home" className="hero-section">
        <div className="banner-stack" aria-label="Weather photography">
          {banners.map((banner, index) => (
            <img key={banner} src={banner} className={index === activeBanner ? 'active' : ''} alt="" />
          ))}
          <div className="banner-overlay" />
        </div>
        <div className="hero-content">
          <p className="eyebrow">YOUR WEATHER, MADE CLEAR</p>
          <h1>Always a little<br /><em>closer to the sky.</em></h1>
          <p className="hero-copy">Beautifully simple forecasts for wherever your day takes you.</p>
          <form className="searchbar" onSubmit={searchLocation}>
            <Search size={19} aria-hidden="true" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search a city, state or country"
              aria-label="Search location"
            />
            <button type="submit" disabled={isSearching}>
              {isSearching ? 'Searching…' : <>Explore <ArrowUpRight size={16} /></>}
            </button>
          </form>
        </div>
        <div className="banner-dots" aria-label="Banner slide selector">
          {banners.map((_, index) => (
            <button
              key={index}
              className={index === activeBanner ? 'active' : ''}
              onClick={() => setActiveBanner(index)}
              aria-label={`Show banner ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Today's weather ── */}
      <section id="today" className="weather-section section-shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">RIGHT NOW</p>
            <h2>{place}</h2>
          </div>
          <p className="updated">
            <Navigation size={14} />
            {weatherLoading ? 'Fetching live data…' : 'Live data · Open-Meteo'}
          </p>
        </div>
        <div className={`weather-grid${weatherLoading ? ' weather-loading' : ''}`}>
          <article className="current-card">
            <div className="sun-glow"><FluidOrb /></div>
            <div className="condition">
              <span>{conditionLabel}</span>
              <Sun size={18} />
            </div>
            <div className="temperature">
              {tempDisplay}<sup>°</sup>
            </div>
            <p>{feelsDisplay}</p>
            <div className="range">
              <span>{tempLow}°</span>
              <div><i /></div>
              <span>{tempHigh}°</span>
            </div>
          </article>
          <article className="details-card">
            <p className="card-label">CONDITIONS</p>
            <div className="detail-grid">
              <div><Droplets /><span>Humidity</span><strong>{humDisplay}</strong></div>
              <div><Wind /><span>Wind</span><strong>{windDisplay}</strong></div>
              <div>
                <Sun />
                <span>UV index</span>
                <strong>{uvDisplay} <small>{uvLabelText}</small></strong>
              </div>
              <div><Sunrise /><span>Sunset</span><strong>{sunsetDisplay}</strong></div>
            </div>
          </article>
        </div>
      </section>

      {/* ── World globe ── */}
      <section id="world" className="world-section">
        <div className="section-shell world-grid">
          <div className="world-copy">
            <p className="eyebrow">THE WORLD, AT A GLANCE</p>
            <h2>Find your place<br />in the <em>weather.</em></h2>
            <p>Search any country, state, or city. The globe will guide you there.</p>
            <form className="map-search" onSubmit={searchLocation}>
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Where are you headed?"
              />
              <button aria-label="Search location" disabled={isSearching}>
                <Search size={19} />
              </button>
            </form>
          </div>
          <GlobeMap ref={mapRef} onLocationName={handleLocationName} />
        </div>
      </section>

      {/* ── 5-day forecast ── */}
      <section id="forecast" className="forecast-section section-shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">LOOKING AHEAD</p>
            <h2>Your five-day forecast</h2>
          </div>
          <button className="text-button" type="button" onClick={() => setShowForecastDetails((shown) => !shown)} aria-expanded={showForecastDetails} aria-controls="forecast-details">
            {showForecastDetails ? 'Hide details' : 'View details'} <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="forecast-list">
          {forecast.length > 0
            ? forecast.map((item) => (
              <article key={item.label}>
                <span>{item.label}</span>
                <b>{item.icon}</b>
                <span className="forecast-condition">{item.condition}</span>
                <strong>{item.high}°</strong>
                <small>{item.low}°</small>
              </article>
            ))
            : /* skeleton rows while loading */
            Array.from({ length: 5 }).map((_, i) => (
              <article key={i} className="forecast-skeleton">
                <span className="skel-line" />
                <b>—</b>
                <span className="forecast-condition skel-line" />
                <strong>—</strong>
                <small>—</small>
              </article>
            ))}
        </div>
        {showForecastDetails && forecast.length > 0 && (
          <div id="forecast-details" className="forecast-details">
            {forecast.map((item) => (
              <article key={`${item.label}-detail`}>
                <strong>{item.label}</strong>
                <span>{item.icon} {item.condition}</span>
                <span>High {item.high}° · Low {item.low}°</span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── AI teaser ── */}
      <section id="ai" className="ai-section">
        <div className="section-shell ai-card">
          <div>
            <p className="eyebrow dark">WEATHER ASSIST AI</p>
            <h2>Your weather co-pilot,<br /><em>ready to help.</em></h2>
            <p>Get planning help, weather insights, and useful advice in one thoughtful conversation.</p>
          </div>
          <ChatBox />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer>
        <div className="brand">
          <img src={logo} alt="" />
          <span>weather<span>assist</span></span>
        </div>
        <p>Made for days worth looking up.</p>
        <span>© 2026 Weather Assist</span>
      </footer>
    </main>
  )
}

export default App
