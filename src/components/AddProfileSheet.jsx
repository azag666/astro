import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline'
import CitySearch from './CitySearch'
import { DateSelect, TimeSelect } from './DateSelect'
import { useI18n } from '../i18n'

const EMPTY = { name: '', relation: 'partner', gender: 'f', birthDate: '', birthTime: '', unknownTime: false, place: null }

// Bottom sheet (mobile-first) para cadastrar o perfil de outra pessoa.
export default function AddProfileSheet({ open, onClose, onSave }) {
  const { t } = useI18n()
  const [p, setP] = useState(EMPTY)
  const set = (patch) => setP((x) => ({ ...x, ...patch }))
  const valid = p.name.trim().length > 1 && p.birthDate && (p.birthTime || p.unknownTime) && p.place

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-night-950/70 backdrop-blur-sm" onClick={onClose} />
          <motion.form
            onSubmit={(e) => {
              e.preventDefault()
              if (!valid) return
              onSave(p)
              setP(EMPTY)
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-night-900 p-5 pb-8 sm:rounded-3xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold">{t('profiles.sheet.title')}</h2>
                <p className="mt-1 text-sm text-white/55">{t('profiles.sheet.sub')}</p>
              </div>
              <button type="button" onClick={onClose} aria-label={t('profiles.sheet.cancel')} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-300/70" />
                <input className="field pl-12" placeholder={t('profiles.sheet.name')} value={p.name} onChange={(e) => set({ name: e.target.value })} />
              </div>

              <div>
                <p className="mb-2 text-sm text-white/60">{t('profiles.sheet.relation')}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(t('profiles.relations')).map(([k, label]) => (
                    <Pill key={k} active={p.relation === k} onClick={() => set({ relation: k })}>
                      {label}
                    </Pill>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.entries(t('profiles.sheet.gender')).map(([k, label]) => (
                  <Pill key={k} active={p.gender === k} onClick={() => set({ gender: k })}>
                    {label}
                  </Pill>
                ))}
              </div>

              <div>
                <span className="mb-1 block text-xs text-white/50">{t('profiles.sheet.date')}</span>
                <DateSelect value={p.birthDate} onChange={(v) => set({ birthDate: v })} />
              </div>
              <div>
                <span className="mb-1 block text-xs text-white/50">{t('profiles.sheet.time')}</span>
                <TimeSelect value={p.birthTime} disabled={p.unknownTime} onChange={(v) => set({ birthTime: v })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-white/60">
                <input type="checkbox" className="h-4 w-4 accent-gold-400" checked={p.unknownTime} onChange={(e) => set({ unknownTime: e.target.checked, birthTime: '' })} />
                {t('profiles.sheet.unknown')}
              </label>

              <div>
                <span className="mb-1 block text-xs text-white/50">{t('profiles.sheet.city')}</span>
                <CitySearch place={p.place} onSelect={(place) => set({ place })} autoFocus={false} />
              </div>
            </div>

            <button type="submit" disabled={!valid} className="btn-gold mt-6 w-full">
              {t('profiles.sheet.save')}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm ring-1 transition ${active ? 'bg-gold-400 font-semibold text-night-950 ring-gold-400' : 'bg-white/5 text-white/75 ring-white/10'}`}
    >
      {children}
    </button>
  )
}
