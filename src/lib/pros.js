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
  const { t } = useI18n()
  const [lista, setLista] = useState(cache)
  useEffect(() => {
    let vivo = true
    buscar().then((l) => vivo && setLista(l))
    return () => {
      vivo = false
    }
  }, [])

  if (lista && lista.length) {
    return lista.map((e, i) => ({
      id: e.id,
      name: e.nome,
      role: e.especialidade,
      bio: e.bio,
      tags: [],
      glyph: e.nome.trim()[0]?.toUpperCase() || '✦',
      ...CORES[i % CORES.length],
      stats: e.avaliacoes ? { nota: e.nota, avaliacoes: e.avaliacoes, exemplo: false } : null,
      real: true,
    }))
  }
  const info = t('pros.list')
  return PERSONAS.map((p) => ({ ...p, ...info[p.id], stats: detalhesDoPro(p.id), real: false }))
}
