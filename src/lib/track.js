// Registro de cada passo do funil no servidor (/api/e). Um id por aparelho (sid)
// junta as visitas; as UTMs da primeira chegada acompanham todos os eventos.
import { fbCookies, fbEvent } from './pixel'

const SID_KEY = 'ceu-natal-sid'
const UTM_KEY = 'ceu-natal-utm'
const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid', 'gclid', 'src']

export const sid = (() => {
  let id = localStorage.getItem(SID_KEY)
  if (!id) {
    id = (crypto.randomUUID?.() || String(Math.random()).slice(2) + Date.now()).replace(/-/g, '')
    localStorage.setItem(SID_KEY, id)
  }
  return id
})()

export const utm = (() => {
  const q = new URLSearchParams(window.location.search)
  const fromUrl = Object.fromEntries(UTM_FIELDS.filter((k) => q.get(k)).map((k) => [k, q.get(k)]))
  if (Object.keys(fromUrl).length) {
    localStorage.setItem(UTM_KEY, JSON.stringify(fromUrl))
    return fromUrl
  }
  try {
    return JSON.parse(localStorage.getItem(UTM_KEY) || '{}')
  } catch {
    return {}
  }
})()

const ctx = { country: '', focus: '' }
export function setTrackContext(next) {
  Object.assign(ctx, next)
}

let queue = []
let timer = null

function flush() {
  timer = null
  if (!queue.length) return
  const body = JSON.stringify({ events: queue, ...fbCookies(), url: window.location.href.slice(0, 500) })
  queue = []
  const blob = new Blob([body], { type: 'application/json' })
  if (!navigator.sendBeacon?.('/api/e', blob)) fetch('/api/e', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
}

// Passos que também viram evento da Meta (pixel + Conversions API com o mesmo event_id)
const META = { view: 'PageView', quiz_start: 'ViewContent', signup: 'Lead', checkout_view: 'InitiateCheckout' }

export function track(ev, props) {
  if (META[ev]) {
    const eid = `${ev}-${sid}-${Date.now().toString(36)}`
    const { value, currency } = props || {}
    fbEvent(META[ev], eid, value ? { value, currency } : {})
    props = { ...props, eid }
  }
  queue.push({ sid, ev, country: ctx.country, focus: ctx.focus, utm, props })
  if (queue.length >= 10) flush()
  else if (!timer) timer = setTimeout(flush, 800)
}

window.addEventListener('pagehide', flush)
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush())

export function sendLead(data, country) {
  fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ sid, country, utm, name: data.name, email: data.email, phone: data.phone, city: data.place?.name || '', focus: data.focus, consent: !!data.consent }),
  }).catch(() => {})
}
