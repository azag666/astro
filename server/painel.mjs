// Painel do funil: lê os eventos gravados por dia e conta pessoas únicas (sid) por passo.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ETAPAS } from './jornadas.mjs'

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
  const ofertas = {}
  const OFERTAS = { back_offer_view: 'Volta: viu', back_offer_accept: 'Volta: aceitou', upsell_accept: 'Upsell/downsell: aceitou', upsell_decline: 'Upsell/downsell: recusou', pro_open: 'Profissionais: abriu perfil', questions_sent: 'Perguntas enviadas' }

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

      const extra = (e.ev === 'charge_created' || e.ev === 'paid') && e.props?.product === 'perguntas'
      if (extra || (e.ev === 'paid' && e.props?.offer === 'back')) {
        const nome = e.props?.product === 'perguntas' ? `Pacote ${e.props.pack} pergunta(s)${e.props.offer === 'up' ? ' (upsell)' : e.props.offer === 'down' ? ' (downsell)' : ''}` : 'Mapa com desconto da volta'
        const o = (ofertas[nome] ||= { cobrancas: 0, pagas: 0 })
        if (e.ev === 'paid') o.pagas++
        else o.cobrancas++
      }
      if (OFERTAS[e.ev]) {
        const o = (ofertas[OFERTAS[e.ev]] ||= { pessoas: new Set() })
        o.pessoas.add(e.sid)
      }
      if (porPasso[e.ev] && !extra) {
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
    ofertas: Object.fromEntries(Object.entries(ofertas).map(([k, v]) => [k, v.pessoas ? { pessoas: v.pessoas.size } : v])),
    pedidosAbertos: [...pedidos.values()].filter((p) => p.status === 'pending').length,
  }
}

const PROS = { helena: 'Helena (astróloga)', marina: 'Marina (taróloga)', sofia: 'Sofia (numeróloga)', luna: 'Luna (amor e relacionamentos)', clara: 'Clara (carreira e dinheiro)' }

function blocoPerguntas(lista, k, nomes = {}) {
  if (!lista.length) return ''
  const abertas = lista.filter((q) => q.status === 'aguardando').length
  const itens = lista
    .slice(0, 200)
    .map(
      (q) => `<div class="card pergunta"><div class="sub">${esc(q.createdAt.slice(0, 16).replace('T', ' '))} UTC · ${esc(q.country)} · ${esc(nomes[q.proId] || PROS[q.proId] || q.proId)} · ${esc(q.name)}${q.profile?.name ? ` · sobre ${esc(q.profile.name)} (${esc(q.profile.birthDate)} ${esc(q.profile.birthTime || '')} ${esc(q.profile.place?.name || '')})` : ''}</div>
<p><b>${esc(q.question)}</b></p>
<form method="post" onsubmit="event.preventDefault();fetch('/api/painel/responder?k=${k}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'${esc(q.id)}',answer:this.a.value})}).then(r=>r.ok?location.reload():alert('erro'))">
<textarea name="a" rows="4" style="width:100%;box-sizing:border-box" placeholder="Resposta">${esc(q.answer || '')}</textarea>
<button>${q.status === 'respondida' ? 'Atualizar resposta' : 'Responder'}</button></form></div>`,
    )
    .join('')
  return `<h2>Perguntas aos profissionais (${abertas} aguardando)</h2>${itens}`
}

const postar = (k, rota, corpo) => `fetch('/api/painel/${rota}?k=${k}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(${corpo})}).then(r=>r.ok?location.reload():r.json().then(e=>alert(e.error||'erro')))`

function blocoAvaliacoes(lista, k, nomes) {
  const ordem = { pendente: 0, aprovada: 1, recusada: 2 }
  const itens = lista
    .slice()
    .sort((a, b) => ordem[a.status] - ordem[b.status] || b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, 300)
    .map((a) => {
      const tag = a.status === 'aprovada' ? '<span class="tag ok">aprovada</span>' : a.status === 'recusada' ? '<span class="tag no">recusada</span>' : '<span class="tag">pendente</span>'
      const botoes = ['aprovada', 'recusada']
        .filter((st) => st !== a.status)
        .map((st) => `<button type="button" onclick="${esc(postar(k, 'avaliacao', `{id:'${a.id}',status:'${st}'}`))}">${st === 'aprovada' ? 'Aprovar' : 'Recusar'}</button>`)
        .join('')
      return `<div class="card pergunta"><div class="sub"><b>${esc(a.nome)}</b> · <span class="estrelas">${'★'.repeat(a.nota)}${'☆'.repeat(5 - a.nota)}</span> · ${a.pro ? esc(nomes[a.pro] || a.pro) : 'Céu Natal'} · ${esc(a.pais || '')} · ${esc(a.criadoEm.slice(0, 16).replace('T', ' '))} UTC ${tag}${a.verificada ? '<span class="tag v">comprou</span>' : ''}</div><p>${esc(a.texto)}</p><div class="linha">${botoes}</div></div>`
    })
    .join('')
  return `<h2>Avaliações</h2><p class="sub">Qualquer pessoa avalia pelo site (#/avaliacoes ou na página da especialista). Só as aprovadas aparecem. "comprou" = o aparelho tem compra paga.</p>${itens || '<p class="sub">Nenhuma avaliação ainda.</p>'}`
}

function blocoLeads(lista, params, k) {
  const etapa = params.get('etapa') || ''
  const filtrada = lista.filter((x) => !etapa || x.etapa === etapa)
  const contagem = Object.fromEntries(ETAPAS.map(([id]) => [id, lista.filter((x) => x.etapa === id).length]))
  const q = (extra) => `?k=${k}&aba=leads${params.get('de') ? `&de=${esc(params.get('de'))}` : ''}${params.get('ate') ? `&ate=${esc(params.get('ate'))}` : ''}${extra}`
  const fone = (t) => String(t || '').replace(/\D/g, '')
  const linhas = filtrada
    .slice(0, 500)
    .map(
      (x) => `<tr><td>${esc(x.ultima.slice(5, 16).replace('T', ' '))}</td><td>${esc(x.etapaNome)}</td><td style="white-space:normal;min-width:260px">${esc(x.motivo)}</td><td>${esc(x.nome)}</td><td>${x.email ? `<a href="mailto:${esc(x.email)}">${esc(x.email)}</a>` : ''}</td><td>${x.whatsapp ? `<a href="https://wa.me/${fone(x.whatsapp)}" target="_blank">${esc(x.whatsapp)}</a>` : ''}</td><td>${esc(x.pais)}</td><td>${esc(x.dor)}</td><td>${esc(x.campanha)}</td><td>${esc(x.criativo)}</td><td>${esc(x.pendente)}</td><td>${x.valorPago ? esc(`${x.valorPago} ${x.moeda}`) : ''}</td><td>${esc(x.tempo)}</td></tr>`,
    )
    .join('')
  return `<h2>Leads e abandono</h2>
<p class="sub">Cada pessoa aparece na etapa mais avançada a que chegou, com o motivo provável de ter parado. Padrão: últimas 24 h (UTC). E-mail e WhatsApp só de quem deixou no cadastro ou no pagamento.</p>
<form><input type="hidden" name="k" value="${k}"><input type="hidden" name="aba" value="leads"><input type="date" name="de" value="${esc(params.get('de') || '')}"><input type="date" name="ate" value="${esc(params.get('ate') || '')}"><button>Filtrar</button>
<a href="/api/painel/leads.csv${q(etapa ? `&etapa=${etapa}` : '')}" style="margin-left:8px">Baixar planilha (CSV)</a></form>
<nav class="abas"><a href="${q('')}" class="${etapa ? '' : 'on'}">Todos (${lista.length})</a>${ETAPAS.map(([id, nome]) => `<a href="${q(`&etapa=${id}`)}" class="${etapa === id ? 'on' : ''}" title="${esc(nome)}">${esc(nome.split(' e ')[0].split(' (')[0])} (${contagem[id]})</a>`).join('')}</nav>
<div class="scroll"><table><tr><th>Último acesso</th><th>Parou em</th><th>Motivo provável</th><th>Nome</th><th>E-mail</th><th>WhatsApp</th><th>País</th><th>Dor</th><th>Campanha</th><th>Criativo</th><th>Pagamento aberto</th><th>Pagou</th><th>Tempo</th></tr>${linhas || '<tr><td colspan="13">Sem dados no período</td></tr>'}</table></div>`
}

function blocoEspecialistas(lista, k) {
  const ordem = { pendente: 0, aprovada: 1, recusada: 2 }
  const script = `<script>
function lerFoto(input, cb) {
  const f = input.files && input.files[0]
  if (!f) return cb(undefined)
  const img = new Image()
  img.onload = () => {
    const lado = Math.min(img.width, img.height), c = document.createElement('canvas')
    c.width = c.height = 512
    c.getContext('2d').drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 512, 512)
    cb(c.toDataURL('image/jpeg', 0.85))
  }
  img.src = URL.createObjectURL(f)
}
function salvarEsp(form) {
  lerFoto(form.foto, (foto) => {
    fetch('/api/painel/especialista?k=${k}', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: form.id.value || undefined, nome: form.nome.value, especialidade: form.esp.value, especialidades: form.tags.value, bio: form.bio.value, traducoes: { es: { especialidade: form.esp_es.value, especialidades: form.tags_es.value, bio: form.bio_es.value } }, ordem: form.ordem.value, foto }) })
      .then((r) => (r.ok ? location.reload() : r.json().then((e) => alert(e.error || 'erro'))))
  })
}
</script>`
  const form = (e = {}) => {
    const es = e.traducoes?.es || {}
    const tag = e.status === 'pendente' ? '<span class="tag">pendente</span>' : e.status === 'recusada' ? '<span class="tag no">recusada</span>' : e.id ? '<span class="tag ok">no ar</span>' : ''
    const status = e.id
      ? ['aprovada', 'recusada']
          .filter((st) => st !== e.status)
          .map((st) => `<button type="button" onclick="${esc(postar(k, 'especialista', `{id:'${e.id}',status:'${st}'}`))}">${st === 'aprovada' ? 'Aprovar' : 'Recusar'}</button>`)
          .join('')
      : ''
    return `<form class="card grade" onsubmit="event.preventDefault();salvarEsp(this)">
<div class="linha" style="align-items:center">${e.foto ? `<img src="${esc(e.foto)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover">` : ''}<b>${esc(e.nome || 'Nova especialista')}</b>${tag}${e.origem === 'cadastro' ? '<span class="tag v">cadastro pelo site</span>' : ''}</div>
${e.email || e.whatsapp ? `<div class="sub">Contato: ${esc(e.email || '')} ${esc(e.whatsapp || '')} ${e.pais ? '· ' + esc(e.pais) : ''}</div>` : ''}
<input type="hidden" name="id" value="${esc(e.id || '')}">
<input class="l" name="nome" placeholder="Nome" value="${esc(e.nome || '')}" required>
<input class="l" name="esp" placeholder="Especialidade principal (ex.: Astróloga)" value="${esc(e.especialidade || '')}" required>
<input class="l" name="tags" placeholder="Outras especialidades, separadas por vírgula (ex.: Tarô, Amor, Sinastria)" value="${esc((e.especialidades || []).join(', '))}">
<textarea name="bio" rows="3" placeholder="Bio curta (aparece para o cliente)">${esc(e.bio || '')}</textarea>
<details${es.bio || es.especialidade ? ' open' : ''}><summary class="sub">Em espanhol (México, Colômbia, Chile, Argentina). Vazio = mostra o português</summary>
<input class="l" name="esp_es" placeholder="Especialidad principal (ej.: Astróloga)" value="${esc(es.especialidade || '')}">
<input class="l" name="tags_es" placeholder="Otras especialidades, separadas por coma" value="${esc((es.especialidades || []).join(', '))}">
<textarea name="bio_es" rows="3" placeholder="Bio corta en español">${esc(es.bio || '')}</textarea>
</details>
<label class="sub">Foto (quadrada, recortada sozinha): <input type="file" name="foto" accept="image/*"></label>
<div class="linha"><input name="ordem" type="number" placeholder="Ordem" value="${esc(e.ordem ?? '')}" style="width:90px"><button>${e.id ? 'Salvar' : 'Cadastrar especialista'}</button>${status}${e.id ? `<button type="button" onclick="${esc(`if(confirm('Remover ${e.nome}?'))` + postar(k, 'especialista', `{id:'${e.id}',remover:true}`))}">Remover</button>` : ''}</div>
${e.id && e.status === 'aprovada' ? `<div class="sub">${e.nota ? `★ ${e.nota} · ${e.avaliacoes} avaliação(ões) aprovada(s)` : 'Sem avaliações aprovadas ainda'}</div>` : ''}
</form>`
  }
  const ordenada = lista.slice().sort((a, b) => ordem[a.status] - ordem[b.status] || (a.ordem ?? 0) - (b.ordem ?? 0))
  const pend = lista.filter((e) => e.status === 'pendente').length
  return `${script}<h2>Especialistas${pend ? ` (${pend} aguardando aprovação)` : ''}</h2><p class="sub">Elas se cadastram pelo site em <b>#/especialista</b> e entram como pendentes. Só as aprovadas aparecem para o cliente. Enquanto não houver nenhuma aprovada, o site mostra as personas de exemplo. A nota vem só das avaliações aprovadas.</p>${form()}${ordenada.map((e) => `<div style="margin-top:10px">${form(e)}</div>`).join('')}`
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

export function painelHtml(r, params, perguntas = [], extras = {}) {
  const k = esc(params.get('k') || '')
  const aba = ['funil', 'leads', 'perguntas', 'avaliacoes', 'especialistas'].includes(params.get('aba')) ? params.get('aba') : 'funil'
  const nomes = Object.fromEntries((extras.especialistas || []).map((e) => [e.id, e.nome]))
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
.pergunta{margin:10px 0}.pergunta p{margin:8px 0}textarea{font:inherit;padding:8px;border:1px solid #d2d2d7;border-radius:8px}
.abas{display:flex;gap:6px;margin:10px 0 18px;flex-wrap:wrap}.abas a{padding:7px 12px;border-radius:999px;background:#fff;color:#1d1d1f;text-decoration:none;font-weight:500}.abas a.on{background:#1d1d1f;color:#fff}
.estrelas{color:#e3a008;letter-spacing:1px}.tag{display:inline-block;padding:1px 8px;border-radius:999px;background:#f0f0f3;font-size:12px;margin-left:6px}.tag.ok{background:#d1fae5}.tag.no{background:#fee2e2}.tag.v{background:#e0e7ff}
.linha{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.grade{display:grid;gap:8px}input.l{width:100%;box-sizing:border-box}
@media(max-width:640px){.passo{grid-template-columns:1fr 50px 50px}.barra{display:none}}
</style></head><body><main>
<h1>Céu Natal</h1>
<nav class="abas">${[['funil', 'Funil'], ['leads', 'Leads e abandono'], ['perguntas', `Perguntas (${perguntas.filter((q) => q.status === 'aguardando').length})`], ['avaliacoes', `Avaliações (${(extras.avaliacoes || []).filter((a) => a.status === 'pendente').length})`], ['especialistas', `Especialistas (${(extras.especialistas || []).filter((e) => e.status === 'pendente').length})`]]
    .map(([id, nome]) => `<a href="?k=${k}&aba=${id}" class="${aba === id ? 'on' : ''}">${esc(nome)}</a>`)
    .join('')}</nav>
${aba === 'leads' ? blocoLeads(extras.jornadas || [], params, k) : ''}
${aba === 'perguntas' ? blocoPerguntas(perguntas, k, nomes) || '<p class="sub">Nenhuma pergunta ainda.</p>' : ''}
${aba === 'avaliacoes' ? blocoAvaliacoes(extras.avaliacoes || [], k, nomes) : ''}
${aba === 'especialistas' ? blocoEspecialistas(extras.especialistas || [], k) : ''}
${aba === 'funil' ? funilHtml() : ''}
</main></body></html>`

  function funilHtml() {
    return `<div class="sub">${esc(r.periodo.de)} a ${esc(r.periodo.ate)} · pessoas únicas por passo</div>
<form><input type="hidden" name="k" value="${k}">
<input type="date" name="de" value="${esc(params.get('de') || r.periodo.de)}"><input type="date" name="ate" value="${esc(params.get('ate') || r.periodo.ate)}">
<select name="pais"><option value="">Todos os países</option>${['br', 'mx', 'co', 'cl', 'ar', 'cn'].map((p) => `<option ${params.get('pais') === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
<input name="campanha" placeholder="utm_campaign" value="${esc(params.get('campanha') || '')}"><button>Filtrar</button></form>
<div class="kpis"><div class="kpi">Vendas<b>${r.funil.paid || 0}</b></div><div class="kpi">Conversão<b>${pct(r.funil.paid || 0, r.funil.view || 0)}</b></div><div class="kpi">Faturamento<b style="font-size:15px">${receita}</b></div><div class="kpi">Pagamentos em aberto<b>${r.pedidosAbertos}</b></div></div>
<div class="card">${barras}</div>
${tabelaFunil('Por país', r.porPais)}
${tabelaFunil('Por campanha (utm_campaign)', r.porCampanha)}
<h2>Onde o quiz perde gente</h2><table><tr><th>Pergunta</th><th>Pessoas</th></tr>${quiz || '<tr><td colspan="2">Sem dados</td></tr>'}</table>
<h2>Métodos de pagamento</h2><table><tr><th>País/método</th><th>Cobranças</th><th>Pagas</th><th>Taxa</th></tr>${metodos || '<tr><td colspan="4">Sem dados</td></tr>'}</table>
<h2>Volta, upsell e pacotes</h2><table><tr><th>Oferta</th><th>Pessoas</th><th>Cobranças</th><th>Pagas</th></tr>${
    Object.entries(r.ofertas)
      .map(([nome, v]) => `<tr><td>${esc(nome)}</td><td>${v.pessoas ?? ''}</td><td>${v.cobrancas ?? ''}</td><td>${v.pagas ?? ''}</td></tr>`)
      .join('') || '<tr><td colspan="4">Sem dados</td></tr>'
  }</table>
${erros ? `<h2>Falhas ao gerar cobrança</h2><table><tr><th>País/método: erro</th><th>Vezes</th></tr>${erros}</table>` : ''}`
  }
}
