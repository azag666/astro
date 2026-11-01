import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { ZodiacWheel } from './Sky'
import { useI18n } from '../i18n'

export default function Analyzing({ name, hasPalm, onDone }) {
  const { t } = useI18n()
  const steps = useMemo(() => {
    const all = t('analyzing.steps')
    return hasPalm ? all : all.filter((_, i) => i !== 3)
  }, [t, hasPalm])
  const [done, setDone] = useState(0)

  useEffect(() => {
    if (done >= steps.length) {
      const timer = setTimeout(onDone, 700)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setDone((d) => d + 1), 900)
    return () => clearTimeout(timer)
  }, [done, steps.length, onDone])

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col items-center justify-center px-5 text-center">
      <div className="relative h-56 w-56">
        <ZodiacWheel className="h-full w-full" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold-300"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <h2 className="mt-8 font-serif text-3xl font-semibold">{t('analyzing.title', { name: (name || '').trim().split(/\s+/)[0] })}</h2>
      <ul className="mt-8 w-full space-y-3 text-left">
        {steps.map((s, i) => (
          <motion.li
            key={s}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: i <= done ? 1 : 0.3, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 text-sm"
          >
            {i < done ? (
              <CheckCircleIcon className="h-5 w-5 shrink-0 text-gold-400" />
            ) : (
              <span className={`h-5 w-5 shrink-0 rounded-full border-2 ${i === done ? 'animate-pulse border-gold-400' : 'border-white/20'}`} />
            )}
            {s}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
