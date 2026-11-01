import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  HandRaisedIcon,
  LockClosedIcon,
  MoonIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import ChartWheel from './ChartWheel'
import { highlights, SIGN_GLYPHS, SIGN_KEYS, signOf } from '../lib/astro'
import { expression, goldenDays, lifePath, nextMoonPhases, personalMonth, personalYear, soulUrge } from '../lib/forecast'
import { useI18n } from '../i18n'

const reveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export default function FreeReport({ data, chart, orders = [], onBuy }) {
  const { t, c, money } = useI18n()
  const focus = data.focus || 'espiritual'
  const focusShort = t(`focus.${focus}.short`)
  const name = (data.name || '').trim().split(/\s+/)[0]

  const forecast = useMemo(() => goldenDays(chart, focus), [chart, focus])
  const moons = useMemo(() => nextMoonPhases(), [])
  const lp = lifePath(data.birthDate)
  const year = new Date().getFullYear()
  const py = personalYear(data.birthDate, year)
  const pm = personalMonth(data.birthDate)
  const ex = expression(data.name)
  const su = soulUrge(data.name)
  const list = highlights(chart)

  const fmtDay = (d, opts = { weekday: 'long', day: 'numeric', month: 'long' }) => d.toLocaleDateString(c.locale, opts)
  const signName = (i) => t(`signs.${SIGN_KEYS[i]}.name`)
  const styleOf = (i) => t(`signs.${SIGN_KEYS[i]}.style`)

  // Resolve cada fator do foco para um ponto real do mapa (com fallback sem hora)
  const factors = t(`report.factors.${focus}`).map((f) => {
    const resolve = (point) => {
      if (point === 'house7' || point === 'house2') {
        if (!chart.asc) return null
        const sign = (signOf(chart.asc.lon) + (point === 'house7' ? 6 : 1)) % 12
        return { label: t(`report.pointNames.${point}`), sign }
      }
      if (point === 'mc') return chart.mc ? { label: t('planets.mc.name'), sign: chart.mc.sign } : null
      return { label: t(`planets.${point}.name`), sign: chart.get(point).sign }
    }
    const r = resolve(f.point) || resolve(f.fallback)
    return { ...r, text: f.text.replace('{style}', styleOf(r.sign)) }
  })

  const sun = chart.get('sun')
  const moon = chart.get('moon')
  const firstGolden = forecast.golden[0]
  const elementKey = chart.missing.length ? chart.missing[0] : null
  const step1 = elementKey ? t(`report.path.element.${elementKey}`) : t(`report.path.element.dominant${cap(chart.dominant)}`)
  const focusPlanet = { amor: 'venus', dinheiro: 'jupiter', carreira: 'sun', espiritual: 'moon' }[focus]
  const step2 = t(`report.path.focus.${focus}`, { style: styleOf(chart.get(focusPlanet).sign) })
  const step3 = firstGolden ? t('report.path.timing', { date: fmtDay(firstGolden.date), action: t(`report.path.actions.${focus}`) }) : ''

  const seenPct = 7 + (data.palm ? 1 : 0)

  return (
    <section id="diagnostico" className="mx-auto max-w-3xl scroll-mt-28 px-4 pb-10 pt-4 sm:px-5">
      {orders.length > 0 && (
        <motion.div {...reveal} className="mb-5 rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-5">
          <p className="flex items-center gap-2 font-semibold text-emerald-200">
            <CheckBadgeIcon className="h-5 w-5" /> {t('area.ordersTitle')}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {orders.flatMap((o) => ['main', o.bump && 'bump', o.numBump && 'numBump'].filter(Boolean).map((k) => ({ k, at: o.at }))).map(({ k, at }, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
                <span className="font-medium">{t(`area.items.${k}`)}</span>
                <span className="text-xs text-white/55">
                  {t('area.orderStatus', { date: new Date(new Date(at).getTime() + 2 * 86400000).toLocaleDateString(c.locale, { day: 'numeric', month: 'short' }) })}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
      {/* Cabeçalho do documento */}
      <motion.div {...reveal} className="overflow-hidden rounded-3xl border border-gold-400/30 bg-gradient-to-b from-night-800 to-night-900">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-[11px] uppercase tracking-widest text-gold-300/80">
          <span className="flex items-center gap-1.5"><StarIcon className="h-3.5 w-3.5" />{t('report.eyebrow')}</span>
          <span>{t('report.focusTag', { focus: focusShort })}</span>
        </div>
        <div className="px-5 pb-6 pt-5">
          <h1 className="font-serif text-[2rem] font-semibold leading-tight sm:text-5xl">{t(`sales.headlineByFocus.${focus}`, { name })}</h1>
          <p className="mt-2 text-gradient-gold font-serif text-xl italic">{t('sales.headlineAccent')}</p>
          <p className="mt-3 flex items-center gap-2 text-xs text-white/45">
            <motion.span className="h-2 w-2 rounded-full bg-emerald-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} />
            {t('report.generated')}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              ['☉', t('planets.sun.name'), signName(sun.sign)],
              ['☽', t('planets.moon.name'), signName(moon.sign)],
              ['AC', t('planets.asc.name'), chart.asc ? signName(chart.asc.sign) : '—'],
            ].map(([g, label, val]) => (
              <div key={label} className="rounded-2xl bg-white/[0.05] px-2 py-3 text-center ring-1 ring-white/10">
                <p className="font-serif text-lg text-gold-300">{g}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
                <p className="mt-0.5 truncate font-semibold">{val}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-6 aspect-square w-full max-w-sm">
            <ChartWheel chart={chart} />
          </div>
        </div>
      </motion.div>

      {/* Leitura do foco */}
      <Block id="diagnostico-leitura" icon={SparklesIcon} title={t('report.readingTitle', { focus: focusShort })}>
        <p className="text-sm text-white/60">{t(`focus.${focus}.text`)}</p>
        <div className="mt-4 space-y-3">
          {factors.map((f, i) => (
            <motion.div key={i} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }} className="flex gap-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-400/10 font-serif text-xl text-gold-300">{SIGN_GLYPHS[f.sign]}</span>
              <div>
                <p className="text-xs text-white/50">
                  {f.label} <strong className="text-white">{signName(f.sign)}</strong>
                </p>
                <p className="mt-0.5 text-[15px] leading-snug text-white/85">{f.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Block>

      {/* Datas de ouro */}
      <Block id="datas" icon={CalendarDaysIcon} title={t('report.golden.title')} highlight>
        <p className="text-sm text-white/60">{t('report.golden.sub')}</p>
        <div className="mt-4 space-y-3">
          {forecast.golden.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, type: 'spring' }}
              className="flex gap-4 rounded-2xl border border-gold-400/30 bg-gold-400/[0.07] p-4"
            >
              <div className="w-14 shrink-0 rounded-xl bg-gold-400 py-2 text-center text-night-950">
                <p className="text-2xl font-bold leading-none">{d.date.getDate()}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase">{fmtDay(d.date, { month: 'short' })}</p>
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{cap(fmtDay(d.date, { weekday: 'long' }))}</p>
                <p className="text-sm text-white/75">{t(`report.golden.meaning.${focus}.${d.bestGood.transit}`)}</p>
                <p className="mt-1 text-[11px] text-gold-300/70">
                  {t('report.golden.transit', {
                    transit: t(`planets.${d.bestGood.transit}.name`),
                    type: t(`aspects.${d.bestGood.type}`),
                    natal: t(`planets.${d.bestGood.natal}.name`),
                  })}
                </p>
              </div>
            </motion.div>
          ))}
          {forecast.risk && (
            <div className="relative overflow-hidden rounded-2xl border border-rose-400/30 bg-rose-400/5 p-4">
              <p className="flex items-center gap-2 font-semibold text-rose-200">
                <ExclamationTriangleIcon className="h-5 w-5" /> {t('report.golden.risk')}
              </p>
              <p className="mt-1 text-sm text-white/70">{t('report.golden.riskText', { focus: focusShort })}</p>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <span className="select-none rounded bg-white/10 px-2 py-0.5 font-mono blur-[4px]">{fmtDay(forecast.risk.date, { day: '2-digit', month: '2-digit' })}</span>
                <LockClosedIcon className="h-4 w-4 text-gold-400" /> <span className="text-gold-300">{t('report.golden.riskLocked')}</span>
              </p>
            </div>
          )}
          {moons.newMoon && (
            <p className="flex items-start gap-2 px-1 text-sm text-white/60">
              <MoonIcon className="mt-0.5 h-4 w-4 shrink-0 text-lilac-300" />
              {t('report.golden.moon', { date: fmtDay(moons.newMoon), focus: focusShort })}
            </p>
          )}
        </div>
        <InlineCta onClick={onBuy} label={t('report.golden.cta')} />
      </Block>

      {/* Numerologia */}
      <Block id="numeros" icon={StarIcon} title={t('report.numerology.title')}>
        <div className="grid grid-cols-2 gap-3">
          {[
            [t('report.numerology.lifePath'), lp, t(`report.numerology.numbers.${lp}`)],
            [t('report.numerology.personalYear', { year }), py, t(`report.numerology.years.${py}`)],
            ex && [t('report.numerology.expression'), ex, `${t('report.numerology.expressionHint')}: ${t(`report.numerology.numbers.${ex}`)}`],
            su && [t('report.numerology.soul'), su, `${t('report.numerology.soulHint')}: ${t(`report.numerology.numbers.${su}`)}`],
            [t('report.numerology.personalMonth'), pm, t(`report.numerology.months.${pm}`)],
          ]
            .filter(Boolean)
            .map(([label, n, text], i, arr) => (
              <motion.div
                key={label}
                {...reveal}
                className={`rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10 ${i === arr.length - 1 && arr.length % 2 ? 'col-span-2' : ''}`}
              >
                <p className="text-[11px] uppercase tracking-wider text-white/45">{label}</p>
                <p className="mt-1 font-serif text-5xl font-semibold text-gradient-gold">{n}</p>
                <p className="mt-2 text-sm leading-snug text-white/75">{text}</p>
              </motion.div>
            ))}
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-widest text-gold-300/80">{t('report.numerology.lockedTitle')}</p>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-sm text-white/60">
            {t('report.numerology.locked').map((x) => (
              <li key={x} className="flex items-center gap-1.5">
                <LockClosedIcon className="h-3.5 w-3.5 shrink-0 text-gold-400" /> {x}
              </li>
            ))}
          </ul>
        </div>
      </Block>

      {/* Mão */}
      {data.palm && (
        <Block icon={HandRaisedIcon} title={t('sales.palmTitle')}>
          <p className="font-serif text-xl font-semibold">{t(`palmTypes.${data.palm.element}.title`)}</p>
          <p className="mt-1 text-sm text-white/70">{t(`palmTypes.${data.palm.element}.text`)}</p>
          <p className="mt-2 text-sm text-white/70">{t(data.palm.ringLonger ? 'palmTypes.ringLonger' : 'palmTypes.indexLonger')}</p>
          <p className="mt-3 rounded-xl bg-lilac-400/10 p-3 text-sm text-white/85">
            {data.palm.element === chart.dominant
              ? t('palmTypes.match')
              : t('palmTypes.contrast', { palm: t(`elements.${data.palm.element}.name`), chart: t(`elements.${chart.dominant}.name`) })}
          </p>
        </Block>
      )}

      {/* Pontos raros */}
      <Block icon={SparklesIcon} title={t('highlights.found', { count: list.length })}>
        <div className="space-y-3">
          {list.map((h, i) => {
            const { title, text } = highlightText(t, h)
            const locked = i >= Math.min(2, list.length - 1)
            return (
              <div key={i} className={`relative overflow-hidden rounded-2xl p-4 ring-1 ${locked ? 'bg-white/[0.02] ring-white/10' : 'bg-gold-400/5 ring-gold-400/30'}`}>
                <p className="flex items-center gap-2 font-semibold text-gold-300">
                  {locked ? <LockClosedIcon className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
                  {title}
                </p>
                <p className={`mt-1 text-sm text-white/70 ${locked ? 'select-none blur-[5px]' : ''}`}>{text}</p>
                {locked && (
                  <button onClick={onBuy} className="absolute inset-0 flex items-end justify-end p-3">
                    <span className="rounded-full bg-night-950/90 px-3 py-1 text-xs font-semibold text-gold-300 ring-1 ring-gold-400/40">{t('highlights.locked')}</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </Block>

      {/* Caminho */}
      <Block id="caminho" icon={ArrowRightIcon} title={t('report.path.title')} highlight>
        <p className="text-sm text-white/60">{t('report.path.sub')}</p>
        <ol className="relative mt-5 space-y-5 border-l border-gold-400/30 pl-6">
          {[step1, step2, step3].filter(Boolean).map((s, i) => (
            <motion.li key={i} {...reveal} transition={{ ...reveal.transition, delay: i * 0.12 }} className="relative">
              <span className="absolute -left-[2.15rem] grid h-7 w-7 place-items-center rounded-full bg-gold-400 text-xs font-bold text-night-950">{i + 1}</span>
              <p className="text-[11px] uppercase tracking-widest text-gold-300/80">{t('report.path.step', { n: i + 1 })}</p>
              <p className="mt-1 text-[15px] leading-snug text-white/85">{s}</p>
            </motion.li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-gold-300">{t('report.path.more')}</p>
      </Block>

      {/* Quanto do mapa foi visto */}
      <motion.div {...reveal} className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <p className="font-serif text-2xl font-semibold">{t('report.seen', { pct: seenPct })}</p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
            initial={{ width: 0 }}
            whileInView={{ width: `${seenPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-3 text-sm text-white/60">{t('report.seenSub')}</p>
        <button onClick={onBuy} className="btn-gold mt-5 w-full text-lg">
          {t('sales.unlock')} <ArrowRightIcon className="h-5 w-5" />
        </button>
        <p className="mt-2 text-center text-sm text-white/50">{t('sales.priceLine', { from: money(c.from), price: money(c.price) })}</p>
      </motion.div>
    </section>
  )
}

function Block({ id, icon: Icon, title, children, highlight }) {
  return (
    <motion.div id={id} {...reveal} className={`mt-6 scroll-mt-28 rounded-3xl p-5 ${highlight ? 'border border-gold-400/25 bg-night-900/80' : 'glass'}`}>
      <h2 className="mb-3 flex items-center gap-2 font-serif text-2xl font-semibold leading-tight">
        <Icon className="h-5 w-5 shrink-0 text-gold-300" />
        {title}
      </h2>
      {children}
    </motion.div>
  )
}

function InlineCta({ onClick, label }) {
  return (
    <button onClick={onClick} className="mt-4 flex w-full items-center justify-between rounded-2xl bg-gold-400/10 px-4 py-3.5 text-left text-sm font-semibold text-gold-300 ring-1 ring-gold-400/40 transition active:scale-[0.98]">
      <span className="flex items-center gap-2"><LockClosedIcon className="h-4 w-4" />{label}</span>
      <ArrowRightIcon className="h-4 w-4" />
    </button>
  )
}

export function highlightText(t, h) {
  const signName = (i) => t(`signs.${SIGN_KEYS[i]}.name`)
  const el = (k) => t(`elements.${k}.name`)
  switch (h.type) {
    case 'stellium':
      return { title: t('highlights.stellium.title', { sign: signName(h.sign) }), text: t('highlights.stellium.text', { sign: signName(h.sign) }) }
    case 'tightAspect': {
      const vars = { a: t(`planets.${h.aspect.a}.name`), b: t(`planets.${h.aspect.b}.name`), type: t(`aspects.${h.aspect.type}`) }
      return { title: t('highlights.tightAspect.title', vars), text: t('highlights.tightAspect.text', vars) }
    }
    case 'missing':
      return { title: t('highlights.missing.title', { element: el(h.element) }), text: t('highlights.missing.text', { missing: t(`elements.${h.element}.missing`) }) }
    case 'retro': {
      const planet = t(`planets.${h.planet}.name`)
      return { title: t('highlights.retro.title', { planet }), text: t('highlights.retro.text', { planet }) }
    }
    case 'dominant':
      return { title: t('highlights.dominant.title', { element: el(h.element) }), text: t('highlights.dominant.text', { text: t(`elements.${h.element}.text`) }) }
    default:
      return { title: t('highlights.moonPhase.title', { phase: t(`phases.${h.phase}.name`) }), text: t('highlights.moonPhase.text', { text: t(`phases.${h.phase}.text`) }) }
  }
}
