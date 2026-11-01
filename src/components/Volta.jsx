import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { GiftIcon } from '@heroicons/react/24/outline'
import { useI18n } from '../i18n'
import { track } from '../lib/track'

// Back redirect: quem aperta "voltar" na oferta cai aqui com o mapa por um preço menor
export default function Volta({ name, onAccept, onDecline }) {
  const { t, money, c } = useI18n()
  const first = (name || '').trim().split(/\s+/)[0]

  useEffect(() => {
    track('back_offer_view')
  }, [])

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center px-5 py-10 text-center">
      <GiftIcon className="mx-auto h-14 w-14 text-gold-400" />
      <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-gold-400">{t('volta.eyebrow')}</p>
      <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight">{t('volta.title', { name: first })}</h2>
      <p className="mt-4 text-white/65">{t('volta.text')}</p>
      <p className="mt-6">
        <s className="mr-2 text-white/40">{money(c.price)}</s>
        <span className="font-serif text-5xl font-semibold text-gold-300">{money(c.back)}</span>
      </p>
      <button
        type="button"
        onClick={() => {
          track('back_offer_accept')
          onAccept()
        }}
        className="btn-gold mt-8 w-full py-5 text-lg"
      >
        {t('volta.cta', { value: money(c.back) })}
      </button>
      <button type="button" onClick={onDecline} className="mt-5 text-sm text-white/45 hover:text-white">
        {t('volta.no')}
      </button>
    </motion.div>
  )
}
