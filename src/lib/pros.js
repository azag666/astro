import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { detalhesDoPro } from '../data/avaliacoes'

// Especialistas: as cadastradas no painel (/api/especialistas); sem nenhuma cadastrada, as personas de exemplo.
const PERSONAS = [
  { id: 'helena', glyph: '☉', from: '#f5c76b', to: '#b8742a' },
  { id: 'luna', glyph: '♀', from: '#f59ab8', to: '#a33a6b' },
  { id: 'marina', glyph: '✦', from: '#a78bfa', to: '#5b3fc4' },
  { id: 'clara', glyph: '♃', from: '#6ee7b7', to: '#1f7a5a' },
  { id: 'sofia', glyph: '9', from: '#7dd3fc', to: '#1d5f9c' },
]
const CORES = PERSONAS.map(({ from, to }) => ({ from, to }))

let cache = null
let pedido = null
function buscar() {
  if (!pedido) {
    pedido = fetch('/api/especialistas')
      .then((r) => (r.ok ? r.json() : { especialistas: [] }))
      .then((d) => (cache = d.especialistas || []))
      .catch(() => (cache = []))
  }
  return pedido
}

export function recarregarEspecialistas() {
  pedido = null
  return buscar()
}

export function useEspecialistas() {
  const { t, lang } = useI18n()
  const [lista, setLista] = useState(cache)
  useEffect(() => {
    let vivo = true
    buscar().then((l) => vivo && setLista(l))
    return () => {
      vivo = false
    }
  }, [])

  if (lista && lista.length) {
    return lista.map((e, i) => {
      // Versão do idioma cadastrada no painel; o que faltar fica em português
      const tr = (lang !== 'pt' && e.traducoes?.[lang]) || {}
      return {
        id: e.id,
        name: e.nome,
        role: tr.especialidade || e.especialidade,
        bio: tr.bio || e.bio,
        tags: tr.especialidades?.length ? tr.especialidades : e.especialidades || [],
        // Para achar a especialista da dor pelas palavras em português
        busca: [e.especialidade, ...(e.especialidades || [])].join(' '),
        foto: e.foto || null,
        glyph: e.nome.trim()[0]?.toUpperCase() || '✦',
        ...CORES[i % CORES.length],
        stats: e.avaliacoes ? { nota: e.nota, avaliacoes: e.avaliacoes, exemplo: false } : null,
        real: true,
      }
    })
  }
  const info = t('pros.list')
  return PERSONAS.map((p) => ({ ...p, ...info[p.id], stats: detalhesDoPro(p.id), real: false }))
}

// Especialista que combina com a dor do quiz (amor, dinheiro, carreira, espiritual); sem par, a primeira
const PALAVRAS = {
  // Amor e compatibilidade pedem astróloga (sinastria) antes da taróloga
  amor: ['sinastr', 'astról', 'astrol', 'astó', 'amor', 'relac', 'taró', 'tarot', 'tarô'],
  dinheiro: ['dinheiro', 'dinero', 'carreira', 'trabajo', 'numer'],
  carreira: ['carreira', 'trabajo', 'dinheiro', 'dinero', 'numer'],
  espiritual: ['astró', 'astro', 'espirit', 'holíst', 'holist'],
}
export function especialistaDaDor(pros, focus) {
  const chaves = PALAVRAS[focus] || []
  const texto = (p) => [p.busca, p.role, ...(p.tags || [])].join(' ').toLowerCase()
  // A ordem das palavras é a prioridade: a 1ª palavra que bate com alguém escolhe a especialista
  for (const k of chaves) {
    const achou = pros.find((p) => texto(p).includes(k))
    if (achou) return achou
  }
  return pros[0] || null
}
