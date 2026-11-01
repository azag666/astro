import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import {
  AcademicCapIcon,
  ArrowPathRoundedSquareIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  BookOpenIcon,
  CpuChipIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GiftIcon,
  GlobeAltIcon,
  HashtagIcon,
  LightBulbIcon,
  LockClosedIcon,
  PencilSquareIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import Logo from './Logo'
import CountrySwitcher from './CountrySwitcher'
import Countdown from './Countdown'
import FreeReport from './FreeReport'
import ProfileCard, { ProfileSwitcher } from './ProfileHeader'
import AddProfileSheet from './AddProfileSheet'
import { addProfile } from '../lib/account'
import { ZodiacWheel } from './Sky'
import { computeChart } from '../lib/astro'
import { useI18n } from '../i18n'
import ProsShowcase from './pros/ProsShowcase'
import Reviews from './Reviews'

const reveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
}

const CHAPTER_ICONS = [LightBulbIcon, ScaleIcon, ArrowPathRoundedSquareIcon, AcademicCapIcon]


export default function SalesPage({ data, account, onBuy, onCountry, onLogout }) {
  const { t, money, c } = useI18n()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 500))

  const [profiles, setProfiles] = useState(() => account?.profiles || [])
  const [activeId, setActiveId] = useState('main')
  const [sheetOpen, setSheetOpen] = useState(false)
  const mainProfile = { id: 'main', name: data.name, birthDate: data.birthDate, birthTime: data.birthTime, unknownTime: data.unknownTime, place: data.place }
  const active = profiles.find((p) => p.id === activeId) || mainProfile
  const isMain = active.id === 'main'
  // O perfil ativo herda foco e contato do comprador; mão só existe no perfil principal
  const view = isMain ? data : { ...data, ...active, palm: null, focus: active.relation === 'partner' ? 'amor' : data.focus }

  const chart = useMemo(
    () => (view.birthDate ? computeChart({ birthDate: view.birthDate, birthTime: view.birthTime, unknownTime: view.unknownTime, place: view.place }) : null),
    [view.birthDate, view.birthTime, view.unknownTime, view.place],
  )
  const buy = () => onBuy(isMain ? null : active)

  return (
    <div className="relative">
      <header className={`sticky top-0 z-40 transition-all duration-500 ${scrolled || account ? 'border-b border-white/10 bg-night-950/75 backdrop-blur-xl' : ''}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {scrolled && (
                <motion.button
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onClick={buy}
                  className="hidden rounded-full bg-gold-400 px-5 py-2 text-sm font-semibold text-night-950 transition hover:bg-gold-300 sm:block"
                >
                  {t('sales.buyShort', { price: money(c.price) })}
                </motion.button>
              )}
            </AnimatePresence>
            {account ? <AccountChip name={data.name} onLogout={onLogout} /> : <CountrySwitcher onChange={onCountry} />}
          </div>
        </div>
        {account && chart && <MemberTabs />}
      </header>

      {account && chart && (
        <section className="mx-auto max-w-3xl px-4 pt-4 sm:px-5">
          <ProfileSwitcher profiles={[mainProfile, ...profiles]} activeId={active.id} onSelect={setActiveId} onAdd={() => setSheetOpen(true)} />
          <div className="glass mt-3 rounded-3xl p-5">
            <ProfileCard profile={active} chart={chart} isMain={isMain} />
          </div>
        </section>
      )}
      {chart ? (
        <FreeReport
          key={active.id}
          data={view}
          chart={chart}
          isMain={isMain}
          orders={(account?.orders || []).filter((o) => (o.profileId || 'main') === active.id)}
          onBuy={buy}
        />
      ) : (
        <GenericHero onBuy={buy} />
      )}
      <AddProfileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={(p) => {
          const saved = addProfile(p)
          if (!saved) return
          setProfiles((list) => [...list, saved])
          setActiveId(saved.id)
          setSheetOpen(false)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
      <TrustBar />
      <Engine />
      <WhatYouGet />
      <div id="pacote" className="scroll-mt-28">
        <Stack focus={data.focus || 'espiritual'} onBuy={buy} />
      </div>
      <Bonuses />
      <HowItWorks quizDone={!!chart} />
      <ProsShowcase />
      <div className="mx-auto max-w-6xl px-5 pb-10">
        <Reviews pro="" title={t('sales.testimonials.title')} />
      </div>
      <Offer onBuy={buy} />
      <Faq />
      <Footer />

      <AnimatePresence>
        {scrolled && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 24 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-night-950/90 p-3 backdrop-blur-xl sm:hidden"
          >
            <button onClick={buy} className="btn-gold w-full py-3.5">
              {t('sales.buyMobile', { price: money(c.price) })}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AccountChip({ name, onLogout }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const first = (name || '').trim().split(/\s+/)[0]
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 py-1 pl-1 pr-3 text-xs font-medium text-gold-200">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-400 text-sm font-bold text-night-950">{first[0]?.toUpperCase()}</span>
        {t('area.myArea')}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-white/10 bg-night-900/95 p-2 backdrop-blur-xl"
          >
            <p className="px-3 py-2 text-sm font-semibold">{t('area.hello', { name: first })}</p>
            <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5">
              <ArrowRightOnRectangleIcon className="h-4 w-4" /> {t('area.logout')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MemberTabs() {
  const { t } = useI18n()
  const tabs = t('area.tabs')
  const ids = { report: 'diagnostico', golden: 'datas', numbers: 'numeros', path: 'caminho', offer: 'pacote' }
  return (
    <nav className="no-scrollbar mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 pb-3">
      {Object.entries(tabs).map(([k, label]) => (
        <a
          key={k}
          href={`#${ids[k]}`}
          onClick={(e) => {
            e.preventDefault()
            document.getElementById(ids[k])?.scrollIntoView({ behavior: 'smooth' })
          }}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium ring-1 transition ${k === 'offer' ? 'bg-gold-400 text-night-950 ring-gold-400' : 'bg-white/5 text-white/75 ring-white/10 hover:bg-white/10'}`}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}

function GenericHero({ onBuy }) {
  const { t, money, c } = useI18n()
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-10 lg:grid-cols-2">
      <motion.div {...reveal}>
        <h1 className="font-serif text-5xl font-semibold leading-[1.05] sm:text-6xl">
          {t('sales.genericTitle')} <span className="text-gradient-gold italic">{t('sales.genericAccent')}</span>
        </h1>
        <p className="mt-6 text-lg text-white/65">{t('sales.genericSub')}</p>
        <button onClick={onBuy} className="btn-gold mt-8 text-lg">
          {t('sales.buyMobile', { price: money(c.price) })}
          <ArrowRightIcon className="h-5 w-5" />
        </button>
      </motion.div>
      <motion.div {...reveal} className="mx-auto aspect-square w-full max-w-md">
        <ZodiacWheel className="h-full w-full" />
      </motion.div>
    </section>
  )
}

function TrustBar() {
  const { t } = useI18n()
  const icons = [ClockIcon, UserGroupIcon, ShieldCheckIcon, LockClosedIcon]
  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4">
        {t('sales.trust').map((text, i) => {
          const Icon = icons[i]
          return (
            <motion.div
              key={text}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center justify-center gap-3 text-sm text-white/70"
            >
              <Icon className="h-5 w-5 shrink-0 text-gold-400" />
              {text}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function SectionTitle({ eyebrow, title, sub }) {
  return (
    <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-300/80">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-white/60">{sub}</p>}
    </motion.div>
  )
}

function Engine() {
  const { t } = useI18n()
  const icons = [GlobeAltIcon, MapPinIcon, CpuChipIcon, UserGroupIcon]
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-5">
      <SectionTitle eyebrow={t('engine.eyebrow')} title={t('engine.title')} sub={t('engine.sub')} />
      <div className="relative mt-10 space-y-3">
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
          className="absolute bottom-6 left-[2.15rem] top-6 w-px origin-top bg-gradient-to-b from-gold-400 via-lilac-400 to-gold-400"
        />
        {t('engine.steps').map((s, i) => {
          const Icon = icons[i]
          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.25 }}
              className="glass relative flex gap-4 rounded-2xl p-4"
            >
              <motion.span
                className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-night-900 text-gold-300 ring-1 ring-gold-400/50"
                initial={{ boxShadow: '0 0 0 0 rgba(226,194,125,0)' }}
                whileInView={{ boxShadow: ['0 0 0 0 rgba(226,194,125,0.6)', '0 0 0 12px rgba(226,194,125,0)'] }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.25, duration: 1 }}
              >
                <Icon className="h-5 w-5" />
              </motion.span>
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-white/60">{s.text}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

// Valores de referência em BRL, convertidos pela âncora de preço de cada país
const STACK_VALUES = [97, 67, 47, 47, 37]

function Stack({ focus, onBuy }) {
  const { t, money, c } = useI18n()
  const factor = c.from / 97.9
  const nice = (v) => {
    const x = v * factor
    if (c.decimals) return Math.round(x)
    const unit = 10 ** Math.max(0, String(Math.round(x)).length - 2)
    return Math.round(x / unit) * unit
  }
  const values = STACK_VALUES.map(nice)
  const total = values.reduce((a, b) => a + b, 0)
  const focusShort = t(`focus.${focus}.short`)
  const items = t('stack.items', { focus: focusShort, guide: t(`stack.guides.${focus}`) })
  const icons = [DocumentTextIcon, CalendarDaysIcon, BookOpenIcon, StarIcon, HashtagIcon]

  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-5">
      <SectionTitle eyebrow={t('stack.eyebrow')} title={t('stack.title')} />
      <div className="mt-10 overflow-hidden rounded-3xl border border-gold-400/40 bg-night-900/80">
        {items.map((it, i) => {
          const Icon = icons[i]
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 border-b border-white/10 p-4"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400/10 text-gold-300">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">
                  {it.title}
                  {i >= 3 && <span className="ml-2 rounded-full bg-lilac-400/15 px-2 py-0.5 align-middle text-[10px] font-bold uppercase text-lilac-300">{t('stack.bonusTag')}</span>}
                </p>
                <p className="mt-0.5 text-sm text-white/55">{it.text}</p>
              </div>
              <s className="shrink-0 text-sm text-white/40">{money(values[i])}</s>
            </motion.div>
          )
        })}
        <div className="p-5 text-center">
          <p className="text-sm text-white/50">
            {t('stack.total')}: <s>{money(total)}</s>
          </p>
          <p className="mt-1 text-sm text-white/70">{t('stack.today')}</p>
          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.3 }}
            className="font-serif text-6xl font-semibold text-gradient-gold"
          >
            {money(c.price)}
          </motion.p>
          <button onClick={onBuy} className="btn-gold mt-5 w-full text-lg">
            {t('sales.unlock')} <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

function WhatYouGet() {
  const { t } = useI18n()
  const badgeIcons = [DocumentTextIcon, PencilSquareIcon, EnvelopeIcon]
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <SectionTitle eyebrow={t('sales.get.eyebrow')} title={t('sales.get.title')} sub={t('sales.get.sub')} />
      <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
        <ReportMockup />
        <div className="space-y-4">
          {t('sales.get.chapters').map((title, i) => {
            const Icon = CHAPTER_ICONS[i]
            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="glass flex items-center gap-4 rounded-2xl p-5"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold-400/10 text-gold-300">
                  <Icon className="h-6 w-6" />
                </span>
                <p className="font-medium">{title}</p>
                <CheckIcon className="ml-auto h-5 w-5 text-gold-400" />
              </motion.div>
            )
          })}
          <div className="flex flex-wrap gap-6 pt-4 text-sm text-white/60">
            {t('sales.get.badges').map((b, i) => {
              const Icon = badgeIcons[i]
              return (
                <span key={b} className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-gold-400" /> {b}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function ReportMockup() {
  const { t } = useI18n()
  return (
    <div className="relative mx-auto h-80 w-full max-w-[16rem] sm:h-[26rem] sm:max-w-sm">
      {[2, 1, 0].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 40, rotate: 0 }}
          whileInView={{ opacity: 1, y: 0, rotate: (i - 1) * 7 }}
          viewport={{ once: true }}
          transition={{ delay: (2 - i) * 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          whileHover={i === 0 ? { y: -10, rotate: -2 } : undefined}
          className="absolute inset-0 origin-bottom rounded-2xl border border-gold-400/30 bg-gradient-to-br from-night-800 to-night-900 p-7 shadow-2xl"
          style={{ zIndex: 3 - i }}
        >
          {i === 0 && (
            <div className="flex h-full flex-col">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold-300/70">{t('sales.get.cover')}</p>
              <p className="mt-2 font-serif text-3xl font-semibold">{t('sales.get.coverTitle')}</p>
              <div className="mx-auto my-4 h-28 w-28 sm:my-6 sm:h-40 sm:w-40">
                <ZodiacWheel className="h-full w-full" />
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-white/10" />
                <div className="h-2 w-5/6 rounded bg-white/10" />
                <div className="h-2 w-4/6 rounded bg-white/10" />
              </div>
              <p className="mt-auto text-xs text-white/40">{t('sales.get.coverFoot')}</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

function Bonuses() {
  const { t, money, c, monthName } = useI18n()
  const icons = [CalendarDaysIcon, HashtagIcon]
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <SectionTitle eyebrow={t('sales.bonus.eyebrow', { month: monthName })} title={t('sales.bonus.title')} />
      <motion.div {...reveal} className="mt-10">
        <p className="mb-4 text-center text-sm text-white/55">{t('sales.bonus.endsIn')}</p>
        <Countdown />
      </motion.div>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {t('sales.bonus.items').map((b, i) => {
          const Icon = icons[i]
          return (
            <motion.div
              key={b.title}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.12 }}
              className="relative overflow-hidden rounded-3xl border border-gold-400/25 bg-gradient-to-br from-gold-400/10 to-transparent p-8"
            >
              <GiftIcon className="absolute -right-6 -top-6 h-32 w-32 text-gold-400/10" />
              <Icon className="h-9 w-9 text-gold-300" />
              <h3 className="mt-5 font-serif text-2xl font-semibold">{b.title}</h3>
              <p className="mt-2 text-white/65">{b.text}</p>
              <p className="mt-5 text-sm">
                <s className="text-white/40">{money(c.bonus[i])}</s>
                <span className="ml-2 rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-night-950">{t('sales.bonus.free')}</span>
              </p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function HowItWorks({ quizDone }) {
  const { t } = useI18n()
  const steps = [...t('sales.how.steps')]
  if (!quizDone) steps[0] = t('sales.how.stepOneGeneric')
  const icons = [PencilSquareIcon, SparklesIcon, EnvelopeIcon]
  return (
    <section className="border-y border-white/10 bg-white/[0.02] py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionTitle eyebrow={t('sales.how.eyebrow')} title={t('sales.how.title')} />
        <div className="relative mt-16 grid gap-10 md:grid-cols-3">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute left-[16%] right-[16%] top-8 hidden h-px origin-left bg-gradient-to-r from-gold-400/0 via-gold-400/60 to-gold-400/0 md:block"
          />
          {steps.map((s, i) => {
            const Icon = icons[i]
            return (
              <motion.div key={s.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.15 }} className="relative text-center">
                <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold-400/40 bg-night-900 text-gold-300">
                  <Icon className="h-7 w-7" />
                  <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-gold-400 text-xs font-bold text-night-950">{i + 1}</span>
                </span>
                <h3 className="mt-5 font-serif text-2xl font-semibold">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-white/60">{s.text}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Offer({ onBuy }) {
  const { t, money, c } = useI18n()
  return (
    <section id="oferta" className="mx-auto max-w-6xl px-5 py-24">
      <motion.div
        {...reveal}
        className="relative mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-gold-400/40 bg-gradient-to-b from-night-800 to-night-900 p-8 shadow-[0_0_120px_-30px_rgba(226,194,125,0.5)] sm:p-12"
      >
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 opacity-20">
          <ZodiacWheel className="h-full w-full" />
        </div>
        <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">{t('sales.offer.eyebrow')}</p>
        <h2 className="relative mt-3 font-serif text-4xl font-semibold">{t('sales.offer.title')}</h2>
        <ul className="relative mt-8 space-y-3">
          {t('sales.offer.items').map((it) => (
            <li key={it} className="flex items-start gap-3 text-white/80">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
              {it}
            </li>
          ))}
        </ul>
        <div className="relative mt-10 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-white/45 line-through">{money(c.from)}</p>
            <p className="font-serif text-6xl font-semibold text-gradient-gold">{money(c.price)}</p>
          </div>
          <span className="mb-3 rounded-full bg-lilac-400/15 px-3 py-1 text-xs font-semibold text-lilac-300">
            {t('sales.offer.off', { n: Math.round((1 - c.price / c.from) * 100) })}
          </span>
        </div>
        <p className="relative mt-1 text-sm text-white/50">{t('sales.offer.once')}</p>
        <button onClick={onBuy} className="btn-gold relative mt-8 w-full text-lg">
          {t('sales.offer.cta')}
          <ArrowRightIcon className="h-5 w-5" />
        </button>
        <div className="relative mt-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <ShieldCheckIcon className="h-12 w-12 shrink-0 text-gold-400" />
          <div>
            <p className="font-semibold">{t('sales.offer.guaranteeTitle')}</p>
            <p className="text-sm text-white/55">{t('sales.offer.guaranteeText')}</p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function Faq() {
  const { t } = useI18n()
  const [open, setOpen] = useState(0)
  return (
    <section className="mx-auto max-w-3xl px-5 py-24">
      <SectionTitle eyebrow={t('sales.faq.eyebrow')} title={t('sales.faq.title')} />
      <div className="mt-12 space-y-3">
        {t('faq').map((f, i) => (
          <motion.div key={f.q} {...reveal} transition={{ ...reveal.transition, delay: i * 0.05 }} className="glass rounded-2xl">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-medium" aria-expanded={open === i}>
              {f.q}
              <ChevronDownIcon className={`h-5 w-5 shrink-0 text-gold-300 transition ${open === i ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className="px-6 pb-5 text-white/60">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  const { t } = useI18n()
  return (
    <footer className="border-t border-white/10 px-5 pb-28 pt-12 sm:pb-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Logo />
          <div className="flex gap-6 text-sm text-white/45">
            <a href="#/avaliacoes" className="hover:text-white">{t('reviews.title')}</a>
            <a href="#/especialista" className="hover:text-white">{t('showcase.eyebrow')}</a>
            {t('sales.footer.links').map((l) => (
              <a key={l} href="#" className="hover:text-white">
                {l}
              </a>
            ))}
          </div>
        </div>
        <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-white/35">
          <StarIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t('sales.footer.disclaimer')}
        </p>
      </div>
    </footer>
  )
}
