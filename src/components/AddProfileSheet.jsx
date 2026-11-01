import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline'
import CitySearch from './CitySearch'
import { DateSelect, TimeSelect } from './DateSelect'
import { useI18n } from '../i18n'
import { guessGender } from '../lib/gender'
import { capitalPlace } from '../lib/astro'

// Oferta focada em amor: a pessoa adicionada é sempre o(a) parceiro(a), e o gênero sai do nome (sem perguntar)
const EMPTY = { name: '', relation: 'partner', gender: '', birthDate: '', birthTime: '', unknownTime: false, place: null }

// Bottom sheet (mobile-first) para cadastrar o perfil de outra pessoa.
export default function AddProfileSheet({ open, onClose, onSave }) {
  const { t, country } = useI18n()
  const [p, setP] = useState(EMPTY)
  // Cidade digitada sem tocar na lista: como no quiz, usa a 1ª sugestão ou, sem nenhuma, a capital do país (não trava o botão)
  const [pending, setPending] = useState({ query: '', first: null })
  const set = (patch) => setP((x) => ({ ...x, ...patch }))
  const place = p.place || pending.first || (pending.query.trim().length >= 2 ? capitalPlace(country, pending.query) : null)
  const valid = p.name.trim().length > 1 && p.birthDate && (p.birthTime || p.unknownTime) && place

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-night-950/70 backdrop-blur-sm" onClick={onClose} />
          <motion.form
            onSubmit={(e) => {
              e.preventDefault()
              if (!valid) return
              onSave({ ...p, place, gender: guessGender(p.name) || 'n' })
              setP(EMPTY)
              setPending({ query: '', first: null })
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

            <div className="mt-5 space-y-5">
              <div>
                <Label>{t('profiles.sheet.name')}</Label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-300/70" />
                  <input className="field pl-12" autoComplete="off" placeholder={t('quiz.name.placeholder')} value={p.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>{t('profiles.sheet.date')}</Label>
                <DateSelect value={p.birthDate} onChange={(v) => set({ birthDate: v })} />
              </div>
              <div>
                <Label>{t('profiles.sheet.time')}</Label>
                <TimeSelect key={p.unknownTime ? 'off' : 'on'} value={p.birthTime} disabled={p.unknownTime} onChange={(v) => set({ birthTime: v })} />
                <label className="mt-3 flex cursor-pointer items-center gap-3 px-1 text-sm text-white/60">
                  <input type="checkbox" className="h-4 w-4 accent-gold-400" checked={p.unknownTime} onChange={(e) => set({ unknownTime: e.target.checked, birthTime: '' })} />
                  {t('profiles.sheet.unknown')}
                </label>
              </div>
              <div>
                <Label>{t('profiles.sheet.city')}</Label>
                <CitySearch place={p.place} onSelect={(place) => set({ place })} onPending={setPending} autoFocus={false} />
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

function Label({ children }) {
  return <p className="mb-2 px-1 text-sm font-medium text-white/70">{children}</p>
}
