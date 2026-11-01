import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  FireIcon,
  MoonIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CheckIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  FaceFrownIcon,
  HandThumbUpIcon,
  HeartIcon,
  LightBulbIcon,
  LockClosedIcon,
  MapIcon,
  MinusIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { quickSunSign, SIGN_GLYPHS, SIGN_KEYS } from '../lib/astro'
import { isEmail, maskPhone } from '../lib/format'
import { useI18n } from '../i18n'
import CitySearch from './CitySearch'
import PalmScan from './PalmScan'
import { track } from '../lib/track'
import { DateSelect, TimeSelect } from './DateSelect'
import { capitalPlace } from '../lib/astro'

const ICONS = {
  gender: { f: UserIcon, m: UserIcon, n: UsersIcon },
  focus: { amor: HeartIcon, dinheiro: BanknotesIcon, carreira: BriefcaseIcon, espiritual: SparklesIcon },
  amor: { single: ArrowPathIcon, doubt: QuestionMarkCircleIcon, ex: FaceFrownIcon, complicated: ArrowsRightLeftIcon },
  dinheiro: { leaks: ArrowTrendingDownIcon, debt: ExclamationTriangleIcon, stuck: ArrowPathIcon, more: ArrowTrendingUpIcon },
  carreira: { stuck: ArrowPathIcon, business: LightBulbIcon, lost: MapIcon, growing: ArrowTrendingUpIcon },
  espiritual: { empty: MoonIcon, anxiety: BoltIcon, purpose: MapIcon, energy: FireIcon },
  agree: { yes: CheckIcon, partly: MinusIcon, no: XMarkIcon },
  experience: { never: SparklesIcon, sign: SunIcon, done: BookOpenIcon },
}

// Sem 'gender' e 'agree2' (01/nov): telas que derrubavam gente sem mudar o resultado
const ALL_STEPS = ['focus', 'situation', 'insight', 'agree1', 'experience', 'name', 'birthDate', 'whyMore', 'birthTime', 'city', 'palm', 'account']

const slide = {
  initial: (dir) => ({ opacity: 0, x: dir * 40, filter: 'blur(6px)' }),
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (dir) => ({ opacity: 0, x: dir * -40, filter: 'blur(6px)' }),
}

export default function Quiz({ data, setData, onDone, focusLocked }) {
  const STEPS = focusLocked ? ALL_STEPS.filter((s) => s !== 'focus') : ALL_STEPS
  const { t, c, country } = useI18n()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [errors, setErrors] = useState({})
  // Cidade digitada sem tocar na lista: usa a 1ª sugestão ou, sem nenhuma, a capital do país
  const cityGuess = useRef({ query: '', first: null })

  const id = STEPS[step]
  const total = STEPS.length

  useEffect(() => {
    track('quiz_step', { i: step + 1, step: id })
  }, [step, id])
  // Barra anda mais rápido no começo: sensação de progresso
  const progress = (1 - Math.pow(1 - (step + 1) / total, 1.5)) * 100

  const go = (n) => {
    setDir(n > step ? 1 : -1)
    setStep(n)
  }
  const next = () => (step + 1 >= total ? onDone() : go(step + 1))
  const set = (patch) => setData((d) => ({ ...d, ...patch }))
  const choose = (key, value) => {
    set({ [key]: value })
    setTimeout(next, 260)
  }

  const branch = ICONS.focus[data.focus] ? data.focus : 'espiritual'
  const signIdx = quickSunSign(data.birthDate)
  const signKey = signIdx == null ? null : SIGN_KEYS[signIdx]

  let content
  switch (id) {
    case 'gender':
      content = <Choice title={t('quiz.gender.title')} hint={t('quiz.gender.hint')} options={t('quiz.gender.options')} icons={ICONS.gender} value={data.gender} onPick={(v) => choose('gender', v)} />
      break
    case 'focus': {
      const opts = Object.fromEntries(Object.keys(ICONS.focus).map((k) => [k, t(`focus.${k}.label`)]))
      content = <Choice title={t('quiz.focus.title')} hint={t('quiz.focus.hint')} options={opts} icons={ICONS.focus} value={data.focus} onPick={(v) => choose('focus', v)} />
      break
    }
    case 'situation':
      content = <Choice title={t(`quiz.branch.${branch}.title`)} options={t(`quiz.branch.${branch}.options`)} icons={ICONS[branch]} value={data.situation} onPick={(v) => choose('situation', v)} />
      break
    case 'insight':
      content = (
        <Interstitial icon={ChartBarIcon} eyebrow={t('quiz.insight.eyebrow')} text={t(`quiz.insight.${branch}`)} cta={t('common.continue')} onNext={next} />
      )
      break
    case 'agree1':
    case 'agree2':
      content = (
        <Choice
          title={t('quiz.agree.title')}
          quote={t(id === 'agree1' ? `quiz.agree.s1.${branch}` : 'quiz.agree.s2')}
          options={t('quiz.agree.options')}
          icons={ICONS.agree}
          value={data[id]}
          onPick={(v) => choose(id, v)}
          row
        />
      )
      break
    case 'experience':
      content = <Choice title={t('quiz.experience.title')} hint={t('quiz.experience.hint')} options={t('quiz.experience.options')} icons={ICONS.experience} value={data.experience} onPick={(v) => choose('experience', v)} />
      break
    case 'name':
      content = (
        <Form onSubmit={() => data.name.trim().length > 1 && next()}>
          <Title title={t('quiz.name.title')} hint={t('quiz.name.hint')} />
          <Field icon={UserIcon}>
            <input autoFocus className="field pl-12" placeholder={t('quiz.name.placeholder')} value={data.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Next disabled={data.name.trim().length < 2} />
        </Form>
      )
      break
    case 'birthDate':
      content = (
        <Form onSubmit={() => data.birthDate && next()}>
          <Title title={t('quiz.birthDate.title', { name: firstName(data.name) })} hint={t('quiz.birthDate.hint')} />
          <DateSelect value={data.birthDate} onChange={(birthDate) => set({ birthDate })} />
          <AnimatePresence>
            {signKey && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <motion.div
                  key={signKey}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-4 flex items-center gap-4 rounded-2xl border border-gold-400/30 bg-gold-400/5 p-4"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gold-400/10 font-serif text-3xl text-gold-300">{SIGN_GLYPHS[signIdx]}</span>
                  <span className="text-sm">
                    <strong className="block text-base text-gold-300">{t('quiz.birthDate.reveal', { sign: t(`signs.${signKey}.name`) })}</strong>
                    <span className="text-white/70">{t('quiz.birthDate.revealText', { trait: t(`signs.${signKey}.trait`) })}</span>
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <Next disabled={!data.birthDate} />
        </Form>
      )
      break
    case 'whyMore':
      content = (
        <Interstitial icon={ExclamationTriangleIcon} eyebrow={t('quiz.whyMore.eyebrow')} title={t('quiz.whyMore.title')} text={t('quiz.whyMore.text')} cta={t('quiz.whyMore.cta')} onNext={next} />
      )
      break
    case 'birthTime':
      content = (
        <Form onSubmit={() => (data.birthTime || data.unknownTime) && next()}>
          <Title title={t('quiz.birthTime.title')} hint={t('quiz.birthTime.hint')} />
          <TimeSelect key={data.unknownTime ? 'off' : 'on'} disabled={data.unknownTime} value={data.birthTime} onChange={(birthTime) => set({ birthTime })} />
          <label className="mt-3 flex cursor-pointer items-center gap-3 px-1 text-sm text-white/60">
            <input type="checkbox" className="h-4 w-4 accent-gold-400" checked={data.unknownTime} onChange={(e) => set({ unknownTime: e.target.checked, birthTime: '' })} />
            {t('quiz.birthTime.unknown')}
          </label>
          {data.unknownTime && <p className="mt-2 px-1 text-xs text-white/45">{t('quiz.birthTime.unknownNote')}</p>}
          <Next disabled={!(data.birthTime || data.unknownTime)} />
        </Form>
      )
      break
    case 'city':
      content = (
        <Form onSubmit={() => {
            if (data.place) return next()
            const p = cityGuess.current.first || (cityGuess.current.query.trim().length >= 2 ? capitalPlace(country, cityGuess.current.query) : null)
            if (p) {
              set({ place: p })
              next()
            }
          }}>
          <Title title={t('quiz.city.title')} hint={t('quiz.city.hint')} />
          <CitySearch place={data.place} onSelect={(place) => set({ place })} onPending={(g) => (cityGuess.current = g)} />
          <Next disabled={false} />
        </Form>
      )
      break
    case 'palm':
      content = (
        <div>
          <Title title={t('quiz.palm.title')} hint={t('quiz.palm.hint')} />
          <PalmScan onResult={(r) => set({ palm: { element: r.element, ringLonger: r.ringLonger } })} />
          {data.palm ? (
            <button onClick={next} className="btn-gold mt-5 w-full">
              {t('common.continue')} <ArrowRightIcon className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={next} className="mt-4 w-full py-2 text-sm text-white/45 hover:text-white">
              {t('common.skip')}
            </button>
          )}
        </div>
      )
      break
    case 'account': {
      const phoneOk = data.phone.replace(/\D/g, '').length >= c.phone.min
      const submit = () => {
        const e = {}
        if (!isEmail(data.email)) e.email = t('quiz.account.errors.email')
        if (!phoneOk) e.phone = t('quiz.account.errors.phone')
        if (!data.consent) e.consent = t('quiz.account.errors.consent')
        setErrors(e)
        if (!Object.keys(e).length) next()
      }
      content = (
        <Form onSubmit={submit}>
          <Title title={t('quiz.account.title')} hint={t('quiz.account.hint')} />
          <div className="space-y-3">
            <div>
              <Field icon={EnvelopeIcon}>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className={`field pl-12 ${errors.email ? 'border-rose-400/70' : ''}`}
                  placeholder={t('quiz.account.email')}
                  value={data.email}
                  onChange={(e) => set({ email: e.target.value })}
                />
              </Field>
              {errors.email && <p className="mt-1 pl-1 text-xs text-rose-300">{errors.email}</p>}
            </div>
            <div>
              <div className={`flex overflow-hidden rounded-xl border bg-white/[0.05] transition focus-within:border-gold-400/70 ${errors.phone ? 'border-rose-400/70' : 'border-white/10'}`}>
                <span className="flex items-center gap-2 border-r border-white/10 px-3 text-sm text-white/60">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-gold-300/70" />
                  {c.phone.code}
                </span>
                <input
                  inputMode="tel"
                  autoComplete="tel-national"
                  aria-label={t('quiz.account.phone')}
                  placeholder={c.phone.placeholder}
                  value={data.phone}
                  onChange={(e) => set({ phone: country === 'br' ? maskPhone(e.target.value) : e.target.value.replace(/[^\d ]/g, '').slice(0, c.phone.max + 3) })}
                  className="w-full bg-transparent px-3 py-3.5 text-white placeholder-white/35 outline-none"
                />
              </div>
              {errors.phone && <p className="mt-1 pl-1 text-xs text-rose-300">{errors.phone}</p>}
            </div>
            <label className="flex cursor-pointer items-start gap-3 px-1 pt-1 text-sm text-white/65">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-gold-400" checked={!!data.consent} onChange={(e) => set({ consent: e.target.checked })} />
              {t('quiz.account.consent')}
            </label>
            {errors.consent && <p className="pl-1 text-xs text-rose-300">{errors.consent}</p>}
          </div>
          <Next label={t('quiz.account.cta')} />
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-white/45">
            <KeyIcon className="h-3.5 w-3.5" /> {t('quiz.account.passwordless')}
          </p>
        </Form>
      )
      break
    }
  }

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-xl flex-col px-5 pb-10 pt-6">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => step > 0 && go(step - 1)}
          aria-label={t('common.back')}
          className={`grid h-10 w-10 place-items-center rounded-full border border-white/10 transition hover:border-white/30 ${step === 0 ? 'invisible' : ''}`}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        <span className="w-10 text-right text-xs tabular-nums text-white/50">{Math.round(progress)}%</span>
      </div>

      <div className="relative flex-1">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={id}
            custom={dir}
            variants={slide}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-white/40">
        <LockClosedIcon className="h-3.5 w-3.5 shrink-0" />
        {t('common.privacy')}
      </p>
    </div>
  )
}

const firstName = (n) => (n || '').trim().split(/\s+/)[0]

function Title({ title, hint }) {
  return (
    <div className="mb-7">
      <h2 className="font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl">{title}</h2>
      {hint && <p className="mt-2 text-white/55">{hint}</p>}
    </div>
  )
}

function Choice({ title, hint, quote, options, icons, value, onPick, row }) {
  return (
    <>
      <Title title={title} hint={hint} />
      {quote && (
        <motion.blockquote
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 rounded-2xl border-l-2 border-gold-400 bg-white/[0.04] px-6 py-5 font-serif text-2xl italic leading-snug text-white/90"
        >
          {quote}
        </motion.blockquote>
      )}
      <div className={row ? 'grid grid-cols-3 gap-3' : 'grid gap-3'}>
        {Object.entries(options).map(([k, label], i) => {
          const Icon = icons?.[k] || SparklesIcon
          const selected = value === k
          return (
            <motion.button
              key={k}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 * i }}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPick(k)}
              className={`group flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition ${row ? 'flex-col justify-center text-center' : ''} ${
                selected ? 'border-gold-400 bg-gold-400/10' : 'border-white/10 bg-white/[0.04] hover:border-gold-400/50 hover:bg-white/[0.07]'
              }`}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-300/20 to-lilac-400/10 text-gold-300 ring-1 ring-white/10">
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1 font-medium">{label}</span>
              {!row && <ArrowRightIcon className="h-4 w-4 text-white/30 transition group-hover:translate-x-1 group-hover:text-gold-300" />}
            </motion.button>
          )
        })}
      </div>
    </>
  )
}

function Interstitial({ icon: Icon, eyebrow, title, text, cta, onNext }) {
  return (
    <div className="pt-6 text-center">
      <motion.span
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold-400/10 text-gold-300 ring-1 ring-gold-400/30"
      >
        <Icon className="h-9 w-9" />
      </motion.span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300/80">{eyebrow}</p>
      {title && <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mx-auto mt-4 max-w-md text-lg text-white/70">
        {text}
      </motion.p>
      <button onClick={onNext} className="btn-gold mt-9 w-full">
        {cta} <HandThumbUpIcon className="h-5 w-5" />
      </button>
    </div>
  )
}

function Form({ onSubmit, children }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      {children}
    </form>
  )
}

function Field({ icon: Icon, children }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-300/70" />
      {children}
    </div>
  )
}

function Next({ disabled, label }) {
  const { t } = useI18n()
  return (
    <button type="submit" disabled={disabled} className="btn-gold mt-6 w-full">
      {label || t('common.continue')}
      <ArrowRightIcon className="h-4 w-4" />
    </button>
  )
}
