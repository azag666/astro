import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { useI18n, WALLETS } from '../../i18n'
import { htMethod } from '../../i18n/paises.js'
import { sid, track, utm } from '../../lib/track'
import { fbCookies, fbEvent } from '../../lib/pixel'
import { LivePending, WalletTab } from '../Checkout'

const KEY = 'ceu-natal-pedido-perguntas'

// Pagamento curto para pacotes de perguntas: o contato já veio do quiz/conta,
// então é só escolher o método e pagar (mesma tela de pagamento real do checkout).
export default function QuickPay({ data, pack, offer = '', cta, onPaid }) {
  const { t, c, country, walletName, walletNote } = useI18n()
  const [fora, setFora] = useState([])
  const todos = c.wallets.filter((w) => htMethod(w, c.currency))
  const wallets = todos.filter((w) => !fora.includes(w)).length ? todos.filter((w) => !fora.includes(w)) : todos
  const [method, setMethod] = useState(todos[0])
  useEffect(() => {
    fetch(`/api/metodos?c=${country}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const f = d?.fora || []
        setFora(f)
        setMethod((m) => (f.includes(m) ? todos.find((w) => !f.includes(w)) || m : m))
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country])
  const [order, setOrder] = useState(() => {
    try {
      const o = JSON.parse(sessionStorage.getItem(KEY) || 'null')
      return o && o.country === country && o.pack === pack && o.status === 'pending' ? o : null
    } catch {
      return null
    }
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [holder, setHolder] = useState(data.name || '')

  const pay = async () => {
    setBusy(true)
    setError('')
    track('pay_click', { method, product: 'perguntas', pack, offer })
    try {
      const r = await fetch('/api/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sid,
          ...fbCookies(),
          country,
          wallet: method,
          product: 'perguntas',
          pack,
          offer,
          focus: data.focus,
          utm,
          customer: { name: method === 'cvu' ? holder.trim() : (data.name || '').trim(), email: (data.email || '').trim(), phone: data.phone ? `${c.phone.code} ${data.phone}` : '' },
        }),
      })
      const body = await r.json().catch(() => ({}))
      if (!r.ok) throw Object.assign(new Error(body.error), { code: body.error })
      const o = { ...body, country }
      sessionStorage.setItem(KEY, JSON.stringify(o))
      fbEvent('AddPaymentInfo', `api-${o.id}`, { value: o.total, currency: o.currency })
      const link = o.payment?.kind === 'redirect' && o.payment.instructions?.checkout_url
      if (link && !o.simulado) {
        track('redirect_open', { method })
        window.location.href = link
        return
      }
      setOrder(o)
    } catch (e) {
      if (e.code === 'method_unavailable' || e.code === 'gateway_error') {
        setFora((f) => [...f, method])
        const outro = wallets.find((w) => w !== method)
        if (outro) setMethod(outro)
      }
      setError(t(e.code === 'rate_limited' ? 'checkout.pay.tooMany' : e.code === 'method_unavailable' ? 'checkout.pay.unavailable' : 'checkout.pay.error'))
    } finally {
      setBusy(false)
    }
  }

  if (order) {
    return (
      <LivePending
        order={order}
        holder={holder}
        onPaid={() => {
          sessionStorage.removeItem(KEY)
          onPaid(order)
        }}
        onBack={() => {
          sessionStorage.removeItem(KEY)
          setOrder(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${wallets.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {wallets.map((w) => (
          <WalletTab key={w} id={w} active={method === w} onClick={() => setMethod(w)} color={WALLETS[w].color} label={walletName(w)} note={walletNote(w)} />
        ))}
      </div>
      {method === 'cvu' && (
        <div>
          <p className="mb-1.5 pl-1 text-xs font-medium text-white/60">{t('checkout.pay.holder')}</p>
          <input className="field" value={holder} onChange={(e) => setHolder(e.target.value)} autoComplete="name" />
          <p className="mt-1.5 pl-1 text-xs text-white/45">{t('checkout.pay.holderHint')}</p>
        </div>
      )}
      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0" /> {error}
        </p>
      )}
      <button type="button" disabled={busy || (method === 'cvu' && holder.trim().split(/\s+/).length < 2)} onClick={pay} className="btn-gold w-full py-5 text-lg disabled:opacity-60">
        {busy ? (
          <motion.span className="h-5 w-5 rounded-full border-2 border-night-950/30 border-t-night-950" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
        ) : (
          <LockClosedIcon className="h-5 w-5" />
        )}
        {cta}
      </button>
    </div>
  )
}
