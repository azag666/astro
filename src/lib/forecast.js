// Previsões reais: trânsitos dos próximos dias sobre os pontos natais do foco do lead,
// fases da Lua e numerologia. Tudo calculado, nada sorteado.
import * as A from 'astronomy-engine'

const norm = (d) => ((d % 360) + 360) % 360

// Pontos natais que importam para cada foco
export const FOCUS_POINTS = {
  amor: ['venus', 'moon'],
  dinheiro: ['jupiter', 'venus'],
  carreira: ['mc', 'sun', 'saturn'],
  espiritual: ['moon', 'neptune', 'sun'],
}

const TRANSITERS = {
  jupiter: { body: A.Body.Jupiter, weight: 3, orb: 3 },
  venus: { body: A.Body.Venus, weight: 2.2, orb: 3 },
  sun: { body: A.Body.Sun, weight: 1.5, orb: 3 },
  moon: { body: A.Body.Moon, weight: 1, orb: 6.5 },
  mars: { body: A.Body.Mars, weight: 2, orb: 3 },
  saturn: { body: A.Body.Saturn, weight: 2.5, orb: 3 },
}
const HARMONIC = [
  { type: 'conjunction', angle: 0 },
  { type: 'sextile', angle: 60 },
  { type: 'trine', angle: 120 },
]
const TENSE = [
  { type: 'square', angle: 90 },
  { type: 'opposition', angle: 180 },
]

function lonOf(key, date) {
  if (key === 'sun') return A.SunPosition(date).elon
  if (key === 'moon') return A.EclipticGeoMoon(date).lon
  return A.Ecliptic(A.GeoVector(TRANSITERS[key].body, date, true)).elon
}

function natalLon(chart, key) {
  if (key === 'mc') return chart.mc?.lon ?? null
  return chart.get(key)?.lon ?? null
}

function score(tLon, nLon, orb, aspects) {
  let diff = Math.abs(norm(tLon - nLon))
  if (diff > 180) diff = 360 - diff
  let best = null
  for (const a of aspects) {
    const o = Math.abs(diff - a.angle)
    if (o <= orb && (!best || o < best.orb)) best = { type: a.type, orb: o, strength: 1 - o / orb }
  }
  return best
}

export function goldenDays(chart, focus, days = 30, from = new Date()) {
  const points = FOCUS_POINTS[focus] || FOCUS_POINTS.espiritual
  const natal = points.map((k) => ({ key: k, lon: natalLon(chart, k) })).filter((p) => p.lon != null)
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12)

  const list = []
  for (let i = 1; i <= days; i++) {
    const date = new Date(start.getTime() + i * 86400000)
    let good = 0
    let bad = 0
    let bestGood = null
    let bestBad = null
    for (const [tKey, tr] of Object.entries(TRANSITERS)) {
      const tLon = lonOf(tKey, date)
      for (const [pi, n] of natal.entries()) {
        const pw = pi === 0 ? 1.3 : 1
        if (tKey !== 'mars' && tKey !== 'saturn') {
          const h = score(tLon, n.lon, tr.orb, HARMONIC)
          if (h) {
            const v = h.strength * tr.weight * pw
            good += v
            if (!bestGood || v > bestGood.v) bestGood = { v, transit: tKey, natal: n.key, type: h.type }
          }
        }
        if (tKey === 'mars' || tKey === 'saturn' || tKey === 'moon') {
          const t = score(tLon, n.lon, tr.orb, TENSE)
          if (t) {
            const v = t.strength * tr.weight * pw
            bad += v
            if (!bestBad || v > bestBad.v) bestBad = { v, transit: tKey, natal: n.key, type: t.type }
          }
        }
      }
    }
    list.push({ date, good, bad, bestGood, bestBad })
  }

  // Top 3 dias favoráveis, com pelo menos 2 dias de distância entre si
  // e preferindo trânsitos diferentes (texto variado para o lead)
  const golden = []
  const ranked = [...list].filter((d) => d.bestGood).sort((a, b) => b.good - a.good)
  const spaced = (d) => golden.every((g) => Math.abs(g.date - d.date) >= 2 * 86400000)
  for (const d of ranked) {
    if (golden.length === 3) break
    if (spaced(d) && golden.every((g) => g.bestGood.transit !== d.bestGood.transit)) golden.push(d)
  }
  for (const d of ranked) {
    if (golden.length === 3) break
    if (spaced(d) && !golden.includes(d)) golden.push(d)
  }
  golden.sort((a, b) => a.date - b.date)
  const risk = [...list].filter((d) => d.bestBad).sort((a, b) => b.bad - a.bad)[0] || null
  return { golden, risk }
}

export function nextMoonPhases(from = new Date()) {
  const nw = A.SearchMoonPhase(0, from, 40)
  const full = A.SearchMoonPhase(180, from, 40)
  return { newMoon: nw?.date, fullMoon: full?.date }
}

// Numerologia pitagórica: mantém números mestres 11, 22, 33
function reduce(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = String(n).split('').reduce((s, d) => s + Number(d), 0)
  return n
}

export function lifePath(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return reduce(reduce(y) + reduce(m) + reduce(d))
}

export function personalYear(isoDate, year = new Date().getFullYear()) {
  const [, m, d] = isoDate.split('-').map(Number)
  const n = reduce(reduce(m) + reduce(d) + reduce(year))
  return n > 9 ? reduce(String(n).split('').reduce((s, x) => s + Number(x), 0)) : n
}

// Numerologia pelo nome (tabela pitagórica). Acentos removidos; Y conta como vogal.
const LETTER = (ch) => ((ch.charCodeAt(0) - 97) % 9) + 1
const lettersOf = (name) =>
  (name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .split('')
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y'])

function nameNumber(name, filter) {
  const ls = lettersOf(name).filter(filter)
  if (!ls.length) return null
  return reduce(ls.reduce((s, ch) => s + LETTER(ch), 0))
}

export const expression = (name) => nameNumber(name, () => true)
export const soulUrge = (name) => nameNumber(name, (ch) => VOWELS.has(ch))
export const personality = (name) => nameNumber(name, (ch) => !VOWELS.has(ch))

export function personalMonth(isoDate, date = new Date()) {
  const py = personalYear(isoDate, date.getFullYear())
  const n = reduce(py + date.getMonth() + 1)
  return n > 9 ? reduce(String(n).split('').reduce((s, x) => s + Number(x), 0)) : n
}
