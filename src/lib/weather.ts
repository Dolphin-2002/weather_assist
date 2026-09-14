// ── Open-Meteo weather API — free, no API key ─────────────────────────────────
// Docs: https://open-meteo.com/en/docs

export interface CurrentWeather {
  temp: number           // °C, rounded
  feelsLike: number
  humidity: number       // %
  windSpeed: number      // km/h, rounded
  uvIndex: number        // rounded
  weatherCode: number    // WMO code
  isDay: boolean
  sunset: string         // local time "HH:MM AM/PM"
  conditionLabel: string
  conditionIcon: string  // emoji
}

export interface DayForecast {
  label: string          // "Today", "Mon", "Tue" …
  icon: string
  condition: string
  high: number
  low: number
}

export interface WeatherData {
  current: CurrentWeather
  forecast: DayForecast[]
}

// ── WMO weather-code → label + emoji ─────────────────────────────────────────
function decodeWmo(code: number, isDay: boolean): { label: string; icon: string } {
  if (code === 0)           return { label: 'Clear sky',       icon: isDay ? '☀️' : '🌙' }
  if (code <= 2)            return { label: 'Partly cloudy',   icon: isDay ? '⛅' : '🌤' }
  if (code === 3)           return { label: 'Overcast',        icon: '☁️' }
  if (code <= 49)           return { label: 'Foggy',           icon: '🌫' }
  if (code <= 57)           return { label: 'Drizzle',         icon: '🌦' }
  if (code <= 67)           return { label: 'Rainy',           icon: '🌧' }
  if (code <= 77)           return { label: 'Snowy',           icon: '❄️' }
  if (code <= 82)           return { label: 'Rain showers',    icon: '🌦' }
  if (code <= 86)           return { label: 'Snow showers',    icon: '🌨' }
  if (code <= 99)           return { label: 'Thunderstorm',    icon: '⛈' }
  return { label: 'Unknown', icon: '🌡' }
}

function formatSunset(isoDatetime: string): string {
  const d = new Date(isoDatetime)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function dayLabel(isoDate: string, index: number): string {
  if (index === 0) return 'Today'
  const d = new Date(isoDate)
  return d.toLocaleDateString([], { weekday: 'short' }) // Mon, Tue …
}

// ── Main fetch ────────────────────────────────────────────────────────────────
export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude',  String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('current', [
    'temperature_2m',
    'apparent_temperature',
    'relative_humidity_2m',
    'wind_speed_10m',
    'uv_index',
    'weather_code',
    'is_day',
  ].join(','))
  url.searchParams.set('daily', [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'sunset',
  ].join(','))
  url.searchParams.set('wind_speed_unit', 'kmh')
  url.searchParams.set('forecast_days',   '5')
  url.searchParams.set('timezone',        'auto')

  const res  = await fetch(url.toString())
  if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`)
  const raw  = await res.json() as OpenMeteoResponse

  const cur = raw.current
  const isDay = cur.is_day === 1
  const { label: conditionLabel, icon: conditionIcon } = decodeWmo(cur.weather_code, isDay)

  const current: CurrentWeather = {
    temp:           Math.round(cur.temperature_2m),
    feelsLike:      Math.round(cur.apparent_temperature),
    humidity:       cur.relative_humidity_2m,
    windSpeed:      Math.round(cur.wind_speed_10m),
    uvIndex:        Math.round(cur.uv_index),
    weatherCode:    cur.weather_code,
    isDay,
    sunset:         formatSunset(raw.daily.sunset[0]),
    conditionLabel,
    conditionIcon,
  }

  const forecast: DayForecast[] = raw.daily.time.map((date, i) => {
    const { label: condition, icon } = decodeWmo(raw.daily.weather_code[i], true)
    return {
      label:     dayLabel(date, i),
      icon,
      condition,
      high:      Math.round(raw.daily.temperature_2m_max[i]),
      low:       Math.round(raw.daily.temperature_2m_min[i]),
    }
  })

  return { current, forecast }
}

// ── Raw API shape ─────────────────────────────────────────────────────────────
interface OpenMeteoResponse {
  current: {
    temperature_2m:       number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m:       number
    uv_index:             number
    weather_code:         number
    is_day:               number   // 1 = day, 0 = night
  }
  daily: {
    time:                 string[]
    weather_code:         number[]
    temperature_2m_max:   number[]
    temperature_2m_min:   number[]
    sunset:               string[]
  }
}

