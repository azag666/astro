import { useEffect, useState } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { CheckBadgeIcon } from '@heroicons/react/24/outline'
import { useI18n } from '../i18n'
import { avaliacoes as daMaquete, reais as doArquivo } from '../data/avaliacoes'

const CORES = ['#f5c76b', '#f59ab8', '#a78bfa', '#6ee7b7', '#7dd3fc']

// Avaliações aprovadas no /painel (+ as reais de src/data/avaliacoes.js). Sem nenhuma, só a maquete
// (localhost ou ?mock=1, com selo). pro: id da especialista; '' = só do Céu Natal; undefined = todas.
export default function Reviews({ pro, title, limit = 8, grid = false }) {
  const { t, country } = useI18n()
  const [doServidor, setDoServidor] = useState([])

  useEffect(() => {
    const q = pro === undefined ? '' : `?pro=${encodeURIComponent(pro)}`
    fetch(`/api/avaliacoes${q}`)
      .then((r) => (r.ok ? r.json() : { avaliacoes: [] }))
      .then((d) => setDoServidor(d.avaliacoes || []))
      .catch(() => {})
  }, [pro])

  const reais = [...doServidor, ...doArquivo.filter((a) => pro === undefined || (a.pro || '') === pro)]
  const maquete = reais.length ? null : daMaquete({ pais: country, pro: pro || undefined })
  const lista = reais.length ? reais : maquete?.lista || []
  const exemplo = !reais.length && !!maquete?.exemplo
  if (!lista.length) return null

  const media = lista.reduce((s, a) => s + a.nota, 0) / lista.length

  return (
    <section className="mt-10">
      {title && (
        <div className="mb-4 flex items-end justify-between gap-3">
          <h3 className="font-serif text-2xl font-semibold">{title}</h3>
          <span className="flex items-center gap-1 text-sm text-white/60">
            <StarIcon className="h-4 w-4 text-gold-400" /> {media.toFixed(1)} · {lista.length === 1 ? t('pros.review1') : t('pros.reviews', { n: lista.length })}
          </span>
        </div>
      )}
      <div className={grid ? 'grid gap-3' : '-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2'}>
        {lista.slice(0, limit).map((a, i) => (
          <figure key={(a.id || a.nome) + i} className={`glass relative rounded-3xl p-5 ${grid ? '' : 'w-72 shrink-0 snap-start'}`}>
            {exemplo && <span className="absolute right-3 top-3 rounded-full bg-rose-500/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">exemplo</span>}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, k) => (
                <StarIcon key={k} className={`h-4 w-4 ${k < a.nota ? 'text-gold-400' : 'text-white/15'}`} />
              ))}
            </div>
            <blockquote className="mt-3 text-sm leading-relaxed text-white/80">“{a.texto}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3 text-sm">
              {a.foto ? (
                <img src={a.foto} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold text-night-950" style={{ background: CORES[i % CORES.length] }}>
                  {a.nome[0]}
                </span>
              )}
              <span>
                <span className="block font-medium">{a.nome}</span>
                <span className="flex items-center gap-1 text-xs text-white/45">
                  {a.cidade || ''}
                  {a.verificada && (
                    <>
                      <CheckBadgeIcon className="h-3.5 w-3.5 text-emerald-300" /> {t('reviews.verified')}
                    </>
                  )}
                </span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
