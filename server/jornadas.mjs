// Jornada de cada pessoa (sid): até onde chegou no funil, onde parou, por que (provável) e contato
// para remarketing. Junta eventos do período, cadastros (leads.jsonl) e pedidos.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Etapas na ordem do funil; a jornada fica na mais avançada que a pessoa alcançou
export const ETAPAS = [
  ['entrou', 'Entrou e saiu sem começar o quiz'],
  ['quiz', 'Começou o quiz e não terminou'],
  ['cadastro', 'Terminou o quiz (deixou contato) e não viu a oferta'],
  ['oferta', 'Viu a oferta e não abriu o checkout'],
  ['checkout', 'Abriu o checkout e não gerou pagamento'],
  ['codigo', 'Gerou o pagamento e não pagou'],
  ['pagou', 'Comprou'],
]
const ORDEM = Object.fromEntries(ETAPAS.map(([k], i) => [k, i]))

function lerJsonl(arq) {
  if (!existsSync(arq)) return []
  const out = []
  for (const l of readFileSync(arq, 'utf8').split('\n')) {
    if (!l) continue
    try {
      out.push(JSON.parse(l))
    } catch {}
  }
  return out
}

function dias(de, ate) {
  const fim = ate ? new Date(ate + 'T00:00:00Z') : new Date()
  const ini = de ? new Date(de + 'T00:00:00Z') : new Date(fim.getTime() - 864e5)
  const out = []
  for (let d = new Date(ini); d <= fim && out.length < 62; d = new Date(d.getTime() + 864e5)) out.push(d.toISOString().slice(0, 10))
  return out
}

const min = (ms) => (ms >= 60e3 ? `${Math.round(ms / 60e3)} min` : `${Math.round(ms / 1e3)} s`)

export function jornadas(dir, pedidos, { de, ate } = {}) {
  const por = new Map()
  const j = (sid) => {
    if (!por.has(sid)) por.set(sid, { sid, eventos: [], etapa: 'entrou', utm: {}, quiz: { ultima: 0, nome: '' }, scroll: 0, erros: [], metodos: new Set(), pedidos: [] })
    return por.get(sid)
  }
  for (const dia of dias(de, ate)) {
    for (const e of lerJsonl(join(dir, `eventos-${dia}.jsonl`))) {
      if (!e.sid) continue
      const x = j(e.sid)
      x.eventos.push(e)
      x.primeira = Math.min(x.primeira || Infinity, e.t)
      x.ultima = Math.max(x.ultima || 0, e.t)
      if (e.country) x.country = e.country
      if (e.focus) x.focus = e.focus
      if (e.utm && Object.keys(e.utm).length) x.utm = { ...e.utm, ...x.utm }
      const sobe = (k) => ORDEM[k] > ORDEM[x.etapa] && (x.etapa = k)
      if (e.ev === 'quiz_start' || e.ev === 'quiz_step') sobe('quiz')
      if (e.ev === 'quiz_step' && (e.props?.i || 0) >= x.quiz.ultima) x.quiz = { ultima: e.props.i, nome: e.props.step }
      if (e.ev === 'signup') sobe('cadastro')
      if (e.ev === 'offer_view') sobe('oferta')
      if (e.ev === 'offer_scroll') x.scroll = Math.max(x.scroll, e.props?.pct || 0)
      if (e.ev === 'back_offer_view') x.viuVolta = true
      if (e.ev === 'checkout_view') sobe('checkout')
      if (e.ev === 'checkout_invalid') x.erros.push(String(e.props?.fields || ''))
      if (e.ev === 'method_select' && e.props?.method) x.metodos.add(e.props.method)
      if (e.ev === 'pay_click') x.clicouPagar = true
      if (e.ev === 'charge_error') x.erros.push(`cobrança: ${e.props?.code || 'erro'}`)
      if (e.ev === 'charge_created') sobe('codigo')
      if (e.ev === 'code_copy') x.copiou = true
      if (e.ev === 'redirect_open') x.abriuLink = true
      if (e.ev === 'paid') sobe('pagou')
      if (e.ev === 'upsell_decline') x.recusouUpsell = true
      if (e.ev === 'upsell_accept') x.aceitouUpsell = true
    }
  }

  // Contato: último cadastro de cada aparelho (e o do pedido, se não houver cadastro)
  const contatos = new Map()
  for (const l of lerJsonl(join(dir, 'leads.jsonl'))) if (l.sid) contatos.set(l.sid, l)
  for (const p of pedidos.values()) {
    if (!por.has(p.sid) && !(new Date(p.createdAt) >= new Date((dias(de, ate)[0] || '') + 'T00:00:00Z'))) continue
    const x = j(p.sid)
    x.pedidos.push(p)
    if (!x.country) x.country = p.country
    if (!contatos.has(p.sid) && p.customer?.email) contatos.set(p.sid, { email: p.customer.email, phone: p.customer.phone, name: p.customer.name, consent: true })
  }

  const agora = Date.now()
  return [...por.values()]
    .map((x) => {
      const c = contatos.get(x.sid) || {}
      const mapa = x.pedidos.filter((p) => (p.product || 'mapa') === 'mapa')
      const pago = x.pedidos.filter((p) => p.status === 'paid')
      const aberto = mapa.find((p) => p.status === 'pending')
      if (mapa.some((p) => p.status === 'paid')) x.etapa = 'pagou'
      else if (aberto && ORDEM[x.etapa] < ORDEM.codigo) x.etapa = 'codigo'
      return {
        sid: x.sid,
        etapa: x.etapa,
        etapaNome: Object.fromEntries(ETAPAS)[x.etapa],
        motivo: motivo(x, aberto, agora),
        pais: x.country || '',
        dor: x.focus || '',
        campanha: x.utm.utm_campaign || '',
        criativo: x.utm.utm_content || '',
        origem: x.utm.utm_source || '',
        nome: c.name || '',
        email: c.email || '',
        whatsapp: c.phone || '',
        consentimento: !!c.consent,
        valorPago: pago.reduce((s, p) => s + p.total, 0),
        moeda: pago[0]?.currency || aberto?.currency || '',
        pendente: aberto ? `${aberto.wallet} ${aberto.total} ${aberto.currency}` : '',
        primeira: x.primeira ? new Date(x.primeira).toISOString() : '',
        ultima: x.ultima ? new Date(x.ultima).toISOString() : '',
        tempo: x.primeira && x.ultima ? min(x.ultima - x.primeira) : '',
      }
    })
    .sort((a, b) => ORDEM[b.etapa] - ORDEM[a.etapa] || b.ultima.localeCompare(a.ultima))
}

// Motivo provável, a partir do que a pessoa fez antes de sumir
function motivo(x, aberto, agora) {
  const ult = x.ultima ? agora - x.ultima : 0
  switch (x.etapa) {
    case 'entrou':
      return 'Saiu na primeira tela (anúncio × página não convenceu, ou página lenta)'
    case 'quiz':
      return `Parou na pergunta ${x.quiz.ultima} (${x.quiz.nome || '?'})${x.quiz.nome === 'account' ? ': não quis deixar e-mail/WhatsApp' : x.quiz.nome === 'palm' ? ': leitura da mão (câmera)' : x.quiz.nome === 'city' ? ': busca da cidade' : ''}`
    case 'cadastro':
      return 'Deixou contato e saiu na tela de análise (antes de ver o resultado)'
    case 'oferta':
      return x.viuVolta
        ? `Viu a oferta${x.scroll ? ` (rolou ${x.scroll}%)` : ''} e recusou também o desconto da volta: preço ou interesse`
        : `Viu a oferta${x.scroll ? ` e rolou até ${x.scroll}%` : ''} e saiu${x.scroll && x.scroll < 50 ? ': não chegou ao preço' : ': preço ou confiança'}`
    case 'checkout':
      if (x.erros.length) return `Travou no checkout: ${[...new Set(x.erros)].join('; ')}`
      if (x.clicouPagar) return 'Clicou em pagar e não chegou a gerar o código'
      return `Abriu o checkout e saiu sem tentar pagar${x.metodos.size ? ` (olhou ${[...x.metodos].join(', ')})` : ''}: forma de pagamento ou preço final`
    case 'codigo': {
      const metodo = aberto?.wallet || ''
      const acao = x.copiou ? 'copiou o código' : x.abriuLink ? 'abriu o link de pagamento' : 'não copiou o código nem abriu o link'
      return `Gerou ${metodo} e não pagou (${acao})${ult < 3 * 3600e3 ? ' — ainda pode pagar' : ''}`
    }
    case 'pagou':
      return x.recusouUpsell && !x.aceitouUpsell ? 'Comprou; recusou o upsell' : x.aceitouUpsell ? 'Comprou e aceitou o upsell' : 'Comprou'
    default:
      return ''
  }
}

export function csvDeJornadas(lista) {
  const cols = ['etapaNome', 'motivo', 'nome', 'email', 'whatsapp', 'consentimento', 'pais', 'dor', 'campanha', 'criativo', 'pendente', 'valorPago', 'moeda', 'primeira', 'ultima', 'tempo', 'sid']
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return '﻿' + [cols.join(';'), ...lista.map((x) => cols.map((k) => q(x[k])).join(';'))].join('\n')
}

// Resumo em texto para o relatório da manhã
export function resumoTexto(lista) {
  const total = lista.length
  const porEtapa = Object.fromEntries(ETAPAS.map(([k]) => [k, lista.filter((x) => x.etapa === k)]))
  const linhas = [`Pessoas no período: ${total}`]
  for (const [k, nome] of ETAPAS) {
    const n = porEtapa[k].length
    linhas.push(`- ${nome}: ${n}${n ? ` (${Math.round((n / total) * 100)}%)` : ''}, com contato: ${porEtapa[k].filter((x) => x.email || x.whatsapp).length}`)
  }
  const motivos = {}
  for (const x of lista) if (x.etapa !== 'pagou') motivos[x.motivo.replace(/\d+%/g, 'N%')] = (motivos[x.motivo.replace(/\d+%/g, 'N%')] || 0) + 1
  linhas.push('', 'Motivos mais comuns:')
  for (const [m, n] of Object.entries(motivos).sort((a, b) => b[1] - a[1]).slice(0, 10)) linhas.push(`- ${n}× ${m}`)
  const porCriativo = {}
  for (const x of lista) {
    const k = `${x.campanha || '(sem campanha)'} / ${x.criativo || '-'}`
    const o = (porCriativo[k] ||= { pessoas: 0, cadastro: 0, checkout: 0, pagou: 0 })
    o.pessoas++
    if (ORDEM[x.etapa] >= ORDEM.cadastro) o.cadastro++
    if (ORDEM[x.etapa] >= ORDEM.checkout) o.checkout++
    if (x.etapa === 'pagou') o.pagou++
  }
  linhas.push('', 'Por campanha / criativo (pessoas → cadastro → checkout → compra):')
  for (const [k, o] of Object.entries(porCriativo).sort((a, b) => b[1].pessoas - a[1].pessoas)) linhas.push(`- ${k}: ${o.pessoas} → ${o.cadastro} → ${o.checkout} → ${o.pagou}`)
  return linhas.join('\n')
}
