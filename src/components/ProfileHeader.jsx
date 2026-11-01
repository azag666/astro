import { motion } from 'framer-motion'
import { CalendarDaysIcon, ClockIcon, LockClosedIcon, MapPinIcon, PlusIcon } from '@heroicons/react/24/outline'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import { SIGN_GLYPHS, SIGN_KEYS } from '../lib/astro'
import { useI18n } from '../i18n'

// Cartão de perfil somente leitura (estilo "produto") + seletor de perfis.
export function ProfileSwitcher({ profiles, activeId, onSelect, onAdd }) {
  const { t } = useI18n()
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {profiles.map((p) => {
        const active = p.id === activeId
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm ring-1 transition ${
              active ? 'bg-gold-400/15 text-white ring-gold-400' : 'bg-white/5 text-white/70 ring-white/10'
            }`}
          >
            <Avatar name={p.name} small active={active} />
            {p.name.trim().split(/\s+/)[0]}
          </button>
        )
      })}
      <button onClick={onAdd} className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-gold-400/60 px-3 py-1.5 text-sm font-medium text-gold-300">
        <PlusIcon className="h-4 w-4" /> {t('profiles.add')}
      </button>
    </div>
  )
}

export default function ProfileCard({ profile, chart, isMain }) {
  const { t, c } = useI18n()
  const date = new Date(`${profile.birthDate}T12:00`).toLocaleDateString(c.locale, { day: 'numeric', month: 'long', year: 'numeric' })
  const signName = (i) => t(`signs.${SIGN_KEYS[i]}.name`)
  const chips = [
    ['☉', t('planets.sun.name'), chart.get('sun').sign],
    ['☽', t('planets.moon.name'), chart.get('moon').sign],
    ['AC', t('planets.asc.name'), chart.asc ? chart.asc.sign : null],
  ]

  return (
    <motion.div key={profile.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
      <Avatar name={profile.name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-serif text-2xl font-semibold leading-tight">{profile.name}</p>
          {isMain ? (
            <span className="flex items-center gap-1 rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-300">
              <CheckBadgeIcon className="h-3.5 w-3.5" /> {t('profiles.main')}
            </span>
          ) : (
            profile.relation && <span className="rounded-full bg-lilac-400/15 px-2 py-0.5 text-[10px] font-bold uppercase text-lilac-300">{t(`profiles.relations.${profile.relation}`)}</span>
          )}
        </div>
        <ul className="mt-1.5 space-y-0.5 text-xs text-white/55">
          <li className="flex items-center gap-1.5">
            <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0 text-gold-400" />
            {t('profiles.born', { date })}
          </li>
          <li className="flex items-center gap-1.5">
            <ClockIcon className="h-3.5 w-3.5 shrink-0 text-gold-400" />
            {profile.unknownTime || !profile.birthTime ? t('profiles.unknownTime') : t('profiles.at', { time: profile.birthTime })}
          </li>
          {profile.place && (
            <li className="flex items-center gap-1.5">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-gold-400" />
              <span className="truncate">{[profile.place.name, profile.place.region].filter(Boolean).join(', ')}</span>
            </li>
          )}
        </ul>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map(([g, label, sign]) => (
            <span key={label} className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs ring-1 ring-white/10">
              <span className="text-gold-300">{sign != null ? SIGN_GLYPHS[sign] : g}</span>
              <span className="text-white/50">{label}</span>
              <strong className="font-semibold">{sign != null ? signName(sign) : '—'}</strong>
            </span>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/35">
          <LockClosedIcon className="h-3 w-3 shrink-0" /> {t('profiles.readOnly')}
        </p>
      </div>
    </motion.div>
  )
}

function Avatar({ name, small, active }) {
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-night-950 ${small ? 'h-7 w-7 text-[11px]' : 'h-16 w-16 text-xl'} ${
        active === false ? 'bg-white/30' : 'bg-gradient-to-br from-gold-300 to-gold-500'
      }`}
    >
      {initials}
    </span>
  )
}
