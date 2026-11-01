import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon, HeartIcon, LockClosedIcon, PlusIcon } from '@heroicons/react/24/outline'
import { computeChart, SIGN_ELEMENT, SIGN_GLYPHS, SIGN_KEYS } from '../lib/astro'
import { useI18n } from '../i18n'

const ELEMENT_ORDER = ['fire', 'earth', 'air', 'water']
const pairKey = (a, b) => [a, b].sort((x, y) => ELEMENT_ORDER.indexOf(x) - ELEMENT_ORDER.indexOf(y)).join('_')

// Prévia de compatibilidade (só no front): Vênus de quem compra × Marte do parceiro.
// Sem parceiro cadastrado, mostra o teaser travado que leva a adicionar o perfil dele.
export default function CompatTeaser({ chart, partner, onAdd, onView, onBuyFor, onBuy }) {
  const { t: tBase } = useI18n()
  // O parceiro fica sempre no neutro (dele(a)): não dá para supor com quem a pessoa se relaciona
  const g = tBase('compat.g.n')
  const t = (k, vars) => tBase(k, { ...(typeof g === 'object' ? g : {}), ...vars })
  const signName = (i) => t(`signs.${SIGN_KEYS[i]}.name`)
  const venus = chart.get('venus')
  const partnerChart = useMemo(
    () => (partner ? computeChart({ birthDate: partner.birthDate, birthTime: partner.birthTime, unknownTime: partner.unknownTime, place: partner.place }) : null),
    [partner],
  )
  const pName = partner ? partner.name.trim().split(/\s+/)[0] : ''
  const mars = partnerChart?.get('mars')

  return (
    <motion.div
      id="compat"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mt-6 scroll-mt-28 overflow-hidden rounded-3xl border border-lilac-400/30 bg-gradient-to-b from-lilac-400/10 to-night-900/80 p-5"
    >
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-lilac-300">
        <HeartIcon className="h-4 w-4" /> {t('compat.eyebrow')}
      </p>
      <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight">{partner ? t('compat.titleWith', { partner: pName }) : t('compat.title')}</h2>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Side label={t('compat.you')} sub={`${t('compat.venus')} ${signName(venus.sign)}`} glyph={SIGN_GLYPHS[venus.sign]} />
        <HeartIcon className="h-6 w-6 text-lilac-300" />
        {partner ? (
          <Side label={pName} sub={`${t('compat.mars')} ${signName(mars.sign)}`} glyph={SIGN_GLYPHS[mars.sign]} />
        ) : (
          <Side label={t('compat.them')} sub={`${t('compat.mars')} ••••`} glyph="?" blurred />
        )}
      </div>

      {partner ? (
        <>
          <div className="mt-4 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/10">
            <p className="text-xs text-white/50">{t('compat.pairLead', { venus: signName(venus.sign), partner: pName, mars: signName(mars.sign) })}</p>
            <p className="mt-1 text-[15px] leading-snug text-white/90">{t(`compat.pairs.${pairKey(SIGN_ELEMENT[venus.sign], SIGN_ELEMENT[mars.sign])}`)}</p>
            <p className="mt-2 text-[11px] text-white/45">{t('compat.note')}</p>
          </div>
          <LockedList items={t('compat.lockedWith', { partner: pName })} />
          <button onClick={() => onBuyFor(partner)} className="btn-gold mt-4 w-full">
            {t('compat.buyFor', { partner: pName })} <ArrowRightIcon className="h-5 w-5" />
          </button>
          <button onClick={() => onView(partner.id)} className="mt-2 w-full py-2 text-sm font-medium text-gold-300">
            {t('compat.view', { partner: pName })}
          </button>
        </>
      ) : (
        <>
          <p className="mt-4 text-sm text-white/70">{t('compat.sub', { venus: signName(venus.sign) })}</p>
          <button onClick={onAdd || onBuy} className="block w-full text-left">
            <LockedList items={t('compat.lockedRows')} blurred />
            <span className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-gold-300">
              <LockClosedIcon className="h-4 w-4" /> {t('compat.locked')}
            </span>
          </button>
          <button onClick={onAdd || onBuy} className="btn-gold mt-4 w-full">
            <PlusIcon className="h-5 w-5" /> {t('compat.add')}
          </button>
          <p className="mt-2 text-center text-xs text-white/50">{t('compat.addHint')}</p>
        </>
      )}
    </motion.div>
  )
}

function Side({ label, sub, glyph, blurred }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] px-2 py-3 text-center ring-1 ring-white/10">
      <p className={`font-serif text-2xl text-gold-300 ${blurred ? 'select-none blur-[3px]' : ''}`}>{glyph}</p>
      <p className="truncate text-sm font-semibold">{label}</p>
      <p className={`truncate text-xs text-white/55 ${blurred ? 'select-none' : ''}`}>{sub}</p>
    </div>
  )
}

function LockedList({ items, blurred }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((x) => (
        <li key={x} className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm text-white/70 ring-1 ring-white/10">
          <LockClosedIcon className="h-4 w-4 shrink-0 text-gold-400" />
          <span className="min-w-0 flex-1">{x}</span>
          {blurred && <span aria-hidden className="shrink-0 select-none rounded bg-white/10 px-2 font-mono text-xs blur-[4px]">••••••</span>}
        </li>
      ))}
    </ul>
  )
}
