// Conversions API da Meta: o mesmo event_id do pixel do navegador (a Meta deduplica).
// Variáveis: META_PIXEL_ID, META_CAPI_TOKEN, META_TEST_CODE (opcional, para o "Testar eventos").
import { createHash } from 'node:crypto'

const PIXEL = process.env.META_PIXEL_ID || ''
const TOKEN = process.env.META_CAPI_TOKEN || ''
const TESTE = process.env.META_TEST_CODE || ''
export const capiLigada = !!(PIXEL && TOKEN)

const sha = (v) => (v ? createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex') : undefined)
const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')

// Dados do lead por aparelho (sid): contato, IP/UA, cookies da Meta, última URL
const perfis = new Map()
export function lembrar(sid, dados) {
  if (!sid) return
  const atual = perfis.get(sid) || {}
  const limpo = Object.fromEntries(Object.entries(dados).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  perfis.set(sid, { ...atual, ...limpo })
}

function userData(sid, extra = {}) {
  const p = { ...(perfis.get(sid) || {}), ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)) }
  const nome = semAcento(p.name).trim().split(/\s+/)
  const fone = String(p.phone || '').replace(/\D/g, '')
  const fbc = p.fbc || (p.fbclid ? `fb.1.${p.fbclidEm || Date.now()}.${p.fbclid}` : undefined)
  return {
    em: p.email ? [sha(p.email)] : undefined,
    ph: fone.length >= 8 ? [sha(fone)] : undefined,
    fn: nome[0] ? [sha(nome[0])] : undefined,
    ln: nome.length > 1 ? [sha(nome[nome.length - 1])] : undefined,
    ct: p.city ? [sha(semAcento(p.city).replace(/[^a-z]/gi, ''))] : undefined,
    country: p.country ? [sha(p.country)] : undefined,
    external_id: [sha(sid)],
    client_ip_address: p.ip || undefined,
    client_user_agent: p.ua || undefined,
    fbp: p.fbp || undefined,
    fbc,
  }
}

const fila = []
let enviando = false

export function evento({ nome, id, sid, url, valor, moeda, pedido, extra }) {
  if (!capiLigada) return
  const p = perfis.get(sid) || {}
  fila.push({
    event_name: nome,
    event_id: id,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: url || p.url || undefined,
    user_data: userData(sid, extra),
    custom_data: valor ? { value: Number(valor), currency: moeda, ...(pedido ? { order_id: pedido, content_name: 'Mapa Astral', content_type: 'product' } : {}) } : undefined,
  })
  if (!enviando) setTimeout(enviar, 500)
}

async function enviar() {
  if (!fila.length) return
  enviando = true
  const lote = fila.splice(0, 50)
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL}/events?access_token=${encodeURIComponent(TOKEN)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: lote, ...(TESTE ? { test_event_code: TESTE } : {}) }),
      signal: AbortSignal.timeout(15000),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) console.error('capi', r.status, JSON.stringify(d).slice(0, 300))
  } catch (e) {
    console.error('capi', e.message)
  } finally {
    enviando = false
    if (fila.length) setTimeout(enviar, 200)
  }
}

export function pixelId() {
  return PIXEL
}
