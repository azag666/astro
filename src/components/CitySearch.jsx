import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircleIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { searchCity } from '../lib/astro'
import { useI18n } from '../i18n'

export default function CitySearch({ place, onSelect, autoFocus = true }) {
  const { t, lang } = useI18n()
  const [query, setQuery] = useState(place ? place.name : '')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const selected = place && query === place.name

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([])
      setStatus('idle')
      return
    }
    setStatus('loading')
    let alive = true
    const timer = setTimeout(() => {
      searchCity(query, lang)
        .then((r) => alive && (setResults(r), setStatus('done')))
        .catch(() => alive && setStatus('error'))
    }, 300)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [query, lang, selected])

  return (
    <div className="relative">
      <div className="relative">
        <MapPinIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-300/70" />
        <input
          autoFocus={autoFocus}
          className={`field pl-12 pr-12 ${selected ? 'border-gold-400/60' : ''}`}
          placeholder={t('quiz.city.placeholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (place) onSelect(null)
          }}
        />
        {selected && <CheckCircleIcon className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-400" />}
      </div>
      {selected && <p className="mt-2 pl-1 text-xs text-white/45">{place.region}</p>}

      <AnimatePresence>
        {!selected && status !== 'idle' && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-night-900/95 backdrop-blur-xl"
          >
            {status === 'loading' && <li className="px-4 py-3 text-sm text-white/50">{t('quiz.city.searching')}</li>}
            {status === 'error' && <li className="px-4 py-3 text-sm text-rose-300">{t('quiz.city.error')}</li>}
            {status === 'done' && !results.length && <li className="px-4 py-3 text-sm text-white/50">{t('quiz.city.none')}</li>}
            {status === 'done' &&
              results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(r.name)
                      onSelect(r)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                  >
                    <MapPinIcon className="h-4 w-4 shrink-0 text-gold-400" />
                    <span>
                      <span className="block font-medium">{r.name}</span>
                      <span className="text-xs text-white/45">{r.region}</span>
                    </span>
                  </button>
                </li>
              ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
