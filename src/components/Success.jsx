import { motion } from 'framer-motion'
import { CheckIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import Logo from './Logo'
import { useI18n } from '../i18n'

export default function Success({ data, order }) {
  const { t, money } = useI18n()
  const icons = [CheckIcon, SparklesIcon, EnvelopeIcon]
  const vars = { total: money(order.total), email: data.email, name: (data.name || '').trim().split(/\s+/)[0] }
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-lg flex-col items-center px-5 py-10 text-center">
      <Logo />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}
        className="mt-14 grid h-24 w-24 place-items-center rounded-full bg-gold-400 shadow-[0_0_80px_10px_rgba(226,194,125,0.4)]"
      >
        <CheckIcon className="h-12 w-12 text-night-950" strokeWidth={2.5} />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 font-serif text-4xl font-semibold">
        {t('success.title', vars)}
      </motion.h1>
      <p className="mt-3 text-white/60">{t('success.sub')}</p>
      <ol className="mt-10 w-full space-y-4 text-left">
        {t('success.steps', vars).map((s, i) => {
          const Icon = icons[i]
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.15 }}
              className="glass flex gap-4 rounded-2xl p-5"
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${i === 0 ? 'bg-gold-400 text-night-950' : 'bg-white/10 text-gold-300'}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-white/55">{s.text}</p>
              </div>
            </motion.li>
          )
        })}
      </ol>
      <a href="#" className="mt-8 flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ChatBubbleLeftRightIcon className="h-4 w-4" /> {t('success.support')}
      </a>
    </div>
  )
}
