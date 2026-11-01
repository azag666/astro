// Cálculo real do mapa natal: posições geocêntricas tropicais (eclíptica verdadeira
// da data) via astronomy-engine, cidade/fuso via Open-Meteo Geocoding (sem chave).
import * as A from 'astronomy-engine'

export const SIGN_KEYS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
export const SIGN_GLYPHS = ['♈︎', '♉︎', '♊︎', '♋︎', '♌︎', '♍︎', '♎︎', '♏︎', '♐︎', '♑︎', '♒︎', '♓︎']
export const SIGN_ELEMENT = ['fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water']

export const PLANET_KEYS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']
export const PLANET_GLYPHS = { sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇', asc: 'AC', mc: 'MC' }
const BODIES = {
  sun: A.Body.Sun,
  moon: A.Body.Moon,
  mercury: A.Body.Mercury,
  venus: A.Body.Venus,
  mars: A.Body.Mars,
  jupiter: A.Body.Jupiter,
  saturn: A.Body.Saturn,
  uranus: A.Body.Uranus,
  neptune: A.Body.Neptune,
  pluto: A.Body.Pluto,
}

const ASPECTS = [
  { key: 'conjunction', angle: 0, orb: 8 },
  { key: 'sextile', angle: 60, orb: 4 },
  { key: 'square', angle: 90, orb: 6 },
  { key: 'trine', angle: 120, orb: 6 },
  { key: 'opposition', angle: 180, orb: 8 },
]

const norm = (d) => ((d % 360) + 360) % 360
const rad = (d) => (d * Math.PI) / 180
const deg = (r) => (r * 180) / Math.PI

export const signOf = (lon) => Math.floor(norm(lon) / 30)

// Signo solar só pela data (antes de termos hora/cidade). Meio-dia UTC.
export function quickSunSign(isoDate) {
  if (!isoDate) return null
  const lon = A.SunPosition(new Date(`${isoDate}T12:00:00Z`)).elon
  return signOf(lon)
}

// Coordenadas da capital quando a cidade não é encontrada: o fuso e a posição aproximada bastam
const CAPITAIS = {
  br: { lat: -15.79, lon: -47.88, tz: 'America/Sao_Paulo', cc: 'BR' },
  mx: { lat: 19.43, lon: -99.13, tz: 'America/Mexico_City', cc: 'MX' },
  co: { lat: 4.71, lon: -74.07, tz: 'America/Bogota', cc: 'CO' },
  cl: { lat: -33.45, lon: -70.67, tz: 'America/Santiago', cc: 'CL' },
  ar: { lat: -34.6, lon: -58.38, tz: 'America/Argentina/Buenos_Aires', cc: 'AR' },
  cn: { lat: 39.9, lon: 116.4, tz: 'Asia/Shanghai', cc: 'CN' },
}
export function capitalPlace(country, typed) {
  const c = CAPITAIS[country] || CAPITAIS.br
  return { id: `aprox-${country}`, name: String(typed || '').trim(), region: '', ...c, approx: true }
}

export async function searchCity(query, lang = 'pt') {
  if (!query || query.trim().length < 2) return []
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=${lang}&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('geocoding')
  const json = await res.json()
  return (json.results || []).map((r) => ({
    id: r.id,
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(', '),
    lat: r.latitude,
    lon: r.longitude,
    tz: r.timezone,
    cc: r.country_code,
  }))
}

// Converte data/hora local de nascimento (no fuso IANA da cidade) para UTC,
// respeitando horário de verão histórico (o navegador traz a base tzdata).
export function localToUTC(isoDate, time, tz) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const [hh, mm] = (time || '12:00').split(':').map(Number)
  let guess = Date.UTC(y, m - 1, d, hh, mm)
  for (let i = 0; i < 3; i++) {
    const offset = tzOffsetMinutes(new Date(guess), tz)
    guess = Date.UTC(y, m - 1, d, hh, mm) - offset * 60000
  }
  return new Date(guess)
}

function tzOffsetMinutes(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date)
  const get = (t) => Number(parts.find((p) => p.type === t).value)
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
  return Math.round((asUTC - date.getTime()) / 60000)
}

function longitudeOf(key, date) {
  if (key === 'sun') return A.SunPosition(date).elon
  if (key === 'moon') return A.EclipticGeoMoon(date).lon
  return A.Ecliptic(A.GeoVector(BODIES[key], date, true)).elon
}

export function computeChart({ birthDate, birthTime, unknownTime, place }) {
  const tz = place?.tz || 'UTC'
  const date = localToUTC(birthDate, unknownTime ? '12:00' : birthTime, tz)
  const later = new Date(date.getTime() + 86400000)

  const planets = PLANET_KEYS.map((key) => {
    const lon = norm(longitudeOf(key, date))
    const next = norm(longitudeOf(key, later))
    let delta = next - lon
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    return { key, lon, sign: signOf(lon), degree: lon % 30, retro: key !== 'sun' && key !== 'moon' && delta < 0 }
  })

  let asc = null
  let mc = null
  if (place && !unknownTime) {
    const time = A.MakeTime(date)
    const eps = rad(A.e_tilt(time).tobl)
    const ramc = rad(norm(A.SiderealTime(date) * 15 + place.lon))
    const phi = rad(place.lat)
    asc = norm(deg(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)))))
    mc = norm(deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps))))
  }

  // Casas por signos inteiros a partir do Ascendente
  const houseOf = (lon) => (asc == null ? null : ((signOf(lon) - signOf(asc) + 12) % 12) + 1)
  planets.forEach((p) => (p.house = houseOf(p.lon)))

  const aspects = []
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let diff = Math.abs(planets[i].lon - planets[j].lon)
      if (diff > 180) diff = 360 - diff
      for (const a of ASPECTS) {
        const orb = Math.abs(diff - a.angle)
        if (orb <= a.orb) aspects.push({ a: planets[i].key, b: planets[j].key, type: a.key, orb })
      }
    }
  }
  aspects.sort((x, y) => x.orb - y.orb)

  const elements = { fire: 0, earth: 0, air: 0, water: 0 }
  planets.forEach((p) => (elements[SIGN_ELEMENT[p.sign]] += p.key === 'sun' || p.key === 'moon' ? 2 : 1))
  if (asc != null) elements[SIGN_ELEMENT[signOf(asc)]] += 2
  const ranked = Object.entries(elements).sort((a, b) => b[1] - a[1])

  const bySign = {}
  planets.forEach((p) => (bySign[p.sign] = (bySign[p.sign] || 0) + 1))
  const stelliumSign = Object.entries(bySign).find(([, n]) => n >= 3)

  const phase = A.MoonPhase(date)

  return {
    date,
    planets,
    get: (k) => planets.find((p) => p.key === k),
    asc: asc == null ? null : { lon: asc, sign: signOf(asc), degree: asc % 30 },
    mc: mc == null ? null : { lon: mc, sign: signOf(mc), degree: mc % 30 },
    aspects,
    elements,
    dominant: ranked[0][0],
    missing: ranked.filter(([, n]) => n === 0).map(([k]) => k),
    stellium: stelliumSign ? Number(stelliumSign[0]) : null,
    retrogrades: planets.filter((p) => p.retro).map((p) => p.key),
    moonPhase: moonPhaseKey(phase),
  }
}

function moonPhaseKey(angle) {
  const keys = ['new', 'waxingCrescent', 'firstQuarter', 'waxingGibbous', 'full', 'waningGibbous', 'lastQuarter', 'waningCrescent']
  return keys[Math.floor(norm(angle + 22.5) / 45) % 8]
}

// Os achados mais raros/marcantes do mapa — todos reais, ordenados por impacto.
export function highlights(chart) {
  const list = []
  if (chart.stellium != null) list.push({ type: 'stellium', sign: chart.stellium })
  const tight = chart.aspects.find((a) => a.orb < 1.5 && ['sun', 'moon', 'venus', 'mars', 'mercury'].includes(a.a))
  if (tight) list.push({ type: 'tightAspect', aspect: tight })
  if (chart.missing.length) list.push({ type: 'missing', element: chart.missing[0] })
  const personalRetro = chart.retrogrades.find((k) => ['mercury', 'venus', 'mars'].includes(k))
  if (personalRetro) list.push({ type: 'retro', planet: personalRetro })
  list.push({ type: 'dominant', element: chart.dominant })
  list.push({ type: 'moonPhase', phase: chart.moonPhase })
  return list
}
