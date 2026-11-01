import { StarIcon } from '@heroicons/react/24/solid'
import { useI18n } from '../i18n'
import { avaliacoes } from '../data/avaliacoes'

const CORES = ['#f5c76b', '#f59ab8', '#a78bfa', '#6ee7b7', '#7dd3fc']

// Avaliações de clientes (src/data/avaliacoes.js). Sem avaliação real e fora da maquete, não mostra nada.
export default function Reviews({ produto, pro, title, limit = 6 }) {
  const { country, c } = useI18n()
  const { lista, exemplo } = avaliacoes({ pais: country, produto, pro })
  if (!lista.length) return null
  return (
    <section className="mt-10">
      {title && <h3 className="mb-4 font-serif text-2xl font-semibold">{title}</h3>}
      <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
        {lista.slice(0, limit).map((a, i) => (
          <figure key={a.nome + i} className="glass relative w-72 shrink-0 snap-start rounded-3xl p-5">
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
                <span className="text-xs text-white/45">{a.cidade}{a.pais && a.pais !== c.flag?.toLowerCase() ? ` · ${a.pais.toUpperCase()}` : ''}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
