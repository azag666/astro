// Painel do funil: lê os eventos gravados por dia e conta pessoas únicas (sid) por passo.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const PASSOS = [
  ['view', 'Entrou na página'],
  ['quiz_start', 'Começou o quiz'],
  ['signup', 'Cadastrou e-mail e WhatsApp'],
  ['offer_view', 'Viu a oferta'],
  ['checkout_view', 'Abriu o checkout'],
  ['pay_click', 'Clicou em pagar'],
  ['charge_created', 'Recebeu o código de pagamento'],
  ['paid', 'Pagou'],
]

function dias(de, ate) {
  const fim = ate ? new Date(ate + 'T00:00:00Z') : new Date()
  const ini = de ? new Date(de + 'T00:00:00Z') : new Date(fim.getTime() - 6 * 864e5)
  const out = []
  for (let d = new Date(ini); d <= fim && out.length < 92; d = new Date(d.getTime() + 864e5)) out.push(d.toISOString().slice(0, 10))
  return out
}

export function resumoDoFunil(dir, pedidos, { de, ate, country, campaign } = {}) {
  const lista = dias(de, ate)
  const porPasso = Object.fromEntries(PASSOS.map(([k]) => [k, new Set()]))
  const porPais = {}
  const porCampanha = {}
  const quiz = {}
  const metodos = {}
  const erros = {}
  const receita = {}

  for (const dia of lista) {
    const arq = join(dir, `eventos-${dia}.jsonl`)
    if (!existsSync(arq)) continue
    for (const linha of readFileSync(arq, 'utf8').split('\n')) {
      if (!linha) continue
      let e
      try {
        e = JSON.parse(linha)
      } catch {
        continue
      }
      if (country && e.country !== country) continue
      const camp = e.utm?.utm_campaign || '(sem campanha)'
      if (campaign && camp !== campaign) continue
      if (!e.sid) continue

      if (porPasso[e.ev]) {
        porPasso[e.ev].add(e.sid)
        const pais = e.country || '?'
        ;(porPais[pais] ||= Object.fromEntries(PASSOS.map(([k]) => [k, new Set()])))[e.ev].add(e.sid)
        ;(porCampanha[camp] ||= Object.fromEntries(PASSOS.map(([k]) => [k, new Set()])))[e.ev].add(e.sid)
      }
      if (e.ev === 'quiz_step' && e.props?.step) (quiz[`${String(e.props.i ?? '').padStart(2, '0')} ${e.props.step}`] ||= new Set()).add(e.sid)
      if (e.ev === 'charge_created' || e.ev === 'paid') {
        const m = (metodos[`${e.country}/${e.props?.method}`] ||= { cobrancas: 0, pagas: 0 })
        if (e.ev === 'charge_created') m.cobrancas++
        else m.pagas++
      }
      if (e.ev === 'paid' && e.props?.currency) receita[e.props.currency] = (receita[e.props.currency] || 0) + Number(e.props.total || 0)
      if (e.ev === 'charge_error') erros[`${e.country}/${e.props?.method}: ${e.props?.code}`] = (erros[`${e.country}/${e.props?.method}: ${e.props?.code}`] || 0) + 1
    }
  }

  const contar = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.size]))
  return {
    periodo: { de: lista[0], ate: lista[lista.length - 1] },
    funil: contar(porPasso),
    porPais: Object.fromEntries(Object.entries(porPais).map(([k, v]) => [k, contar(v)])),
    porCampanha: Object.fromEntries(Object.entries(porCampanha).map(([k, v]) => [k, contar(v)])),
    quiz: Object.fromEntries(Object.entries(contar(quiz)).sort()),
    metodos,
    erros,
    receita,
    pedidosAbertos: [...pedidos.values()].filter((p) => p.status === 'pending').length,
  }
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const pct = (a, b) => (b ? `${Math.round((a / b) * 1000) / 10}%` : '—')

function tabelaFunil(titulo, grupos) {
  const cab = PASSOS.map(([, nome]) => `<th>${esc(nome)}</th>`).join('')
  const linhas = Object.entries(grupos)
    .sort((a, b) => (b[1].view || 0) - (a[1].view || 0))
    .map(([nome, f]) => `<tr><td>${esc(nome)}</td>${PASSOS.map(([k], i) => `<td>${f[k] || 0}${i ? `<small>${pct(f[k] || 0, f[PASSOS[i - 1][0]] || 0)}</small>` : ''}</td>`).join('')}<td><b>${pct(f.paid || 0, f.view || 0)}</b></td></tr>`)
    .join('')
  return `<h2>${esc(titulo)}</h2><div class="scroll"><table><tr><th></th>${cab}<th>Conversão</th></tr>${linhas || '<tr><td colspan="10">Sem dados</td></tr>'}</table></div>`
}

export function painelHtml(r, params) {
  const k = esc(params.get('k') || '')
  const maior = Math.max(1, r.funil.view || 0)
  const barras = PASSOS.map(([key, nome], i) => {
    const n = r.funil[key] || 0
    const ant = i ? r.funil[PASSOS[i - 1][0]] || 0 : n
    return `<div class="passo"><span class="nome">${esc(nome)}</span><span class="barra"><i style="width:${(n / maior) * 100}%"></i></span><span class="n">${n}</span><span class="taxa">${i ? pct(n, ant) : ''}</span></div>`
  }).join('')
  const quiz = Object.entries(r.quiz).map(([s, n]) => `<tr><td>${esc(s)}</td><td>${n}</td></tr>`).join('')
  const metodos = Object.entries(r.metodos).map(([m, v]) => `<tr><td>${esc(m)}</td><td>${v.cobrancas}</td><td>${v.pagas}</td><td>${pct(v.pagas, v.cobrancas)}</td></tr>`).join('')
  const erros = Object.entries(r.erros).map(([m, n]) => `<tr><td>${esc(m)}</td><td>${n}</td></tr>`).join('')
  const receita = Object.entries(r.receita).map(([m, v]) => `${esc(m)} ${v.toLocaleString('pt-BR')}`).join(' · ') || '—'

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Funil · Céu Natal</title>
<style>
body{margin:0;font:14px/1.45 -apple-system,BlinkMacSystemFont,Inter,sans-serif;background:#f5f5f7;color:#1d1d1f}
main{max-width:1100px;margin:0 auto;padding:28px 18px 60px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:32px 0 10px}
.sub{color:#6e6e73;margin-bottom:18px}
form{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
input,select,button{font:inherit;padding:7px 10px;border:1px solid #d2d2d7;border-radius:8px;background:#fff}
button{background:#1d1d1f;color:#fff;border:0}
.card{background:#fff;border-radius:14px;padding:18px;box-shadow:0 1px 2px #0000000d}
.passo{display:grid;grid-template-columns:220px 1fr 60px 60px;gap:10px;align-items:center;padding:5px 0}
.barra{background:#f0f0f3;border-radius:6px;height:14px;overflow:hidden}.barra i{display:block;height:100%;background:#7a5af8;border-radius:6px}
.n{text-align:right;font-weight:600}.taxa{color:#6e6e73;font-size:12px}
table{border-collapse:collapse;width:100%;background:#fff;border-radius:12px;overflow:hidden}
th,td{padding:8px 10px;border-bottom:1px solid #f0f0f3;text-align:left;white-space:nowrap}th{font-weight:600;font-size:12px;color:#6e6e73}
small{display:block;color:#86868b;font-size:11px}.scroll{overflow-x:auto}
.kpis{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}.kpi{background:#fff;border-radius:12px;padding:12px 16px;min-width:150px}.kpi b{display:block;font-size:20px}
@media(max-width:640px){.passo{grid-template-columns:1fr 50px 50px}.barra{display:none}}
</style></head><body><main>
<h1>Funil do Céu Natal</h1>
<div class="sub">${esc(r.periodo.de)} a ${esc(r.periodo.ate)} · pessoas únicas por passo</div>
<form><input type="hidden" name="k" value="${k}">
<input type="date" name="de" value="${esc(params.get('de') || r.periodo.de)}"><input type="date" name="ate" value="${esc(params.get('ate') || r.periodo.ate)}">
<select name="pais"><option value="">Todos os países</option>${['br', 'mx', 'co', 'ar', 'cn'].map((p) => `<option ${params.get('pais') === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
<input name="campanha" placeholder="utm_campaign" value="${esc(params.get('campanha') || '')}"><button>Filtrar</button></form>
<div class="kpis"><div class="kpi">Vendas<b>${r.funil.paid || 0}</b></div><div class="kpi">Conversão<b>${pct(r.funil.paid || 0, r.funil.view || 0)}</b></div><div class="kpi">Faturamento<b style="font-size:15px">${receita}</b></div><div class="kpi">Pagamentos em aberto<b>${r.pedidosAbertos}</b></div></div>
<div class="card">${barras}</div>
${tabelaFunil('Por país', r.porPais)}
${tabelaFunil('Por campanha (utm_campaign)', r.porCampanha)}
<h2>Onde o quiz perde gente</h2><table><tr><th>Pergunta</th><th>Pessoas</th></tr>${quiz || '<tr><td colspan="2">Sem dados</td></tr>'}</table>
<h2>Métodos de pagamento</h2><table><tr><th>País/método</th><th>Cobranças</th><th>Pagas</th><th>Taxa</th></tr>${metodos || '<tr><td colspan="4">Sem dados</td></tr>'}</table>
${erros ? `<h2>Falhas ao gerar cobrança</h2><table><tr><th>País/método: erro</th><th>Vezes</th></tr>${erros}</table>` : ''}
</main></body></html>`
}
