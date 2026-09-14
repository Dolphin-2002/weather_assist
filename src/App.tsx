import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight, Bot, CloudSun, Droplets, House, Map as MapIcon, Navigation, Search, Sunrise, Sun, Wind } from 'lucide-react'
import { GlobeMap } from './components/GlobeMap'
import { FluidOrb } from './components/FluidOrb'
import { GooeyNav } from './components/ui/gooey-nav'
import logo from './assets/images/weather_assist_logo.jpg'
import bannerOne from './assets/images/2.jpg'
import bannerTwo from './assets/images/3.jpg'
import bannerThree from './assets/images/4.jpg'
import bannerFour from './assets/images/5.jpg'
import './App.css'
import './nav-ai.css'

const banners = [bannerOne, bannerTwo, bannerThree, bannerFour]
const forecast = [
  { day: 'Today', icon: '☀', high: '28°', low: '22°' }, { day: 'Tue', icon: '☀', high: '29°', low: '23°' },
  { day: 'Wed', icon: '☁', high: '27°', low: '22°' }, { day: 'Thu', icon: '☔', high: '26°', low: '21°' }, { day: 'Fri', icon: '☀', high: '28°', low: '22°' },
]
const navItems = [
  { label: 'Home', href: '#home', icon: House },
  { label: 'Weather', href: '#today', icon: CloudSun },
  { label: 'Map', href: '#world', icon: MapIcon },
  { label: 'AI', href: '#ai', icon: Bot },
]

function App() {
  const [activeBanner, setActiveBanner] = useState(0)
  const [activeNav, setActiveNav] = useState(0)
  const [place, setPlace] = useState('Colombo, Sri Lanka')
  const [searchValue, setSearchValue] = useState('')
  const mapRef = useRef<{ flyTo: (query: string) => void }>(null)
  useEffect(() => { const timer = window.setInterval(() => setActiveBanner((current) => (current + 1) % banners.length), 3000); return () => window.clearInterval(timer) }, [])
  const searchLocation = (event: FormEvent) => { event.preventDefault(); const value = searchValue.trim(); if (!value) return; setPlace(value); mapRef.current?.flyTo(value); setSearchValue(''); document.querySelector('#world')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }

  return <main>
    <nav className="topbar"><a className="brand" href="#home" aria-label="Weather Assist home"><img src={logo} alt="Weather Assist" /><span>weather<span>assist</span></span></a><GooeyNav items={navItems} value={activeNav} onChange={setActiveNav} /></nav>
    <section id="home" className="hero-section"><div className="banner-stack" aria-label="Weather photography">{banners.map((banner, index) => <img key={banner} src={banner} className={index === activeBanner ? 'active' : ''} alt="" />)}<div className="banner-overlay" /></div><div className="hero-content"><p className="eyebrow">YOUR WEATHER, MADE CLEAR</p><h1>Always a little<br /><em>closer to the sky.</em></h1><p className="hero-copy">Beautifully simple forecasts for wherever your day takes you.</p><form className="searchbar" onSubmit={searchLocation}><Search size={19} aria-hidden="true" /><input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search a city, state or country" aria-label="Search location" /><button type="submit">Explore <ArrowUpRight size={16} /></button></form></div><div className="banner-dots" aria-label="Banner slide selector">{banners.map((_, index) => <button key={index} className={index === activeBanner ? 'active' : ''} onClick={() => setActiveBanner(index)} aria-label={`Show banner ${index + 1}`} />)}</div></section>
    <section id="today" className="weather-section section-shell"><div className="section-heading"><div><p className="eyebrow dark">RIGHT NOW</p><h2>{place}</h2></div><p className="updated"><Navigation size={14} /> Updated just now</p></div><div className="weather-grid"><article className="current-card"><div className="sun-glow"><FluidOrb /></div><div className="condition"><span>Mostly sunny</span><Sun size={18} /></div><div className="temperature">28<sup>°</sup></div><p>Feels like 31°</p><div className="range"><span>22°</span><div><i /></div><span>30°</span></div></article><article className="details-card"><p className="card-label">CONDITIONS</p><div className="detail-grid"><div><Droplets /><span>Humidity</span><strong>76%</strong></div><div><Wind /><span>Wind</span><strong>12 km/h</strong></div><div><Sun /><span>UV index</span><strong>6 <small>High</small></strong></div><div><Sunrise /><span>Sunset</span><strong>6:22 PM</strong></div></div></article></div></section>
    <section id="world" className="world-section"><div className="section-shell world-grid"><div className="world-copy"><p className="eyebrow">THE WORLD, AT A GLANCE</p><h2>Find your place<br />in the <em>weather.</em></h2><p>Search any country, state, or city. The globe will guide you there.</p><form className="map-search" onSubmit={searchLocation}><input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Where are you headed?" /><button aria-label="Search location"><Search size={19} /></button></form></div><GlobeMap ref={mapRef} place={place} /></div></section>
    <section id="forecast" className="forecast-section section-shell"><div className="section-heading"><div><p className="eyebrow dark">LOOKING AHEAD</p><h2>Your five-day forecast</h2></div><button className="text-button">View details <ArrowUpRight size={16} /></button></div><div className="forecast-list">{forecast.map((item) => <article key={item.day}><span>{item.day}</span><b>{item.icon}</b><span className="forecast-condition">Sunny</span><strong>{item.high}</strong><small>{item.low}</small></article>)}</div></section>
    <section id="ai" className="ai-section"><div className="section-shell ai-card"><div><p className="eyebrow dark">WEATHER ASSIST AI</p><h2>Your weather co-pilot is<br /><em>on its way.</em></h2><p>Get planning help, personal weather insights, and useful alerts in one thoughtful conversation.</p></div><div className="ai-status"><Bot size={28} /><span>AI is still in development</span><small>Coming soon</small></div></div></section>
    <footer><div className="brand"><img src={logo} alt="" /><span>weather<span>assist</span></span></div><p>Made for days worth looking up.</p><span>© 2026 Weather Assist</span></footer>
  </main>
}
export default App
