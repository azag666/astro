// Servidor do Céu Natal: entrega o site (dist/), cria cobranças na HotTrack,
// confere o pagamento e grava cada passo do funil. Node 22, sem dependências.
//
// Variáveis: HOTTRACK_API_KEY (ht_live_ ou ht_test_; sem ela as cobranças são simuladas),
// PAINEL_TOKEN (senha do /painel), PORT (padrão 8787), DATA_DIR (padrão ./data).
import { createServer } from 'node:http'
import { createReadStream, existsSync, mkdirSync, readFileSync, appendFileSync, statSync } from 'node:fs'
import { randomUUID, createHash } from 'node:crypto'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COUNTRIES, htMethod, orderTotal } from '../src/i18n/paises.js'
import { painelHtml, resumoDoFunil } from './painel.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')
const DATA = process.env.DATA_DIR || join(ROOT, 'data')
const PORT = Number(process.env.PORT || 8787)
const API = 'https://hot-track.com/v1'
const KEY = process.env.HOTTRACK_API_KEY || ''
const SIMULADO = !KEY || KEY.startsWith('ht_test_')
const PAINEL_TOKEN = process.env.PAINEL_TOKEN || ''

mkdirSync(DATA, { recursive: true })

const hoje = () => new Date().toISOString().slice(0, 10)
const gravar = (nome, obj) => appendFileSync(join(DATA, nome), JSON.stringify(obj) + '\n')

// Pedidos ficam em memória e num arquivo só de acréscimos (a última linha de cada id vale)
const pedidos = new Map()
const ARQ_PEDIDOS = join(DATA, 'pedidos.jsonl')
if (existsSync(ARQ_PEDIDOS)) {
  for (const linha of readFileSync(ARQ_PEDIDOS, 'utf8').split('\n')) {
    if (!linha) continue
    try {
      const p = JSON.parse(linha)
      pedidos.set(p.id, p)
    } catch {}
  }
}
function salvarPedido(p) {
  p.updatedAt = new Date().toISOString()
  pedidos.set(p.id, p)
  gravar('pedidos.jsonl', p)
}

// ---------- HotTrack ----------

async function hottrack(path, { method = 'GET', body, idem } = {}) {
  const headers = { Authorization: `Bearer ${KEY}` }
  if (body) headers['Content-Type'] = 'application/json'
  if (idem) headers['Idempotency-Key'] = idem
  const r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) })
  const corpo = await r.json().catch(() => ({}))
  if (!r.ok) {
    const e = new Error(corpo?.error?.message || `HTTP ${r.status}`)
    e.code = corpo?.error?.code || 'http_' + r.status
    e.status = r.status
    throw e
  }
  return corpo.data
}

function cobrancaSimulada(p) {
  const n = createHash('sha1').update(p.id).digest('hex').replace(/\D/g, '').padEnd(18, '7')
  const por = {
    pix: { kind: 'copy_paste', instructions: { copy_paste: `00020101021126580014br.gov.bcb.pix0136${p.id}5204000053039865406${(p.cents / 100).toFixed(2)}5802BR6304TEST` } },
    spei: { kind: 'bank_transfer', instructions: { clabe: '646180' + n.slice(0, 12), beneficiary: 'Pagos Seguros', bank_name: 'STP' } },
    oxxo: { kind: 'reference', instructions: { reference: n.slice(0, 14) } },
    nequi: { kind: 'key', instructions: { llave: '@pagoseguro', copy_paste: '000201010212' + n } },
    'bre-b-llave': { kind: 'key', instructions: { llave: '@pagoseguro', copy_paste: '000201010212' + n } },
    pse: { kind: 'redirect', instructions: { checkout_url: 'https://example.com/pse/' + p.id } },
    cvu: { kind: 'bank_transfer', instructions: { cvu: '0000003' + n.slice(0, 15), beneficiary: 'Pagos Seguros SA' } },
    'mercado-pago': { kind: 'redirect', instructions: { checkout_url: 'https://example.com/mp/' + p.id } },
    'qr-interoperable': { kind: 'qr_code', instructions: { copy_paste: '000201010211' + n } },
    whop: { kind: 'redirect', instructions: { checkout_url: '/?c=' + p.country + '#/checkout' } },
  }
  return { id: 'sim_' + p.id, status: 'pending', payment: { method: p.method, ...(por[p.method] || por.pix), expires_at: null } }
}

// ---------- Conferência do pagamento ----------
// A HotTrack ainda não manda o webhook charge.paid, então o servidor consulta.
// Limite da chave: 120 leituras/min. Um único laço consulta no máximo ~1,5 por segundo,
// priorizando quem está com a tela de pagamento aberta.

const LEITURAS_POR_MIN = 90
let fila = []
setInterval(conferirPagamentos, Math.ceil(60000 / LEITURAS_POR_MIN))

function vencido(p) {
  const idade = Date.now() - Date.parse(p.createdAt)
  return idade > 3 * 24 * 3600e3
}

async function conferirPagamentos() {
  if (SIMULADO) return
  if (!fila.length) {
    const agora = Date.now()
    fila = [...pedidos.values()]
      .filter((p) => p.status === 'pending' && p.chargeId && !vencido(p))
      .map((p) => {
        const olhando = agora - (p.vistoEm || 0) < 90e3
        const idade = agora - Date.parse(p.createdAt)
        const espera = olhando ? 0 : idade < 3600e3 ? 60e3 : 15 * 60e3
        return { p, devido: (p.conferidoEm || 0) + espera <= agora, prio: olhando ? 0 : 1 }
      })
      .filter((x) => x.devido)
      .sort((a, b) => a.prio - b.prio)
      .map((x) => x.p.id)
  }
  const id = fila.shift()
  const p = id && pedidos.get(id)
  if (!p) return
  try {
    const t = await hottrack(`/transactions/${encodeURIComponent(p.chargeId)}`)
    p.conferidoEm = Date.now()
    if (t.status === 'paid') marcarPago(p, t.paid_at)
    else if (t.status === 'expired') {
      p.status = 'expired'
      salvarPedido(p)
    }
  } catch (e) {
    p.conferidoEm = Date.now()
    if (e.status === 429) fila = []
  }
}

function marcarPago(p, paidAt) {
  if (p.status === 'paid') return
  p.status = 'paid'
  p.paidAt = paidAt || new Date().toISOString()
  salvarPedido(p)
  gravar(`eventos-${hoje()}.jsonl`, { t: Date.now(), sid: p.sid, ev: 'paid', country: p.country, focus: p.focus, utm: p.utm, props: { method: p.wallet, total: p.total, currency: p.currency, bump: p.bump, numBump: p.numBump } })
}

// ---------- Proteção contra abuso de cobranças ----------
// Gateways bloqueiam conta com muita cobrança sem pagamento: no máximo 4 cobranças novas
// por IP a cada 10 min e reaproveitamento da cobrança aberta do mesmo lead.

const porIp = new Map()
function podeCobrar(ip) {
  const agora = Date.now()
  const lista = (porIp.get(ip) || []).filter((t) => agora - t < 10 * 60e3)
  if (lista.length >= 4) return false
  lista.push(agora)
  porIp.set(ip, lista)
  return true
}

// ---------- Rotas ----------

async function criarPedido(req, corpo) {
  const { sid, country, wallet, bump, numBump, customer = {}, utm = {}, focus } = corpo
  const c = COUNTRIES[country]
  if (!c || !c.wallets.includes(wallet)) return [400, { error: 'invalid_method' }]
  const method = htMethod(wallet, c.currency)
  if (!method) return [400, { error: 'invalid_method' }]
  const valor = orderTotal(country, { bump: !!bump, numBump: !!numBump })

  const aberto = [...pedidos.values()].find(
    (p) => p.sid === sid && p.status === 'pending' && p.wallet === wallet && p.cents === valor.cents && p.currency === valor.currency && Date.now() - Date.parse(p.createdAt) < 30 * 60e3 && p.payment,
  )
  if (aberto) return [200, publico(aberto)]

  if (!podeCobrar(ip(req))) return [429, { error: 'rate_limited' }]

  const p = {
    id: randomUUID().replace(/-/g, '').slice(0, 20),
    sid: String(sid || '').slice(0, 64),
    country,
    wallet,
    method,
    currency: valor.currency,
    total: valor.total,
    cents: valor.cents,
    bump: !!bump,
    numBump: !!numBump,
    focus: String(focus || '').slice(0, 20),
    utm: limparUtm(utm),
    customer: { name: String(customer.name || '').slice(0, 120), email: String(customer.email || '').slice(0, 160), phone: String(customer.phone || '').slice(0, 30) },
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  try {
    const ch = SIMULADO && !KEY
      ? cobrancaSimulada(p)
      : await hottrack('/charges', {
          method: 'POST',
          idem: 'cn-' + p.id,
          body: {
            value_cents: p.cents,
            currency: p.currency,
            ...(method === 'whop' ? { gateway: 'whop', return_url: urlDeVolta(req, p) } : { method }),
            reference: 'cn-' + p.id,
            customer: { name: p.customer.name || undefined, email: p.customer.email || undefined },
          },
        })
    p.chargeId = ch.id
    p.payment = ch.payment || { method, kind: ch.checkout_url ? 'redirect' : ch.clabe ? 'bank_transfer' : 'copy_paste', instructions: { copy_paste: ch.copy_paste, clabe: ch.clabe, checkout_url: ch.checkout_url } }
    p.expiresAt = ch.expires_at || p.payment.expires_at || null
    salvarPedido(p)
    gravar(`eventos-${hoje()}.jsonl`, { t: Date.now(), sid: p.sid, ev: 'charge_created', country, focus: p.focus, utm: p.utm, props: { method: wallet, total: p.total } })
    return [200, publico(p)]
  } catch (e) {
    gravar(`eventos-${hoje()}.jsonl`, { t: Date.now(), sid: p.sid, ev: 'charge_error', country, focus: p.focus, utm: p.utm, props: { method: wallet, code: e.code } })
    console.error('cobranca', country, method, e.code, e.message)
    const indisponivel = ['gateway_not_connected', 'method_not_enabled_at_gateway', 'method_not_for_currency', 'gateway_not_configured', 'invalid_currency'].includes(e.code)
    return [indisponivel ? 422 : 502, { error: indisponivel ? 'method_unavailable' : 'gateway_error' }]
  }
}

// Depois do checkout da Whop o lead volta para a tela de pagamento, que confirma sozinha
function urlDeVolta(req, p) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').replace(/[^a-z0-9.:-]/gi, '')
  return host && !/^(127\.|localhost)/.test(host) ? `https://${host}/?c=${p.country}#/checkout` : undefined
}

function publico(p) {
  return { id: p.id, status: p.status, wallet: p.wallet, total: p.total, currency: p.currency, payment: p.payment, expiresAt: p.expiresAt, simulado: SIMULADO }
}

function limparUtm(u = {}) {
  const out = {}
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid', 'gclid', 'src']) {
    if (u[k]) out[k] = String(u[k]).slice(0, 200)
  }
  return out
}

function limparProps(props) {
  if (!props || typeof props !== 'object') return undefined
  const out = {}
  for (const [k, v] of Object.entries(props).slice(0, 10)) {
    if (['string', 'number', 'boolean'].includes(typeof v)) out[String(k).slice(0, 30)] = typeof v === 'string' ? v.slice(0, 80) : v
  }
  return out
}

const ip = (req) => req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.socket.remoteAddress || ''

// País do lead pelo IP (a Cloudflare manda CF-IPCountry); vai para a página antes de carregar
const PAIS_POR_IP = { BR: 'br', MX: 'mx', CO: 'co', AR: 'ar', CN: 'cn' }

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.wasm': 'application/wasm', '.task': 'application/octet-stream', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }

function enviarArquivo(req, res, caminho) {
  const ext = extname(caminho)
  const imutavel = caminho.includes(`${join(DIST, 'assets')}`) || ext === '.wasm' || ext === '.task'
  res.writeHead(200, { 'Content-Type': TIPOS[ext] || 'application/octet-stream', 'Cache-Control': imutavel ? 'public, max-age=31536000, immutable' : 'no-cache' })
  createReadStream(caminho).pipe(res)
}

let indexHtml = null
function paginaInicial(req, res) {
  if (!indexHtml) indexHtml = readFileSync(join(DIST, 'index.html'), 'utf8')
  const pais = PAIS_POR_IP[String(req.headers['cf-ipcountry'] || '').toUpperCase()] || ''
  const html = indexHtml.replace('<head>', `<head><script>window.__PAIS_IP=${JSON.stringify(pais)}</script>`)
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' })
  res.end(html)
}

function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(obj))
}

function lerCorpo(req, limite = 16 * 1024) {
  return new Promise((resolve, reject) => {
    let tam = 0
    const partes = []
    req.on('data', (d) => {
      tam += d.length
      if (tam > limite) {
        reject(new Error('grande'))
        req.destroy()
      } else partes.push(d)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(partes).toString('utf8') || '{}'))
      } catch {
        resolve({})
      }
    })
    req.on('error', reject)
  })
}

const EVENTOS = new Set(['view', 'quiz_start', 'quiz_step', 'signup', 'login', 'report_view', 'offer_view', 'buy_click', 'checkout_view', 'method_select', 'bump_toggle', 'pay_click', 'code_copy', 'redirect_open', 'paid_view'])

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  try {
    if (url.pathname === '/api/e' && req.method === 'POST') {
      const b = await lerCorpo(req)
      for (const e of (Array.isArray(b.events) ? b.events : [b]).slice(0, 20)) {
        if (!EVENTOS.has(e.ev)) continue
        gravar(`eventos-${hoje()}.jsonl`, {
          t: Date.now(),
          sid: String(e.sid || '').slice(0, 64),
          ev: e.ev,
          country: COUNTRIES[e.country] ? e.country : '',
          focus: String(e.focus || '').slice(0, 20),
          utm: limparUtm(e.utm),
          props: limparProps(e.props),
        })
      }
      res.writeHead(204).end()
      return
    }

    if (url.pathname === '/api/lead' && req.method === 'POST') {
      const b = await lerCorpo(req)
      gravar('leads.jsonl', { t: new Date().toISOString(), sid: String(b.sid || '').slice(0, 64), country: b.country, email: String(b.email || '').slice(0, 160), phone: String(b.phone || '').slice(0, 30), name: String(b.name || '').slice(0, 120), focus: b.focus, consent: !!b.consent, utm: limparUtm(b.utm) })
      res.writeHead(204).end()
      return
    }

    if (url.pathname === '/api/pedido' && req.method === 'POST') {
      const [s, corpo] = await criarPedido(req, await lerCorpo(req))
      return json(res, s, corpo)
    }

    const m = url.pathname.match(/^\/api\/pedido\/([a-f0-9]{20})$/)
    if (m && req.method === 'GET') {
      const p = pedidos.get(m[1])
      if (!p) return json(res, 404, { error: 'not_found' })
      p.vistoEm = Date.now()
      return json(res, 200, publico(p))
    }

    // Só no modo simulado: aprovar o pagamento para testar o fim do funil
    const sim = url.pathname.match(/^\/api\/pedido\/([a-f0-9]{20})\/simular-pago$/)
    if (sim && req.method === 'POST' && SIMULADO) {
      const p = pedidos.get(sim[1])
      if (!p) return json(res, 404, { error: 'not_found' })
      marcarPago(p)
      return json(res, 200, publico(p))
    }

    if (url.pathname === '/painel' || url.pathname === '/api/painel') {
      if (!PAINEL_TOKEN || url.searchParams.get('k') !== PAINEL_TOKEN) return json(res, 404, { error: 'not_found' })
      const resumo = resumoDoFunil(DATA, pedidos, { de: url.searchParams.get('de'), ate: url.searchParams.get('ate'), country: url.searchParams.get('pais'), campaign: url.searchParams.get('campanha') })
      if (url.pathname === '/api/painel') return json(res, 200, resumo)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' })
      res.end(painelHtml(resumo, url.searchParams))
      return
    }

    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'not_found' })

    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'method_not_allowed' })
    const caminho = normalize(join(DIST, decodeURIComponent(url.pathname)))
    if (caminho.startsWith(DIST) && url.pathname !== '/' && existsSync(caminho) && statSync(caminho).isFile()) return enviarArquivo(req, res, caminho)
    return paginaInicial(req, res)
  } catch (e) {
    console.error(req.method, url.pathname, e)
    if (!res.headersSent) json(res, 500, { error: 'internal' })
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Céu Natal em http://127.0.0.1:${PORT} · cobranças ${KEY ? (SIMULADO ? 'de teste (ht_test_)' : 'REAIS') : 'simuladas (sem chave)'}`)
})

