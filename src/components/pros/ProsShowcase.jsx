import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useI18n } from '../../i18n'
import { useEspecialistas } from '../../lib/pros'
import { track } from '../../lib/track'
import { ProStats } from './ProsArea'
import ProAvatar from './ProAvatar'

// Vitrine das especialistas na página de oferta: tocar abre a área de perguntas já com ela escolhida
export default function ProsShowcase() {
  const { t } = useI18n()
  const pros = useEspecialistas()
  if (!pros.length) return null

  const abrir = (id) => {
    track('pro_open', { pro: id, from: 'oferta' })
    sessionStorage.setItem('ceu-natal-pro', id)
    window.location.hash = '#/pros'
    window.scrollTo({ top: 0 })
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">{t('showcase.eyebrow')}</p>
        <h2 className="mt-3 font-serif text-4xl font-semibold">{t('showcase.title')}</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/60">{t('showcase.sub')}</p>
      </div>
      <div className="mt-10 flex snap-x gap-4 overflow-x-auto px-5 pb-3 sm:justify-center">
        {pros.map((p) => (
          <button key={p.id} type="button" onClick={() => abrir(p.id)} className="glass flex w-64 shrink-0 snap-start flex-col items-center rounded-3xl p-6 text-center transition hover:bg-white/[0.07]">
            <ProAvatar pro={p} size="h-20 w-20 text-3xl" />
            <span className="mt-4 font-serif text-xl font-semibold">{p.name}</span>
            <span className="text-sm text-gold-300/90">{p.role}</span>
            <span className="mt-1 flex justify-center"><ProStats pro={p} /></span>
            <span className="mt-3 line-clamp-3 text-sm text-white/55">{p.bio}</span>
            {p.tags?.length > 0 && (
              <span className="mt-3 flex flex-wrap justify-center gap-1.5">
                {p.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-white/60">{tag}</span>
                ))}
              </span>
            )}
            <span className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-gold-300">
              <ChatBubbleLeftRightIcon className="h-4 w-4" /> {t('pros.choose', { name: p.name.split(' ')[0] })}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-white/45">
        <a href="#/especialista" className="underline decoration-white/20 underline-offset-4 hover:text-white">{t('showcase.join')}</a>
      </p>
    </section>
  )
}
