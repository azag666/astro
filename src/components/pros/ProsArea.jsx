import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftIcon, ChatBubbleLeftRightIcon, ClockIcon, StarIcon } from '@heroicons/react/24/solid'
import { useI18n } from '../../i18n'
import { PACKS } from '../../i18n/paises.js'
import { sid, track } from '../../lib/track'
import QuickPay from './QuickPay'
import ProAvatar from './ProAvatar'
import Reviews from '../Reviews'
import ReviewForm from '../ReviewForm'
import { useEspecialistas } from '../../lib/pros'

// Especialistas vêm de useEspecialistas (cadastradas no painel ou personas de exemplo).
// A resposta é escrita pela equipe no /painel, assinada pela especialista escolhida.

export { ProAvatar }

// Nota e nº de avaliações (aprovadas no painel); na maquete, com selo de exemplo
export function ProStats({ pro }) {
  const { t, c } = useI18n()
  const d = pro.stats
  if (!d) return null
  return (
    <span className="flex flex-wrap items-center gap-x-2 text-xs font-normal text-white/60">
      <span className="flex items-center gap-1"><StarIcon className="h-3.5 w-3.5 text-gold-400" /> {d.nota.toLocaleString(c.locale)}</span>
      <span>· {d.avaliacoes === 1 ? t('pros.review1') : t('pros.reviews', { n: d.avaliacoes.toLocaleString(c.locale) })}</span>
      {d.anos && <span>· {t('pros.years', { n: d.anos })}</span>}
      {d.exemplo && <span className="rounded-full bg-rose-500/80 px-1.5 text-[10px] font-bold uppercase text-white">exemplo</span>}
    </span>
  )
}

export function packLabel(t, n) {
  const [one, many] = t('pros.pack', { n }).split('|')
  return n === 1 ? one : many || one
}

// Área de profissionais: lista → pacote → pagamento → escrever perguntas; mostra as respostas.
// profiles: perfis da conta (parceiro, filhos...) para escolher sobre quem é a pergunta.
export default function ProsArea({ data, profiles = [], initialPro = null }) {
  const { t, money, c } = useI18n()
  const [view, setView] = useState(() => {
    const escolhida = initialPro || sessionStorage.getItem('ceu-natal-pro')
    sessionStorage.removeItem('ceu-natal-pro')
    return escolhida ? { name: 'packs', pro: escolhida } : { name: 'list' }
  })
  const [mine, setMine] = useState({ perguntas: [], creditos: [] })
  const pros = useEspecialistas()

  const load = useCallback(() => {
    fetch(`/api/perguntas?sid=${sid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMine(d))
      .catch(() => {})
  }, [])
  useEffect(load, [load])

  const credit = mine.creditos.find((x) => x.restantes > 0)
  const openPro = (id) => {
    track('pro_open', { pro: id })
    setView(credit ? { name: 'ask', pro: id, orderId: credit.orderId, left: credit.restantes } : { name: 'packs', pro: id })
    window.scrollTo({ top: 0 })
  }

  const pro = pros.find((x) => x.id === view.pro)
  const p = pro

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <AnimatePresence mode="wait">
        {view.name === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Da lista volta para a oferta/mapa: sem isso a pessoa ficava presa nas especialistas */}
            <BackButton
              onClick={() => {
                window.location.hash = '#/offer'
                window.scrollTo({ top: 0 })
              }}
              label={t('pros.backToMap')}
            />
            <h2 className="font-serif text-3xl font-semibold">{t('pros.title')}</h2>
            <p className="mt-2 text-white/60">{t('pros.sub')}</p>
            <div className="mt-6 space-y-3">
              {pros.map((x) => {
                const i = x
                return (
                  <button key={x.id} type="button" onClick={() => openPro(x.id)} className="glass flex w-full gap-4 rounded-3xl p-4 text-left transition hover:bg-white/[0.07]">
                    <ProAvatar pro={x} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 font-semibold">{i.name}</span>
                      <span className="block text-sm text-gold-300/90">{i.role}</span>
                      <ProStats pro={x} />
                      <span className="mt-1 block text-sm text-white/55">{i.bio}</span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {(i.tags || []).map((tag) => (
                          <span key={tag} className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-white/60">{tag}</span>
                        ))}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            <MyQuestions mine={mine} pros={pros} />
          </motion.div>
        )}

        {view.name === 'packs' && pro && (
          <motion.div key="packs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BackButton onClick={() => setView({ name: 'list' })} label={t('pros.back')} />
            <ProHeader pro={pro} p={p} />
            <h3 className="mt-8 font-semibold">{t('pros.packsTitle')}</h3>
            <div className="mt-3 space-y-3">
              {PACKS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    track('pack_select', { pro: pro.id, pack: n })
                    setView({ name: 'pay', pro: pro.id, pack: n })
                  }}
                  className={`relative flex w-full items-center justify-between rounded-2xl border p-4 text-left transition hover:border-gold-400/60 ${n === 3 ? 'border-gold-400/60 bg-gold-400/[0.06]' : 'border-white/10'}`}
                >
                  {n === 3 && <span className="absolute -top-2.5 left-4 rounded-full bg-gold-400 px-2 py-0.5 text-[11px] font-semibold text-night-950">{t('pros.popular')}</span>}
                  {n === 5 && <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-semibold text-night-950">{t('pros.best')}</span>}
                  <span>
                    <span className="block font-semibold">{packLabel(t, n)}</span>
                    <span className="text-xs text-white/50">{t('pros.perQuestion', { value: money(c.ask[n] / n) })}</span>
                  </span>
                  <span className="font-serif text-2xl font-semibold text-gold-300">{money(c.ask[n])}</span>
                </button>
              ))}
            </div>
            <Reviews pro={pro.id} title={t('pros.reviewsTitle', { name: p.name })} />
            {pro.real && <ReviewForm pro={pro} />}
          </motion.div>
        )}

        {view.name === 'pay' && pro && (
          <motion.div key="pay" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BackButton onClick={() => setView({ name: 'packs', pro: pro.id })} label={t('pros.back')} />
            <ProHeader pro={pro} p={p} />
            <p className="mt-6 mb-4 text-white/70">
              {packLabel(t, view.pack)} · <strong className="text-gold-300">{money(c.ask[view.pack])}</strong>
            </p>
            <QuickPay
              data={data}
              pack={view.pack}
              cta={t('pros.pay')}
              onPaid={(o) => {
                setView({ name: 'ask', pro: pro.id, orderId: o.id, left: view.pack })
                load()
              }}
            />
          </motion.div>
        )}

        {view.name === 'ask' && pro && (
          <motion.div key="ask" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BackButton onClick={() => setView({ name: 'list' })} label={t('pros.back')} />
            <AskForm
              pro={pro}
              p={p}
              orderId={view.orderId}
              left={view.left}
              profiles={profiles}
              onSent={() => {
                load()
                setView({ name: 'list' })
              }}
            />
            <Reviews pro={pro.id} title={t('pros.reviewsTitle', { name: p.name })} />
            {pro.real && <ReviewForm pro={pro} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function BackButton({ onClick, label }) {
  return (
    <button type="button" onClick={onClick} className="mb-5 flex items-center gap-2 text-sm text-white/55 hover:text-white">
      <ArrowLeftIcon className="h-4 w-4" /> {label}
    </button>
  )
}

function ProHeader({ pro, p }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-4">
      <ProAvatar pro={pro} size="h-16 w-16 text-3xl" />
      <div>
        <p className="font-serif text-2xl font-semibold">{p.name}</p>
        <p className="text-sm text-gold-300/90">{p.role}</p>
        <ProStats pro={pro} />
        <p className="mt-0.5 flex items-center gap-3 text-xs text-white/55">
          <span className="flex items-center gap-1"><ClockIcon className="h-3.5 w-3.5" /> {t('pros.answerIn')}</span>
        </p>
      </div>
    </div>
  )
}

export function AskForm({ pro, p, orderId, left, profiles = [], onSent }) {
  const { t } = useI18n()
  const [texts, setTexts] = useState(() => Array.from({ length: left }, () => ''))
  const [about, setAbout] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const filled = texts.map((x) => x.trim()).filter(Boolean)

  const send = async () => {
    setBusy(true)
    const profile = profiles.find((x) => x.id === about) || null
    const r = await fetch('/api/perguntas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid, orderId, proId: pro.id, questions: filled, profile }),
    }).catch(() => null)
    setBusy(false)
    if (r?.ok) {
      const d = await r.json()
      setDone(d.restantes)
      track('questions_sent', { pro: pro.id, n: filled.length })
    }
  }

  if (done != null) {
    return (
      <div className="text-center">
        <ChatBubbleLeftRightIcon className="mx-auto h-14 w-14 text-gold-400" />
        <p className="mt-4 text-lg">{t('pros.sent')}</p>
        {done > 0 && <p className="mt-2 text-sm text-white/55">{t('pros.left', { n: done })}</p>}
        <button type="button" onClick={onSent} className="btn-gold mt-8 w-full">{t('pros.myQuestions')}</button>
      </div>
    )
  }

  return (
    <div>
      <ProHeader pro={pro} p={p} />
      <h3 className="mt-8 font-serif text-2xl font-semibold">{t('pros.askTitle')}</h3>
      <p className="mt-1 text-sm text-white/55">{t('pros.askSub', { name: p.name })}</p>
      {profiles.length > 0 && (
        <label className="mt-5 block">
          <span className="mb-1.5 block pl-1 text-xs font-medium text-white/60">{t('pros.aboutWho')}</span>
          <select value={about} onChange={(e) => setAbout(e.target.value)} className="field appearance-none [color-scheme:dark]">
            <option value="">{t('pros.aboutMe')}</option>
            {profiles.map((x) => (
              <option key={x.id} value={x.id}>{x.name}</option>
            ))}
          </select>
        </label>
      )}
      <div className="mt-4 space-y-3">
        {texts.map((v, i) => (
          <textarea
            key={i}
            rows={3}
            value={v}
            maxLength={1200}
            placeholder={i === 0 ? t('pros.askPlaceholder') : `${i + 1}.`}
            onChange={(e) => setTexts((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
            className="field resize-none"
          />
        ))}
      </div>
      <button type="button" disabled={!filled.length || busy} onClick={send} className="btn-gold mt-6 w-full py-5 text-lg disabled:opacity-50">
        {t('pros.send', { name: p.name })}
      </button>
    </div>
  )
}

function MyQuestions({ mine, pros }) {
  const { t } = useI18n()
  if (!mine.perguntas.length) return null
  return (
    <div className="mt-10">
      <h3 className="font-semibold">{t('pros.myQuestions')}</h3>
      <div className="mt-3 space-y-3">
        {mine.perguntas
          .slice()
          .reverse()
          .map((q) => (
            <div key={q.id} className="glass rounded-2xl p-4">
              <p className="text-xs text-white/45">
                {pros.find((x) => x.id === q.proId)?.name} · {q.status === 'respondida' ? t('pros.answered') : t('pros.waiting')}
                {q.profileName ? ` · ${q.profileName}` : ''}
              </p>
              <p className="mt-1 font-medium">{q.question}</p>
              {q.answer && <p className="mt-3 whitespace-pre-line border-l-2 border-gold-400/60 pl-3 text-sm text-white/80">{q.answer}</p>}
            </div>
          ))}
      </div>
    </div>
  )
}
