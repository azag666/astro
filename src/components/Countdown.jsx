import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'

// Prazo real: último segundo do mês corrente (os bônus são "do mês").
function endOfMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - 1000
}

export default function Countdown() {
  const { t } = useI18n()
  const [left, setLeft] = useState(() => endOfMonth() - Date.now())

  useEffect(() => {
    const id = setInterval(() => setLeft(endOfMonth() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const s = Math.max(0, Math.floor(left / 1000))
  const parts = { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
  const units = t('sales.bonus.units')

  return (
    <div className="flex justify-center gap-3">
      {Object.entries(parts).map(([k, v]) => (
        <div key={k} className="w-20 rounded-2xl border border-gold-400/30 bg-night-900/80 py-3 text-center">
          <p className="font-serif text-3xl font-semibold tabular-nums text-gold-300">{String(v).padStart(2, '0')}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/45">{units[k]}</p>
        </div>
      ))}
    </div>
  )
}
