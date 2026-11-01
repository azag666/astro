import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { COUNTRIES, useI18n } from '../i18n'

export default function CountrySwitcher({ onChange }) {
  const { country, c } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/30"
      >
        <GlobeAltIcon className="h-4 w-4 text-gold-300" />
        {c.name}
        <ChevronDownIcon className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-night-900/95 py-1 backdrop-blur-xl"
          >
            {Object.entries(COUNTRIES).map(([k, v]) => (
              <li key={k}>
                <button
                  onClick={() => {
                    onChange(k)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-white/5 ${k === country ? 'text-gold-300' : ''}`}
                >
                  {v.name}
                  <span className="text-xs text-white/40">{v.currency}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
