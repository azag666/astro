// Servidor do Céu Natal: entrega o site (dist/), cria cobranças na HotTrack,
// confere o pagamento e grava cada passo do funil. Node 22, sem dependências.
//
// Meta: META_PIXEL_ID, META_CAPI_TOKEN, META_TEST_CODE (ver capi.mjs).
// Variáveis: DESLIGAR_METODOS (ex.: whop), HOTTRACK_API_KEY (ht_live_ ou ht_test_; sem ela as cobranças são simuladas),
// PAINEL_TOKEN (senha do /painel), PORT (padrão 8787), DATA_DIR (padrão ./data).
import { createServer } from 'node:http'
import { createReadStream, existsSync, mkdirSync, readFileSync, appendFileSync, statSync, writeFileSync } from 'node:fs'
import { randomUUID, createHash } from 'node:crypto'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COUNTRIES, htMethod, orderTotal } from '../src/i18n/paises.js'
import { painelHtml, resumoDoFunil } from './painel.mjs'
import { capiLigada, evento, lembrar, pixelId } from './capi.mjs'
import { csvDeJornadas, jornadas } from './jornadas.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')
const DATA = process.env.DATA_DIR || join(ROOT, 'data')
const PORT = Number(process.env.PORT || 8787)
const API = 'https://hot-track.com/v1'
const KEY = process.env.HOTTRACK_API_KEY || ''
const SIMULADO = !KEY || KEY.startsWith('ht_test_')
const PAINEL_TOKEN = process.env.PAINEL_TOKEN || ''

mkdirSync(DATA, { recursive: true })
const FOTOS = join(DATA, 'fotos')
mkdirSync(FOTOS, { recursive: true })

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
// Perguntas aos profissionais: a última linha de cada id vale (resposta entra como nova linha)
const perguntas = new Map()
const ARQ_PERGUNTAS = join(DATA, 'perguntas.jsonl')
if (existsSync(ARQ_PERGUNTAS)) {
  for (const linha of readFileSync(ARQ_PERGUNTAS, 'utf8').split('\n')) {
    if (!linha) continue
    try {
      const q = JSON.parse(linha)
      perguntas.set(q.id, q)
    } catch {}
  }
}
function salvarPergunta(q) {
  perguntas.set(q.id, q)
  gravar('perguntas.jsonl', q)
}

// Tabelas só de acréscimos (a última linha de cada id vale): avaliações e especialistas
function carregar(nome) {
  const mapa = new Map()
  const arq = join(DATA, nome)
  if (existsSync(arq)) {
    for (const linha of readFileSync(arq, 'utf8').split('\n')) {
      if (!linha) continue
      try {
        const x = JSON.parse(linha)
        mapa.set(x.id, x)
      } catch {}
    }
  }
  return {
    mapa,
    salvar(x) {
      mapa.set(x.id, x)
      gravar(nome, x)
    },
  }
}
const avaliacoes = carregar('avaliacoes.jsonl')
const especialistas = carregar('especialistas.jsonl')
const novoId = () => randomUUID().replace(/-/g, '').slice(0, 12)

function notaDe(proId) {
  const lista = [...avaliacoes.mapa.values()].filter((a) => a.status === 'aprovada' && a.pro === proId)
  if (!lista.length) return { nota: null, avaliacoes: 0 }
  return { nota: Math.round((lista.reduce((s, a) => s + a.nota, 0) / lista.length) * 10) / 10, avaliacoes: lista.length }
}

const aprovada = (e) => (e.status || 'aprovada') === 'aprovada' && e.ativo !== false && !e.removido

function especialistasPublicos() {
  return [...especialistas.mapa.values()]
    .filter(aprovada)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || a.criadoEm.localeCompare(b.criadoEm))
    .map((e) => ({ id: e.id, nome: e.nome, especialidade: e.especialidade, especialidades: e.especialidades || [], bio: e.bio, foto: e.foto || null, ...notaDe(e.id) }))
}

// Foto em data URL (jpeg/png/webp, até ~1,5 MB): grava em DATA/fotos e devolve o caminho público
function salvarFoto(id, dataUrl) {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''))
  if (!m) return null
  const buf = Buffer.from(m[2], 'base64')
  if (buf.length < 500 || buf.length > 1.5 * 1024 * 1024) return null
  const nome = `${id}-${Date.now().toString(36)}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`
  writeFileSync(join(FOTOS, nome), buf)
  return `/fotos/${nome}`
}

const limparLista = (v, max = 8) => (Array.isArray(v) ? v : String(v || '').split(',')).map((x) => String(x).trim().slice(0, 40)).filter(Boolean).slice(0, max)

const porIpAvaliacao = new Map()
function podeAvaliar(ipAddr) {
  const agora = Date.now()
  const lista = (porIpAvaliacao.get(ipAddr) || []).filter((t) => agora - t < 3600e3)
  if (lista.length >= 5) return false
  lista.push(agora)
  porIpAvaliacao.set(ipAddr, lista)
  return true
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
    transferencia: { kind: 'redirect', instructions: { checkout_url: '/?c=' + p.country + '#/checkout' } },
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
  lembrar(p.sid, { ...(p.meta || {}), email: p.customer?.email, phone: p.customer?.phone, name: p.customer?.name, country: p.country })
  evento({ nome: 'Purchase', id: `purchase-${p.id}`, sid: p.sid, valor: p.total, moeda: p.currency, pedido: p.id })
  gravar(`eventos-${hoje()}.jsonl`, { t: Date.now(), sid: p.sid, ev: 'paid', country: p.country, focus: p.focus, utm: p.utm, props: { method: p.wallet, total: p.total, currency: p.currency, product: p.product || 'mapa', offer: p.offer || '', pack: p.pack || 0, bump: p.bump, numBump: p.numBump } })
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

// ---------- Métodos fora do ar ----------
// Método que falhou por configuração (não liberado/conectado) ou erro do gateway fica fora por um tempo,
// e o checkout já abre sem ele (GET /api/metodos).
const foraDoAr = new Map()
const chaveMetodo = (wallet, currency) => `${wallet}:${currency}`
function tirarDoAr(wallet, currency, minutos) {
  foraDoAr.set(chaveMetodo(wallet, currency), Date.now() + minutos * 60e3)
}
// DESLIGAR_METODOS=whop,transfcl desliga métodos de propósito (ex.: gateway desconectado)
const DESLIGADOS = new Set(String(process.env.DESLIGAR_METODOS || '').split(',').map((x) => x.trim()).filter(Boolean))
function estaForaDoAr(wallet, currency) {
  if (DESLIGADOS.has(wallet)) return true
  const ate = foraDoAr.get(chaveMetodo(wallet, currency))
  return !!ate && ate > Date.now()
}

// ---------- Rotas ----------

async function criarPedido(req, corpo) {
  const { sid, country, wallet, bump, numBump, customer = {}, utm = {}, focus } = corpo
  const product = corpo.product === 'perguntas' ? 'perguntas' : 'mapa'
  const offer = ['back', 'up', 'down'].includes(corpo.offer) ? corpo.offer : ''
  const pack = Number(corpo.pack) || 0
  const c = COUNTRIES[country]
  if (!c || !c.wallets.includes(wallet)) return [400, { error: 'invalid_method' }]
  const method = htMethod(wallet, c.currency)
  if (!method) return [400, { error: 'invalid_method' }]
  if (estaForaDoAr(wallet, c.currency)) return [422, { error: 'method_unavailable' }]
  const askBump = product === 'mapa' && !!corpo.askBump
  const valor = orderTotal(country, { product, offer, pack, askBump, bump: product === 'mapa' && !!bump, numBump: product === 'mapa' && !!numBump })
  if (!valor) return [400, { error: 'invalid_product' }]

  const aberto = [...pedidos.values()].find(
    (p) => p.sid === sid && p.status === 'pending' && p.wallet === wallet && (p.profile?.id || null) === (corpo.profile?.id || null) && p.cents === valor.cents && p.currency === valor.currency && p.product === product && Date.now() - Date.parse(p.createdAt) < 30 * 60e3 && p.payment,
  )
  if (aberto) return [200, publico(aberto)]

  if (!podeCobrar(ip(req))) return [429, { error: 'rate_limited' }]

  const p = {
    id: randomUUID().replace(/-/g, '').slice(0, 20),
    sid: String(sid || '').slice(0, 64),
    country,
    wallet,
    method,
    product,
    offer,
    pack,
    currency: valor.currency,
    total: valor.total,
    cents: valor.cents,
    bump: !!bump,
    askBump,
    numBump: !!numBump,
    focus: String(focus || '').slice(0, 20),
    utm: limparUtm(utm),
    profile: limparPerfil(corpo.profile),
    customer: { name: String(customer.name || '').slice(0, 120), email: String(customer.email || '').slice(0, 160), phone: String(customer.phone || '').slice(0, 30) },
    status: 'pending',
    createdAt: new Date().toISOString(),
    meta: {
      ip: ip(req),
      ua: String(req.headers['user-agent'] || '').slice(0, 300),
      fbp: String(corpo.fbp || '').slice(0, 100) || undefined,
      fbc: String(corpo.fbc || '').slice(0, 300) || undefined,
      fbclid: utm.fbclid ? String(utm.fbclid).slice(0, 300) : undefined,
    },
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
    lembrar(p.sid, { ...p.meta, email: p.customer.email, phone: p.customer.phone, name: p.customer.name, country })
    evento({ nome: 'AddPaymentInfo', id: `api-${p.id}`, sid: p.sid, valor: p.total, moeda: p.currency })
    gravar(`eventos-${hoje()}.jsonl`, { t: Date.now(), sid: p.sid, ev: 'charge_created', country, focus: p.focus, utm: p.utm, props: { method: wallet, total: p.total, product, offer, pack } })
    return [200, publico(p)]
  } catch (e) {
    gravar(`eventos-${hoje()}.jsonl`, { t: Date.now(), sid: p.sid, ev: 'charge_error', country, focus: p.focus, utm: p.utm, props: { method: wallet, code: e.code } })
    console.error('cobranca', country, method, e.code, e.message)
    const indisponivel = ['gateway_not_connected', 'method_not_enabled_at_gateway', 'method_not_for_currency', 'gateway_not_configured', 'invalid_currency'].includes(e.code)
    if (indisponivel) tirarDoAr(wallet, p.currency, 30)
    else if (e.status >= 500 || e.code === 'gateway_error') {
      const k = chaveMetodo(wallet, p.currency) + ':falhas'
      const n = (foraDoAr.get(k) || 0) + 1
      foraDoAr.set(k, n)
      if (n >= 2) {
        tirarDoAr(wallet, p.currency, 10)
        foraDoAr.delete(k)
      }
    }
    return [indisponivel ? 422 : 502, { error: indisponivel ? 'method_unavailable' : 'gateway_error' }]
  }
}

// Depois do checkout da Whop o lead volta para a tela de pagamento, que confirma sozinha
function urlDeVolta(req, p) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').replace(/[^a-z0-9.:-]/gi, '')
  return host && !/^(127\.|localhost)/.test(host) ? `https://${host}/?c=${p.country}#/checkout` : undefined
}

function publico(p) {
  return { id: p.id, status: p.status, product: p.product || 'mapa', pack: p.pack || 0, askBump: !!p.askBump, offer: p.offer || '', wallet: p.wallet, total: p.total, currency: p.currency, payment: p.payment, expiresAt: p.expiresAt, simulado: SIMULADO }
}

function limparUtm(u = {}) {
  const out = {}
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid', 'gclid', 'src']) {
    if (u[k]) out[k] = String(u[k]).slice(0, 200)
  }
  return out
}

// Perfil de outra pessoa para quem é o mapa (vai junto do pedido para a entrega)
function limparPerfil(pf) {
  if (!pf || typeof pf !== 'object') return null
  const txt = (v, n) => String(v ?? '').slice(0, n)
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null)
  return {
    id: txt(pf.id, 40),
    name: txt(pf.name, 120),
    relation: txt(pf.relation, 20),
    birthDate: /^\d{4}-\d{2}-\d{2}$/.test(pf.birthDate) ? pf.birthDate : '',
    birthTime: /^\d{2}:\d{2}$/.test(pf.birthTime) ? pf.birthTime : '',
    unknownTime: !!pf.unknownTime,
    place: pf.place ? { name: txt(pf.place.name, 120), lat: num(pf.place.lat), lon: num(pf.place.lon), tz: txt(pf.place.tz, 60) } : null,
  }
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
const PAIS_POR_IP = { BR: 'br', MX: 'mx', CO: 'co', CL: 'cl', AR: 'ar', CN: 'cn' }

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
  const html = indexHtml.replace('<head>', `<head><script>window.__PAIS_IP=${JSON.stringify(pais)};window.__PIXEL=${JSON.stringify(pixelId())}</script>`)
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

const META_EVENTOS = { view: 'PageView', quiz_start: 'ViewContent', signup: 'Lead', checkout_view: 'InitiateCheckout' }
const EVENTOS = new Set(['view', 'quiz_start', 'quiz_step', 'signup', 'login', 'report_view', 'offer_view', 'buy_click', 'checkout_view', 'method_select', 'bump_toggle', 'pay_click', 'code_copy', 'redirect_open', 'paid_view', 'back_offer_view', 'back_offer_accept', 'upsell_accept', 'upsell_decline', 'pro_open', 'pack_select', 'review_open', 'offer_scroll', 'checkout_invalid'])

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  try {
    if (url.pathname === '/api/e' && req.method === 'POST') {
      const b = await lerCorpo(req)
      const url0 = String(b.url || '').slice(0, 500)
      for (const e of (Array.isArray(b.events) ? b.events : [b]).slice(0, 20)) {
        if (!EVENTOS.has(e.ev)) continue
        const sidE = String(e.sid || '').slice(0, 64)
        lembrar(sidE, {
          ip: ip(req),
          ua: String(req.headers['user-agent'] || '').slice(0, 300),
          fbp: String(b.fbp || '').slice(0, 100),
          fbc: String(b.fbc || '').slice(0, 300),
          url: url0,
          country: COUNTRIES[e.country] ? e.country : '',
          fbclid: e.utm?.fbclid ? String(e.utm.fbclid).slice(0, 300) : '',
        })
        if (META_EVENTOS[e.ev] && e.props?.eid) {
          evento({ nome: META_EVENTOS[e.ev], id: String(e.props.eid).slice(0, 100), sid: sidE, url: url0, valor: e.props.value, moeda: e.props.currency })
        }
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
      lembrar(String(b.sid || '').slice(0, 64), { email: String(b.email || ''), phone: String(b.phone || ''), name: String(b.name || ''), city: String(b.city || '').slice(0, 80), country: COUNTRIES[b.country] ? b.country : '', ip: ip(req), ua: String(req.headers['user-agent'] || '').slice(0, 300) })
      gravar('leads.jsonl', { t: new Date().toISOString(), sid: String(b.sid || '').slice(0, 64), country: b.country, email: String(b.email || '').slice(0, 160), phone: String(b.phone || '').slice(0, 30), name: String(b.name || '').slice(0, 120), focus: b.focus, consent: !!b.consent, utm: limparUtm(b.utm) })
      res.writeHead(204).end()
      return
    }

    if (url.pathname === '/api/metodos' && req.method === 'GET') {
      const c = COUNTRIES[url.searchParams.get('c')]
      if (!c) return json(res, 400, { error: 'country' })
      return json(res, 200, { fora: c.wallets.filter((w) => estaForaDoAr(w, c.currency)) })
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

    if (url.pathname === '/api/perguntas' && req.method === 'POST') {
      const b = await lerCorpo(req, 32 * 1024)
      const p = pedidos.get(String(b.orderId || ''))
      if (!p || !(p.product === 'perguntas' || p.askBump) || p.status !== 'paid' || p.sid !== String(b.sid || '')) return json(res, 403, { error: 'not_allowed' })
      const pack = p.product === 'perguntas' ? p.pack : 1
      const usadas = [...perguntas.values()].filter((q) => q.orderId === p.id).length
      const novas = (Array.isArray(b.questions) ? b.questions : []).map((x) => String(x || '').trim().slice(0, 1200)).filter(Boolean)
      if (!novas.length || usadas + novas.length > pack) return json(res, 400, { error: 'too_many', restantes: pack - usadas })
      for (const texto of novas) {
        salvarPergunta({
          id: randomUUID().replace(/-/g, '').slice(0, 16),
          orderId: p.id,
          sid: p.sid,
          country: p.country,
          proId: String(b.proId || '').slice(0, 30),
          profile: limparPerfil(b.profile) || null,
          name: p.customer?.name || '',
          question: texto,
          status: 'aguardando',
          createdAt: new Date().toISOString(),
        })
      }
      gravar(`eventos-${hoje()}.jsonl`, { t: Date.now(), sid: p.sid, ev: 'questions_sent', country: p.country, utm: p.utm, props: { n: novas.length, pro: String(b.proId || '').slice(0, 30) } })
      return json(res, 200, { ok: true, restantes: pack - usadas - novas.length })
    }

    if (url.pathname === '/api/perguntas' && req.method === 'GET') {
      const sid = url.searchParams.get('sid') || ''
      if (!sid) return json(res, 400, { error: 'sid' })
      const lista = [...perguntas.values()].filter((q) => q.sid === sid).map(({ id, orderId, proId, question, status, answer, answeredAt, createdAt, profile }) => ({ id, orderId, proId, question, status, answer, answeredAt, createdAt, profileName: profile?.name || null }))
      const creditos = [...pedidos.values()]
        .filter((p) => p.sid === sid && (p.product === 'perguntas' || p.askBump) && p.status === 'paid')
        .map((p) => {
          const pack = p.product === 'perguntas' ? p.pack : 1
          return { orderId: p.id, pack, restantes: pack - lista.filter((q) => q.orderId === p.id).length }
        })
      return json(res, 200, { perguntas: lista, creditos })
    }

    if (url.pathname === '/api/painel/responder' && req.method === 'POST') {
      if (!PAINEL_TOKEN || url.searchParams.get('k') !== PAINEL_TOKEN) return json(res, 404, { error: 'not_found' })
      const b = await lerCorpo(req, 64 * 1024)
      const q = perguntas.get(String(b.id || ''))
      if (!q) return json(res, 404, { error: 'not_found' })
      salvarPergunta({ ...q, answer: String(b.answer || '').slice(0, 8000), status: 'respondida', answeredAt: new Date().toISOString() })
      return json(res, 200, { ok: true })
    }

    if (url.pathname === '/api/especialistas' && req.method === 'GET') {
      return json(res, 200, { especialistas: especialistasPublicos() })
    }

    if (url.pathname === '/api/avaliacoes' && req.method === 'GET') {
      const pro = url.searchParams.get('pro')
      const lista = [...avaliacoes.mapa.values()]
        .filter((a) => a.status === 'aprovada' && (pro === null ? true : pro === '' ? !a.pro : a.pro === pro))
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
        .slice(0, 100)
        .map(({ id, nome, nota, texto, pro: p, pais, verificada, criadoEm }) => ({ id, nome, nota, texto, pro: p, pais, verificada, criadoEm }))
      return json(res, 200, { avaliacoes: lista })
    }

    if (url.pathname === '/api/avaliacoes' && req.method === 'POST') {
      const b = await lerCorpo(req)
      const nome = String(b.nome || '').trim().slice(0, 60)
      const texto = String(b.texto || '').trim().slice(0, 1000)
      const nota = Math.round(Number(b.nota))
      const pro = b.pro ? String(b.pro).slice(0, 30) : ''
      if (nome.length < 2 || texto.length < 3 || !(nota >= 1 && nota <= 5)) return json(res, 400, { error: 'invalid' })
      if (pro && !(especialistas.mapa.has(pro) && aprovada(especialistas.mapa.get(pro)))) return json(res, 400, { error: 'invalid_pro' })
      if (!podeAvaliar(ip(req))) return json(res, 429, { error: 'rate_limited' })
      const sidA = String(b.sid || '').slice(0, 64)
      const comprou = !!sidA && [...pedidos.values()].some((p) => p.sid === sidA && p.status === 'paid')
      avaliacoes.salvar({ id: novoId(), nome, nota, texto, pro, sid: sidA, pais: COUNTRIES[b.country] ? b.country : '', verificada: comprou, status: 'pendente', criadoEm: new Date().toISOString() })
      gravar(`eventos-${hoje()}.jsonl`, { t: Date.now(), sid: sidA, ev: 'review_sent', country: COUNTRIES[b.country] ? b.country : '', props: { nota, pro } })
      return json(res, 200, { ok: true })
    }

    if (url.pathname === '/api/especialistas/cadastro' && req.method === 'POST') {
      const b = await lerCorpo(req, 2 * 1024 * 1024)
      const nome = String(b.nome || '').trim().slice(0, 60)
      const especialidade = String(b.especialidade || '').trim().slice(0, 80)
      const bio = String(b.bio || '').trim().slice(0, 600)
      const email = String(b.email || '').trim().slice(0, 120)
      const whatsapp = String(b.whatsapp || '').trim().slice(0, 30)
      if (nome.length < 2 || especialidade.length < 2 || bio.length < 20 || !/^\S+@\S+\.\S+$/.test(email)) return json(res, 400, { error: 'invalid' })
      if (!podeAvaliar('cad:' + ip(req))) return json(res, 429, { error: 'rate_limited' })
      const id = novoId()
      especialistas.salvar({
        id,
        nome,
        especialidade,
        especialidades: limparLista(b.especialidades),
        bio,
        foto: b.foto ? salvarFoto(id, b.foto) : null,
        email,
        whatsapp,
        pais: COUNTRIES[b.country] ? b.country : '',
        status: 'pendente',
        origem: 'cadastro',
        criadoEm: new Date().toISOString(),
      })
      return json(res, 200, { ok: true })
    }

    if (url.pathname.startsWith('/fotos/') && req.method === 'GET') {
      const arq = normalize(join(FOTOS, decodeURIComponent(url.pathname.slice(7))))
      if (!arq.startsWith(FOTOS) || !existsSync(arq)) return json(res, 404, { error: 'not_found' })
      res.writeHead(200, { 'Content-Type': TIPOS[extname(arq)] || 'image/jpeg', 'Cache-Control': 'public, max-age=86400' })
      createReadStream(arq).pipe(res)
      return
    }

    if (url.pathname.startsWith('/api/painel/') && req.method === 'POST') {
      if (!PAINEL_TOKEN || url.searchParams.get('k') !== PAINEL_TOKEN) return json(res, 404, { error: 'not_found' })
      const b = await lerCorpo(req, 2 * 1024 * 1024)
      if (url.pathname === '/api/painel/avaliacao') {
        const a = avaliacoes.mapa.get(String(b.id || ''))
        if (!a || !['aprovada', 'recusada', 'pendente'].includes(b.status)) return json(res, 400, { error: 'invalid' })
        avaliacoes.salvar({ ...a, status: b.status, moderadaEm: new Date().toISOString() })
        return json(res, 200, { ok: true })
      }
      if (url.pathname === '/api/painel/especialista') {
        const atual = b.id ? especialistas.mapa.get(String(b.id)) : null
        if (b.remover && atual) {
          especialistas.salvar({ ...atual, removido: true })
          return json(res, 200, { ok: true })
        }
        if (b.status && atual && ['aprovada', 'recusada', 'pendente'].includes(b.status) && !b.nome) {
          especialistas.salvar({ ...atual, status: b.status })
          return json(res, 200, { ok: true })
        }
        const nome = String(b.nome || '').trim().slice(0, 60)
        const especialidade = String(b.especialidade || '').trim().slice(0, 80)
        const bio = String(b.bio || '').trim().slice(0, 600)
        if (nome.length < 2 || especialidade.length < 2) return json(res, 400, { error: 'invalid' })
        const base = atual || { id: novoId(), criadoEm: new Date().toISOString(), status: 'aprovada', origem: 'painel' }
        const foto = b.foto ? salvarFoto(base.id, b.foto) : base.foto || null
        const e = { ...base, nome, especialidade, especialidades: b.especialidades !== undefined ? limparLista(b.especialidades) : base.especialidades || [], bio, foto, ativo: b.ativo !== false, ordem: Number(b.ordem) || 0 }
        especialistas.salvar(e)
        return json(res, 200, { ok: true, id: e.id })
      }
    }

    if (url.pathname === '/api/painel/leads.csv' || url.pathname === '/api/painel/leads') {
      if (!PAINEL_TOKEN || url.searchParams.get('k') !== PAINEL_TOKEN) return json(res, 404, { error: 'not_found' })
      const etapa = url.searchParams.get('etapa')
      const lista = jornadas(DATA, pedidos, { de: url.searchParams.get('de'), ate: url.searchParams.get('ate') }).filter((x) => !etapa || x.etapa === etapa)
      if (url.pathname.endsWith('.json') || url.pathname === '/api/painel/leads') return json(res, 200, { leads: lista })
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="ceunatal-leads-${hoje()}.csv"` })
      res.end(csvDeJornadas(lista))
      return
    }

    if (url.pathname === '/painel' || url.pathname === '/api/painel') {
      if (!PAINEL_TOKEN || url.searchParams.get('k') !== PAINEL_TOKEN) return json(res, 404, { error: 'not_found' })
      const resumo = resumoDoFunil(DATA, pedidos, { de: url.searchParams.get('de'), ate: url.searchParams.get('ate'), country: url.searchParams.get('pais'), campaign: url.searchParams.get('campanha') })
      if (url.pathname === '/api/painel') return json(res, 200, resumo)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' })
      res.end(
        painelHtml(
          resumo,
          url.searchParams,
          [...perguntas.values()].sort((a, b) => (a.status === b.status ? a.createdAt.localeCompare(b.createdAt) : a.status === 'aguardando' ? -1 : 1)),
          {
            avaliacoes: [...avaliacoes.mapa.values()],
            jornadas: url.searchParams.get('aba') === 'leads' ? jornadas(DATA, pedidos, { de: url.searchParams.get('de'), ate: url.searchParams.get('ate') }) : null,
            especialistas: [...especialistas.mapa.values()].filter((e) => !e.removido).map((e) => ({ ...e, status: e.status || 'aprovada', ...notaDe(e.id) })),
          },
        ),
      )
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
  if (KEY) conferirChave()
  console.log(`Meta: pixel ${pixelId() || '(sem META_PIXEL_ID)'} · CAPI ${capiLigada ? 'ligada' : 'desligada (falta META_CAPI_TOKEN)'}${process.env.META_TEST_CODE ? ' · MODO TESTE ' + process.env.META_TEST_CODE : ''}`)
})

// Confere a chave na HotTrack ao ligar: nome, escopos e se falta algum que o site usa
async function conferirChave() {
  try {
    const me = await hottrack('/me')
    const escopos = me.key?.scopes || []
    const faltam = ['write:charges', 'read:sales'].filter((e) => !escopos.includes(e))
    console.log(`Chave OK: ${me.key?.prefix || ''} (${me.key?.environment || ''}) · conta ${me.seller?.id || ''} ${me.seller?.name || ''} · escopos ${escopos.join(', ')}${faltam.length ? ` · FALTAM: ${faltam.join(', ')}` : ''}`)
  } catch (e) {
    console.error(`CHAVE INVÁLIDA (${e.code}): ${e.message}. As cobranças vão falhar até corrigir HOTTRACK_API_KEY.`)
  }
}

