// Tradução automática e gratuita do que é cadastrado (bio das especialistas e avaliações) para o idioma da página.
// Especialidades saem do glossário do site; textos livres vão ao tradutor gratuito do Google, um por vez.
// Cada tradução fica em traducoes.jsonl e não é pedida de novo.
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import ofertas from '../src/i18n/ofertas.js'

const GOOGLE = { pt: 'pt', es: 'es', zh: 'zh-CN' }
export const IDIOMAS = Object.keys(GOOGLE)

// Palavra solta engana o tradutor ("Taróloga" vira "Depósito"); estas vêm prontas
const EXTRAS = {
  tarô: { pt: 'Tarô', es: 'Tarot', zh: '塔罗' },
  astrologia: { pt: 'Astrologia', es: 'Astrología', zh: '占星' },
  numerologia: { pt: 'Numerologia', es: 'Numerología', zh: '数字命理' },
  sinastria: { pt: 'Sinastria', es: 'Sinastría', zh: '合盘' },
  amor: { pt: 'Amor', es: 'Amor', zh: '爱情' },
}
const GLOSSARIO = { ...EXTRAS }
for (const [id, pt] of Object.entries(ofertas.pt.proSignup.roles)) {
  GLOSSARIO[pt.toLowerCase()] = Object.fromEntries(IDIOMAS.map((l) => [l, ofertas[l].proSignup.roles[id]]))
}

async function google(texto, lang) {
  const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${GOOGLE[lang]}&dt=t`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ q: texto }),
    signal: AbortSignal.timeout(15000),
  })
  if (r.status === 429) throw Object.assign(new Error('limite do Google'), { limite: true })
  if (!r.ok) throw new Error(`Google ${r.status}`)
  const d = await r.json()
  return (d?.[0] || []).map((x) => x?.[0] || '').join('').trim() || null
}

export function criarTradutor(DATA) {
  const arq = join(DATA, 'traducoes.jsonl')
  const feitas = new Map()
  if (existsSync(arq)) {
    for (const linha of readFileSync(arq, 'utf8').split('\n')) {
      if (!linha) continue
      try {
        const x = JSON.parse(linha)
        feitas.set(x.id, x.t)
      } catch {}
    }
  }
  const chave = (texto, lang) => createHash('sha1').update(`${lang}\n${texto}`).digest('hex')
  const pronta = (texto, lang) => GLOSSARIO[texto.trim().toLowerCase()]?.[lang] || feitas.get(chave(texto, lang))

  // Fila: um pedido por vez, com folga entre eles; se o Google limitar, para 30 min
  const fila = []
  const naFila = new Map()
  let rodando = false
  let pausaAte = 0
  async function rodar() {
    if (rodando) return
    rodando = true
    while (fila.length && Date.now() >= pausaAte) {
      const { texto, lang, id } = fila.shift()
      try {
        const t = await google(texto, lang)
        if (t) {
          feitas.set(id, t)
          appendFileSync(arq, JSON.stringify({ id, lang, t }) + '\n')
        }
      } catch (e) {
        console.error('tradução:', e.message)
        if (e.limite) pausaAte = Date.now() + 30 * 60 * 1000
      }
      naFila.get(id)?.forEach((r) => r())
      naFila.delete(id)
      await new Promise((r) => setTimeout(r, 1500))
    }
    rodando = false
    if (fila.length) setTimeout(rodar, Math.max(pausaAte - Date.now(), 1000))
  }
  function pedir(texto, lang) {
    if (!texto || !GOOGLE[lang] || pronta(texto, lang)) return Promise.resolve()
    const id = chave(texto, lang)
    return new Promise((r) => {
      if (!naFila.has(id)) {
        naFila.set(id, [])
        fila.push({ texto, lang, id })
      }
      naFila.get(id).push(r)
      rodar()
    })
  }

  return {
    // Já traduzido? Senão devolve o original (e a tradução fica na fila para a próxima vez)
    traduzir(texto, lang) {
      if (!texto || !GOOGLE[lang]) return texto
      const t = pronta(texto, lang)
      if (t) return t
      pedir(texto, lang)
      return texto
    },
    // Espera as traduções que faltam, até `ms`, antes de montar a resposta
    async preparar(textos, lang, ms = 3000) {
      const faltam = textos.map((x) => pedir(x, lang))
      if (Date.now() < pausaAte) return
      await Promise.race([Promise.all(faltam), new Promise((r) => setTimeout(r, ms))])
    },
    // Pede em segundo plano para os idiomas (ao salvar, aprovar ou ligar o servidor)
    adiantar(textos, idiomas = IDIOMAS) {
      for (const lang of idiomas) for (const x of textos) pedir(x, lang)
    },
  }
}
