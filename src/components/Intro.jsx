import { motion } from 'framer-motion'
import { ArrowRightIcon, ClockIcon, LockClosedIcon, ShieldCheckIcon, StarIcon } from '@heroicons/react/24/solid'
import { ZodiacWheel } from './Sky'
import Logo from './Logo'
import CountrySwitcher from './CountrySwitcher'
import { useI18n } from '../i18n'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] },
})

export default function Intro({ focus, onStart, onSkip, onCountry }) {
  const { t } = useI18n()
  const k = focus ? `intro.byFocus.${focus}` : null
  const copy = {
    badge: t(k ? `${k}.badge` : 'intro.badge'),
    title: t(k ? `${k}.title` : 'intro.title'),
    accent: t(k ? `${k}.accent` : 'intro.titleAccent'),
    sub: t(k ? `${k}.sub` : 'intro.sub'),
  }
  return (
    <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5">
      <header className="flex items-center justify-between py-4 sm:py-6">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-2 text-xs text-white/50 sm:flex">
            <LockClosedIcon className="h-3.5 w-3.5" /> {t('common.secure')}
          </span>
          <CountrySwitcher onChange={onCountry} />
        </div>
      </header>

      <div className="grid flex-1 items-center gap-6 pb-16 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div className="text-center lg:text-left">
          <motion.span
            {...fade(0.1)}
            className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/5 px-4 py-1.5 text-xs font-medium tracking-wide text-gold-300"
          >
            <StarIcon className="h-3.5 w-3.5" /> {copy.badge}
          </motion.span>

          <motion.h1 {...fade(0.2)} className="mt-4 font-serif text-[2.4rem] font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            {copy.title} <span className="text-gradient-gold italic">{copy.accent}</span>
          </motion.h1>

          <motion.p {...fade(0.35)} className="mx-auto mt-4 max-w-lg text-base text-white/65 sm:text-lg lg:mx-0">
            {copy.sub}
          </motion.p>

          <motion.div {...fade(0.5)} className="mt-6 flex flex-col items-center gap-4 lg:items-start">
            <button onClick={onStart} className="btn-gold w-full text-lg sm:w-auto">
              {t('intro.cta')}
              <ArrowRightIcon className="h-5 w-5" />
            </button>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4 text-gold-400" /> {t('intro.time')}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheckIcon className="h-4 w-4 text-gold-400" /> {t('intro.free')}
              </span>
            </div>
            <button onClick={onSkip} className="text-sm text-white/40 underline-offset-4 hover:text-white/70 hover:underline">
              {t('intro.skip')}
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-first mx-auto aspect-square w-36 sm:w-72 lg:order-none lg:w-full lg:max-w-[26rem]"
        >
          <div className="absolute inset-8 rounded-full bg-gold-400/10 blur-3xl" />
          <ZodiacWheel className="relative h-full w-full" />
          <motion.div
            className="absolute inset-0 grid place-items-center"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="h-20 w-20 rounded-full bg-[radial-gradient(circle,#fff6dc_0%,#e2c27d_40%,transparent_72%)] shadow-[0_0_80px_20px_rgba(226,194,125,0.35)]" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
