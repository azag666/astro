import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  BuildingLibraryIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  MapPinIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import Logo from './Logo'
import { quickSunSign, SIGN_GLYPHS, SIGN_KEYS } from '../lib/astro'
import { isEmail, maskCard, maskExpiry, maskPhone } from '../lib/format'
import { useI18n, WALLETS } from '../i18n'
import { htMethod } from '../i18n/paises.js'
import { sid, track, utm } from '../lib/track'
import { currentAccount } from '../lib/account'
import { fbCookies, fbEvent } from '../lib/pixel'
import QRCode from 'qrcode'
import { DateSelect, TimeSelect } from './DateSelect'
import ProAvatar from './pros/ProAvatar'
import { especialistaDaDor, useEspecialistas } from '../lib/pros'

const ORDER_KEY = 'ceu-natal-pedido'

function savedOrder(country) {
  try {
    const o = JSON.parse(sessionStorage.getItem(ORDER_KEY) || 'null')
    return o && o.country === country && o.status === 'pending' ? o : null
  } catch {
    return null
  }
}

// buyFor: perfil de outra pessoa (parceiro, filho...) para quem é o mapa; null = o próprio comprador
// offer: '' = preço normal, 'back' = desconto da volta (back redirect)
export default function Checkout({ data, setData, onBack, onPaid, buyFor = null, offer = '' }) {
  const { t, money, c, country, walletName, walletNote } = useI18n()
  const [off, setOff] = useState([])
  const wallets = c.wallets.filter((w) => !off.includes(w))
  useEffect(() => {
    fetch(`/api/metodos?c=${country}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const fora = (d?.fora || []).filter((w) => c.wallets.includes(w))
        if (!fora.length || fora.length >= c.wallets.length) return
        setOff(fora)
        setMethod((m) => (fora.includes(m) ? c.wallets.find((w) => !fora.includes(w)) : m))
      })
      .catch(() => {})
  }, [country, c.wallets])
  const [method, setMethod] = useState(c.wallets[0])
  const [bump, setBump] = useState(false)
  const [numBump, setNumBump] = useState(false)
  const [askBump, setAskBump] = useState(false)
  const pro = especialistaDaDor(useEspecialistas(), data.focus)
  // Bump 'compatibilidade de vocês': se o parceiro já foi adicionado (ou é o mapa dele que está sendo comprado), os dados vão junto no pedido
  const partner = buyFor?.relation === 'partner' ? buyFor : [...(currentAccount()?.profiles || [])].reverse().find((x) => x.relation === 'partner') || null
  const [touched, setTouched] = useState(false)
  const [order, setOrder] = useState(() => savedOrder(country))
  const [stage, setStage] = useState(() => (order ? 'pending' : 'form'))
  const [payError, setPayError] = useState('')
  const [holder, setHolder] = useState(data.name)
  const [editContact, setEditContact] = useState(false)
  const live = !!htMethod(method, c.currency)
  const askHolder = live && method === 'cvu'
  const [bank, setBank] = useState('')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '', installments: '1' })
  const subject = buyFor || data
  const fromQuiz = !!subject.birthDate && !!subject.place
  const kind = WALLETS[method].kind

  const base = offer === 'back' ? c.back : c.price
  const total = base + (bump ? c.bump : 0) + (numBump ? c.numBump : 0) + (askBump ? c.askDown : 0)
  const signIdx = quickSunSign(subject.birthDate)
  const phoneDigits = data.phone.replace(/\D/g, '')
  const contactOk = data.name.trim().length >= 2 && isEmail(data.email) && phoneDigits.length >= c.phone.min
  const showContact = !contactOk || editContact
  // Tudo já veio do quiz/conta: o checkout só pede para confirmar e escolher como pagar
  const soConfirmar = !showContact && fromQuiz

  const errors = useMemo(() => {
    const e = {}
    if (data.name.trim().length < 2) e.name = t('checkout.errors.name')
    if (!isEmail(data.email)) e.email = t('checkout.errors.email')
    if (phoneDigits.length < c.phone.min) e.phone = t('checkout.errors.phone')
    if (!buyFor && !data.birthDate) e.birthDate = t('checkout.errors.birthDate')
    if (!buyFor && !data.place && !data.cityText?.trim()) e.city = t('checkout.errors.city')
    if (kind === 'card') {
      if (card.number.replace(/\D/g, '').length < 16) e.number = t('checkout.errors.number')
      if (card.name.trim().length < 3) e.cardName = t('checkout.errors.cardName')
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = t('checkout.errors.expiry')
      if (card.cvv.length < 3) e.cvv = t('checkout.errors.cvv')
    }
    if (kind === 'redirect' && !live && !bank) e.bank = t('checkout.errors.bank')
    if (askHolder && holder.trim().split(/\s+/).length < 2) e.holder = t('checkout.pay.errors.holder')
    return e
  }, [data, card, kind, bank, phoneDigits, c, t, live, askHolder, holder, buyFor])

  const submit = async (ev) => {
    ev.preventDefault()
    setTouched(true)
    setPayError('')
    if (Object.keys(errors).length) {
      track('checkout_invalid', { fields: Object.keys(errors).join(',') })
      if (errors.name || errors.email || errors.phone) setEditContact(true)
      return
    }
    track('pay_click', { method })
    if (live) {
      setStage('processing')
      try {
        const r = await fetch('/api/pedido', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sid,
            ...fbCookies(),
            country,
            wallet: method,
            offer,
            bump,
            numBump,
            askBump,
            focus: data.focus,
            utm,
            customer: { name: askHolder ? holder.trim() : data.name.trim(), email: data.email.trim(), phone: `${c.phone.code} ${data.phone}` },
            partner: bump && partner ? perfilDoPedido(partner) : undefined,
            profile: buyFor && {
              id: buyFor.id,
              name: buyFor.name,
              relation: buyFor.relation,
              birthDate: buyFor.birthDate,
              birthTime: buyFor.birthTime,
              unknownTime: buyFor.unknownTime,
              place: buyFor.place && { name: buyFor.place.name, lat: buyFor.place.lat, lon: buyFor.place.lon, tz: buyFor.place.tz },
            },
          }),
        })
        const body = await r.json().catch(() => ({}))
        if (!r.ok) throw Object.assign(new Error(body.error), { code: body.error })
        const o = { ...body, country, bump, numBump, askBump, profileId: buyFor?.id || null }
        sessionStorage.setItem(ORDER_KEY, JSON.stringify(o))
        fbEvent('AddPaymentInfo', `api-${o.id}`, { value: o.total, currency: o.currency })
        const link = o.payment?.kind === 'redirect' && o.payment.instructions?.checkout_url
        if (link && !o.simulado) {
          track('redirect_open', { method })
          window.location.href = link
          return
        }
        setOrder(o)
        setStage('pending')
        window.scrollTo({ top: 0 })
      } catch (e) {
        setStage('form')
        const rest = wallets.filter((w) => w !== method)
        if ((e.code === 'method_unavailable' || e.code === 'gateway_error') && rest.length) {
          setOff((o) => [...o, method])
          setMethod(rest[0])
          setPayError(t('checkout.pay.unavailable'))
        } else setPayError(t(e.code === 'rate_limited' ? 'checkout.pay.tooMany' : 'checkout.pay.error'))
      }
      return
    }
    if (kind === 'card') {
      setStage('processing')
      setTimeout(() => onPaid({ total, bump, numBump }), 1800)
    } else {
      setStage('pending')
      window.scrollTo({ top: 0 })
    }
  }

  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }))
  const err = (k) => touched && errors[k]

  return (
    <div className="min-h-[100svh]">
      <header className="border-b border-white/10 bg-night-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowLeftIcon className="h-4 w-4" /> {t('common.back')}
          </button>
          <Logo />
          <span className="flex items-center gap-1.5 text-xs text-emerald-300/90">
            <LockClosedIcon className="h-4 w-4" /> <span className="hidden sm:inline">{t('checkout.secure')}</span>
          </span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {stage === 'pending' && order ? (
          <LivePending
            key="live"
            order={order}
            holder={holder}
            onPaid={() => {
              sessionStorage.removeItem(ORDER_KEY)
              onPaid({ total: order.total, bump: order.bump, numBump: order.numBump, askBump: !!order.askBump, orderId: order.id, profileId: order.profileId || null, partnerSent: !!(order.bump && partner) })
            }}
            onBack={() => {
              sessionStorage.removeItem(ORDER_KEY)
              setOrder(null)
              setStage('form')
            }}
          />
        ) : stage === 'pending' ? (
          <Pending
            key="pending"
            kind={kind}
            method={method}
            total={total}
            email={data.email}
            phone={`${c.phone.code} ${data.phone}`}
            bank={bank}
            onPaid={() => onPaid({ total, bump, numBump })}
            onBack={() => setStage('form')}
          />
        ) : (
          <motion.form
            key="form"
            onSubmit={submit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[1fr_22rem]"
            noValidate
          >
            <div className="order-2 space-y-6 lg:order-1">
              {soConfirmar && (
                <Card step="1" title={t('checkout.pay.confirmTitle')}>
                  <div className="space-y-2 rounded-xl bg-white/[0.04] px-4 py-3.5 text-sm">
                    <p className="flex items-center gap-2"><UserIcon className="h-4 w-4 shrink-0 text-gold-400" />{buyFor ? buyFor.name : data.name}</p>
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-2"><CalendarDaysIcon className="h-4 w-4 text-gold-400" />{new Date(subject.birthDate + 'T12:00').toLocaleDateString(c.locale)}</span>
                      <span className="flex items-center gap-2"><ClockIcon className="h-4 w-4 text-gold-400" />{subject.unknownTime || !subject.birthTime ? t('checkout.unknownTime') : subject.birthTime}</span>
                      <span className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-gold-400" />{subject.place.name}</span>
                    </p>
                    <p className="flex items-center gap-2 text-white/60"><EnvelopeIcon className="h-4 w-4 shrink-0 text-gold-400" />{data.email}</p>
                  </div>
                  <button type="button" onClick={() => setEditContact(true)} className="mt-2 flex items-center gap-1 text-xs text-white/50 hover:text-white">
                    <PencilSquareIcon className="h-4 w-4" /> {t('checkout.pay.edit')}
                  </button>
                </Card>
              )}
              {!soConfirmar && (
              <Card step="1" title={t('checkout.step1')}>
                {!showContact ? (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-white/[0.04] px-4 py-3.5 text-sm">
                    <span className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-gold-400" />{data.name}</span>
                    <span className="flex items-center gap-2"><EnvelopeIcon className="h-4 w-4 text-gold-400" />{data.email}</span>
                    <span className="flex items-center gap-2"><DevicePhoneMobileIcon className="h-4 w-4 text-gold-400" />{c.phone.code} {data.phone}</span>
                    <button type="button" onClick={() => setEditContact(true)} className="ml-auto flex items-center gap-1 text-xs text-white/55 hover:text-white">
                      <PencilSquareIcon className="h-4 w-4" /> {t('checkout.pay.edit')}
                    </button>
                  </div>
                ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input icon={UserIcon} placeholder={t('checkout.name')} value={data.name} onChange={set('name')} error={err('name')} autoComplete="name" className="sm:col-span-2" />
                  <Input icon={EnvelopeIcon} type="email" inputMode="email" placeholder={t('checkout.email')} value={data.email} onChange={set('email')} error={err('email')} autoComplete="email" />
                  <div>
                    <div className={`flex overflow-hidden rounded-xl border bg-white/[0.05] transition focus-within:border-gold-400/70 ${err('phone') ? 'border-rose-400/70' : 'border-white/10'}`}>
                      <span className="flex items-center gap-2 border-r border-white/10 px-3 text-sm text-white/60">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-white/35" />
                        {c.phone.code}
                      </span>
                      <input
                        inputMode="tel"
                        autoComplete="tel-national"
                        placeholder={c.phone.placeholder}
                        aria-label={t('checkout.phone')}
                        value={data.phone}
                        onChange={(e) =>
                          setData((d) => ({ ...d, phone: country === 'br' ? maskPhone(e.target.value) : e.target.value.replace(/[^\d ]/g, '').slice(0, c.phone.max + 3) }))
                        }
                        className="w-full bg-transparent px-3 py-3.5 text-white placeholder-white/35 outline-none"
                      />
                    </div>
                    {err('phone') && <p className="mt-1 pl-1 text-xs text-rose-300">{errors.phone}</p>}
                  </div>
                </div>
                )}
              </Card>

              )}

              {!soConfirmar && (
              <Card step="2" title={t('checkout.step2')}>
                {fromQuiz ? (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-white/[0.04] px-4 py-3.5 text-sm">
                    {buyFor && <span className="flex items-center gap-2 font-medium"><UserIcon className="h-4 w-4 text-gold-400" />{buyFor.name}</span>}
                    <span className="flex items-center gap-2"><CalendarDaysIcon className="h-4 w-4 text-gold-400" />{new Date(subject.birthDate + 'T12:00').toLocaleDateString(c.locale)}</span>
                    <span className="flex items-center gap-2"><ClockIcon className="h-4 w-4 text-gold-400" />{subject.unknownTime || !subject.birthTime ? t('checkout.unknownTime') : subject.birthTime}</span>
                    <span className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-gold-400" />{subject.place.name}</span>
                    {!buyFor && <span className="ml-auto flex items-center gap-1 text-xs text-emerald-300/90"><CheckIcon className="h-4 w-4" /> {t('checkout.fromQuiz')}</span>}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-3">
                      <DateSelect value={data.birthDate} onChange={(birthDate) => setData((d) => ({ ...d, birthDate }))} />
                      {err('birthDate') && <p className="mt-1 pl-1 text-xs text-rose-300">{errors.birthDate}</p>}
                    </div>
                    <div className="sm:col-span-3">
                      <TimeSelect disabled={data.unknownTime} value={data.birthTime} onChange={(birthTime) => setData((d) => ({ ...d, birthTime }))} />
                    </div>
                    <Input icon={MapPinIcon} placeholder={t('checkout.city')} value={data.cityText || ''} onChange={set('cityText')} error={err('city')} />
                  </div>
                )}
              </Card>

              )}

              <Card step={soConfirmar ? '2' : '3'} title={t('checkout.step3')}>
                <div className={`grid gap-3 ${wallets.length === 1 ? 'grid-cols-1' : wallets.length > 3 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                  {wallets.map((w) => (
                    <WalletTab
                      key={w}
                      id={w}
                      active={method === w}
                      onClick={() => {
                        setMethod(w)
                        setPayError('')
                        track('method_select', { method: w })
                      }}
                      color={WALLETS[w].color}
                      kind={WALLETS[w].kind}
                      label={walletName(w)}
                      note={walletNote(w)}
                    />
                  ))}
                </div>
                {askHolder && (
                  <div className="pt-4">
                    <p className="mb-1.5 pl-1 text-xs font-medium text-white/60">{t('checkout.pay.holder')}</p>
                    <Input icon={UserIcon} placeholder={t('checkout.pay.holder')} value={holder} onChange={(e) => setHolder(e.target.value)} error={err('holder')} autoComplete="name" />
                    <p className="mt-1.5 pl-1 text-xs text-white/45">{t('checkout.pay.holderHint')}</p>
                  </div>
                )}
                <AnimatePresence mode="wait" initial={false}>
                  {kind === 'card' && (
                    <motion.div key="card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="grid grid-cols-2 gap-3 pt-4">
                        <Input icon={CreditCardIcon} inputMode="numeric" placeholder={t('checkout.card.number')} value={card.number} onChange={(e) => setCard((v) => ({ ...v, number: maskCard(e.target.value) }))} error={err('number')} autoComplete="cc-number" className="col-span-2" />
                        <Input icon={UserIcon} placeholder={t('checkout.card.holder')} value={card.name} onChange={(e) => setCard((v) => ({ ...v, name: e.target.value.toUpperCase() }))} error={err('cardName')} autoComplete="cc-name" className="col-span-2" />
                        <Input inputMode="numeric" placeholder={t('checkout.card.expiry')} value={card.expiry} onChange={(e) => setCard((v) => ({ ...v, expiry: maskExpiry(e.target.value) }))} error={err('expiry')} autoComplete="cc-exp" />
                        <Input inputMode="numeric" placeholder={t('checkout.card.cvv')} value={card.cvv} onChange={(e) => setCard((v) => ({ ...v, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} error={err('cvv')} autoComplete="cc-csc" />
                        <select value={card.installments} onChange={(e) => setCard((v) => ({ ...v, installments: e.target.value }))} className="field col-span-2 appearance-none [color-scheme:dark]">
                          {Array.from({ length: c.installments }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                              {n === 1 ? money(total) : t('checkout.card.installments', { n, value: money(total / n) })}
                            </option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}
                  {kind === 'redirect' && !live && (
                    <motion.div key="bank" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-4">
                      <div className="relative">
                        <BuildingLibraryIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                        <select value={bank} onChange={(e) => setBank(e.target.value)} className={`field appearance-none pl-12 [color-scheme:dark] ${err('bank') ? 'border-rose-400/70' : ''}`}>
                          <option value="">{t('checkout.errors.bank')}</option>
                          {c.banks.map((b) => (
                            <option key={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Ordem pensada para a oferta de amor: compatibilidade, pergunta à especialista, numerologia */}
              <Bump
                checked={bump}
                onChange={(v) => {
                  setBump(v)
                  track('bump_toggle', { item: 'bump', on: v })
                }}
              />
              {live && (
                <Bump
                  k="askBump"
                  pro={pro}
                  checked={askBump}
                  onChange={(v) => {
                    setAskBump(v)
                    track('bump_toggle', { item: 'askBump', on: v })
                  }}
                />
              )}
              <Bump
                k="numBump"
                checked={numBump}
                onChange={(v) => {
                  setNumBump(v)
                  track('bump_toggle', { item: 'numBump', on: v })
                }}
              />

              {payError && (
                <p className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  <ExclamationTriangleIcon className="h-5 w-5 shrink-0" /> {payError}
                </p>
              )}

              <button type="submit" disabled={stage === 'processing'} className="btn-gold w-full py-5 text-lg">
                {stage === 'processing' ? (
                  <>
                    <motion.span className="h-5 w-5 rounded-full border-2 border-night-950/30 border-t-night-950" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
                    {t('checkout.processing')}
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="h-5 w-5" />
                    {t('checkout.payCta', { total: money(total) })}
                  </>
                )}
              </button>
              {touched && Object.keys(errors).length > 0 && <p className="text-center text-sm text-rose-300">{t('checkout.fixErrors')}</p>}
              <p className="flex items-center justify-center gap-2 text-center text-xs text-white/40">
                <ShieldCheckIcon className="h-4 w-4 shrink-0" /> {t('checkout.footnote')}
              </p>
            </div>

            <aside className="order-1 lg:order-2 lg:sticky lg:top-6 lg:self-start">
              <div className="glass rounded-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/45">{t('checkout.summary')}</p>
                <div className="mt-5 flex gap-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gold-400/10 font-serif text-3xl text-gold-300 ring-1 ring-gold-400/30">
                    {signIdx != null ? SIGN_GLYPHS[signIdx] : '☉'}
                  </span>
                  <div>
                    <p className="font-semibold">{buyFor ? t('checkout.pay.productFor', { name: buyFor.name }) : t('checkout.product')}</p>
                    <p className="text-sm text-white/50">
                      {signIdx != null ? `${t(`signs.${SIGN_KEYS[signIdx]}.name`)} · ` : ''}
                      {t('checkout.pages')}
                    </p>
                  </div>
                </div>
                <ul className="mt-5 hidden space-y-2 text-sm text-white/65 lg:block">
                  {t('checkout.includes').map((x) => (
                    <li key={x} className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-gold-400" />{x}</li>
                  ))}
                </ul>
                <div className="mt-6 space-y-2 border-t border-white/10 pt-5 text-sm">
                  <Row label={t('checkout.lineMain')} value={<><s className="mr-2 text-white/35">{money(c.from)}</s>{money(base)}</>} />
                  <AnimatePresence>
                    {bump && (
                      <motion.div key="b" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Row label={t('checkout.lineBump')} value={money(c.bump)} />
                      </motion.div>
                    )}
                    {numBump && (
                      <motion.div key="nb" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Row label={t('checkout.lineNumBump')} value={money(c.numBump)} />
                      </motion.div>
                    )}
                    {askBump && (
                      <motion.div key="ab" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Row label={t('checkout.lineAskBump')} value={money(c.askDown)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold">
                    <span>{t('checkout.total')}</span>
                    <motion.span key={total} initial={{ scale: 1.2, color: '#f1dca8' }} animate={{ scale: 1, color: '#ffffff' }}>
                      {money(total)}
                    </motion.span>
                  </div>
                </div>
              </div>
              <div className="mt-4 hidden items-center gap-3 rounded-2xl border border-white/10 p-4 text-sm text-white/60 lg:flex">
                <ShieldCheckIcon className="h-8 w-8 shrink-0 text-gold-400" />
                {t('checkout.guarantee')}
              </div>
            </aside>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

function Card({ step, title, children }) {
  return (
    <section className="glass rounded-3xl p-6">
      <h2 className="mb-4 flex items-center gap-3 font-semibold">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-400 text-xs font-bold text-night-950">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Input({ icon: Icon, error, className = '', ...props }) {
  return (
    <div className={className}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />}
        <input {...props} className={`field ${Icon ? 'pl-12' : ''} ${error ? 'border-rose-400/70' : ''} disabled:opacity-40`} />
      </div>
      {error && <p className="mt-1 pl-1 text-xs text-rose-300">{error}</p>}
    </div>
  )
}

const PIX_PATH =
  'M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156'

export function PixLogo({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={PIX_PATH} />
    </svg>
  )
}

export function WalletTab({ id, active, onClick, color, label, note }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-2xl border p-4 text-left transition ${active ? 'border-gold-400 bg-gold-400/10' : 'border-white/10 hover:border-white/25'}`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: color }}>
        {id === 'pix' ? <PixLogo /> : id === 'whop' ? <CreditCardIcon className="h-5 w-5 text-night-950" /> : label.slice(0, 2)}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{label}</span>
        <span className="block truncate text-xs text-white/50">{note}</span>
      </span>
      {active && <CheckCircleIcon className="absolute right-2 top-2 h-5 w-5 text-gold-400" />}
    </button>
  )
}

function Bump({ k = 'bump', pro = null, checked, onChange }) {
  const { t, money, c } = useI18n()
  const price = k === 'bump' ? c.bump : k === 'askBump' ? c.askDown : c.numBump
  const from = k === 'bump' ? c.bumpFrom : k === 'askBump' ? c.ask[1] : c.numBumpFrom
  return (
    <motion.label
      animate={checked ? { scale: [1, 1.02, 1] } : {}}
      className={`block cursor-pointer rounded-3xl border-2 border-dashed p-5 transition ${checked ? 'border-gold-400 bg-gold-400/10' : 'border-gold-400/40 bg-gold-400/[0.03] hover:bg-gold-400/[0.06]'}`}
    >
      <div className="flex items-start gap-4">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition ${checked ? 'border-gold-400 bg-gold-400' : 'border-gold-400/60'}`}>
          {checked && <CheckIcon className="h-4 w-4 text-night-950" strokeWidth={3} />}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold-300">{t(`${k}.yes`)}</p>
          {k === 'askBump' && pro ? (
            <p className="mt-2 flex items-center gap-3">
              <ProAvatar pro={pro} size="h-11 w-11 text-lg" />
              <span>
                <span className="block font-semibold">{t('askBump.titlePro', { name: pro.name.split(' ')[0] })}</span>
                <span className="text-xs text-gold-300/90">{pro.role}</span>
              </span>
            </p>
          ) : (
            <p className="mt-1 font-semibold">{t(`${k}.title`)}</p>
          )}
          <p className="mt-1 text-sm text-white/60">{k === 'askBump' && pro ? t('askBump.textPro', { name: pro.name.split(' ')[0] }) : t(`${k}.text`)}</p>
          <p className="mt-2 text-sm">
            <s className="text-white/40">{money(from)}</s>
            <span className="ml-2 font-semibold text-gold-300">+ {money(price)}</span>
          </p>
        </div>
      </div>
    </motion.label>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-white/70">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

// Telas de pagamento pendente por tipo de carteira (demonstração — sem gateway real)
function Pending({ kind, method, total, email, phone, bank, onPaid, onBack }) {
  const { t, money, walletName } = useI18n()
  const [copied, setCopied] = useState(false)
  const wallet = walletName(method)
  const color = WALLETS[method].color
  const ref = useMemo(() => String(Math.floor(1e13 + Math.random() * 9e13)), [])
  const code = `DEMO-CEUNATAL-${method.toUpperCase()}-${ref}-${total}`

  const copy = (text) => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  let body
  if (kind === 'qr') {
    body = (
      <>
        <h2 className="font-serif text-4xl font-semibold">{t('checkout.pending.qrTitle')}</h2>
        <p className="mt-2 text-white/60">{t('checkout.pending.qrText', { wallet })}</p>
        <div className="mx-auto mt-8 w-64 rounded-3xl bg-white p-5" style={{ boxShadow: `0 0 60px -10px ${color}` }}>
          <FakeQR seed={ref} />
        </div>
        <CopyButton copied={copied} onClick={() => copy(code)} label={t('checkout.pending.copy')} done={t('checkout.pending.copied')} />
      </>
    )
  } else if (kind === 'voucher') {
    body = (
      <>
        <h2 className="font-serif text-4xl font-semibold">{t('checkout.pending.voucherTitle')}</h2>
        <p className="mt-2 text-white/60">{t('checkout.pending.voucherText', { wallet })}</p>
        <div className="mt-8 rounded-3xl bg-white p-6 text-night-950">
          <p className="text-xs uppercase tracking-widest text-night-950/50">{t('checkout.pending.reference')}</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wider">{ref.replace(/(\d{4})(?=\d)/g, '$1 ')}</p>
          <div className="mt-4 flex h-14 items-stretch justify-between">
            {ref.split('').concat(ref.split('')).map((d, i) => (
              <span key={i} className="bg-night-950" style={{ width: `${(Number(d) % 3) + 1}px` }} />
            ))}
          </div>
        </div>
        <CopyButton copied={copied} onClick={() => copy(ref)} label={t('checkout.pending.copy')} done={t('checkout.pending.copied')} />
      </>
    )
  } else if (kind === 'transfer') {
    const clabe = `646180${ref.slice(0, 12)}`
    body = (
      <>
        <h2 className="font-serif text-4xl font-semibold">{t('checkout.pending.transferTitle')}</h2>
        <p className="mt-2 text-white/60">{t('checkout.pending.transferText')}</p>
        <dl className="glass mt-8 divide-y divide-white/10 rounded-3xl text-left">
          {[
            [t('checkout.pending.clabe'), clabe],
            [t('checkout.pending.beneficiary'), 'Céu Natal'],
            [t('checkout.pending.reference'), ref.slice(0, 7)],
            [t('checkout.pending.amount'), money(total)],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between px-5 py-4">
              <dt className="text-sm text-white/50">{k}</dt>
              <dd className="font-mono font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <CopyButton copied={copied} onClick={() => copy(clabe)} label={t('checkout.pending.copy')} done={t('checkout.pending.copied')} />
      </>
    )
  } else if (kind === 'push') {
    body = (
      <>
        <motion.div
          className="mx-auto grid h-28 w-28 place-items-center rounded-full"
          style={{ background: `${color}22`, boxShadow: `0 0 0 0 ${color}` }}
          animate={{ boxShadow: [`0 0 0 0 ${color}55`, `0 0 0 24px ${color}00`] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        >
          <DevicePhoneMobileIcon className="h-12 w-12" style={{ color }} />
        </motion.div>
        <h2 className="mt-8 font-serif text-4xl font-semibold">{t('checkout.pending.pushTitle')}</h2>
        <p className="mt-2 text-white/60">{t('checkout.pending.pushText', { wallet, phone })}</p>
      </>
    )
  } else {
    body = (
      <>
        <motion.span
          className="mx-auto block h-16 w-16 rounded-full border-4 border-white/10"
          style={{ borderTopColor: color }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
        <h2 className="mt-8 font-serif text-4xl font-semibold">{t('checkout.pending.redirectTitle')}</h2>
        <p className="mt-2 text-white/60">{t('checkout.pending.redirectText', { bank })}</p>
      </>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-md px-5 py-12 text-center">
      {body}
      <p className="mt-6 font-serif text-3xl font-semibold text-gradient-gold">{money(total)}</p>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white/55">
        <motion.span className="h-2 w-2 shrink-0 rounded-full bg-gold-400" animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} />
        {t('checkout.pending.waiting', { email })}
      </div>
      <button onClick={onPaid} className="btn-gold mt-8 w-full">{t('checkout.pending.simulate')}</button>
      <button onClick={onBack} className="mt-4 text-sm text-white/45 hover:text-white">{t('checkout.pending.change')}</button>
    </motion.div>
  )
}

// Tela de pagamento real: mostra o que a HotTrack devolveu e confirma sozinha quando o pagamento cai
export function LivePending({ order, holder, onPaid, onBack }) {
  const { t, money, walletName, c } = useI18n()
  const [o, setO] = useState(order)
  const [copied, setCopied] = useState('')
  const [qr, setQr] = useState('')
  const done = useRef(false)
  const paidRef = useRef(onPaid)
  useEffect(() => {
    paidRef.current = onPaid
  })
  const pay = o.payment || {}
  const ins = pay.instructions || {}
  const wallet = walletName(o.wallet)
  const color = WALLETS[o.wallet]?.color || '#e2c27d'
  const code = ins.copy_paste || ''

  useEffect(() => {
    if (!code) return
    QRCode.toDataURL(code, { margin: 1, width: 480 }).then(setQr).catch(() => {})
  }, [code])

  useEffect(() => {
    let stop = false
    const tick = async () => {
      try {
        const r = await fetch(`/api/pedido/${o.id}`)
        if (!r.ok || stop) return
        const d = await r.json()
        setO((x) => ({ ...x, ...d }))
        if (d.status === 'paid' && !done.current) {
          done.current = true
          paidRef.current()
        }
      } catch {}
    }
    tick()
    const iv = setInterval(tick, 3000)
    return () => {
      stop = true
      clearInterval(iv)
    }
  }, [o.id])

  const copy = (text, what = 'code') => {
    navigator.clipboard?.writeText(text)
    setCopied(what)
    track('code_copy', { method: o.wallet, what })
    setTimeout(() => setCopied(''), 2000)
  }

  const simulate = async () => {
    const r = await fetch(`/api/pedido/${o.id}/simular-pago`, { method: 'POST' })
    if (r.ok && !done.current) {
      done.current = true
      onPaid()
    }
  }

  const rows = (list) => (
    <dl className="glass mt-8 divide-y divide-white/10 rounded-3xl text-left">
      {list
        .filter(([, v]) => v)
        .map(([k, v, copyable]) => (
          <div key={k} className="flex items-center justify-between gap-3 px-5 py-4">
            <dt className="shrink-0 text-sm text-white/50">{k}</dt>
            <dd className="flex min-w-0 items-center gap-2 font-mono font-semibold">
              <span className="truncate">{v}</span>
              {copyable && (
                <button type="button" onClick={() => copy(String(v).replace(/\s/g, ''), k)} className="shrink-0 text-white/50 hover:text-white" aria-label={t('checkout.pending.copy')}>
                  {copied === k ? <CheckIcon className="h-5 w-5 text-emerald-300" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
                </button>
              )}
            </dd>
          </div>
        ))}
    </dl>
  )

  let body
  if (o.status === 'expired') {
    body = (
      <>
        <ClockIcon className="mx-auto h-14 w-14 text-white/40" />
        <h2 className="mt-6 font-serif text-4xl font-semibold">{t('checkout.pay.expiredTitle')}</h2>
        <p className="mt-2 text-white/60">{t('checkout.pay.expiredText')}</p>
        <button type="button" onClick={onBack} className="btn-gold mt-8 w-full">{t('checkout.pay.newCharge')}</button>
      </>
    )
  } else if (pay.kind === 'bank_transfer') {
    const account = ins.clabe || ins.cvu
    body = (
      <>
        <h2 className="font-serif text-4xl font-semibold">{t('checkout.pending.transferTitle')}</h2>
        <p className="mt-2 text-white/60">{t('checkout.pay.exact')}</p>
        {rows([
          [ins.clabe ? t('checkout.pending.clabe') : 'CVU', account, true],
          [t('checkout.pending.beneficiary'), ins.beneficiary],
          [t('checkout.pay.bank'), ins.bank_name],
          [t('checkout.pending.amount'), money(o.total), false],
        ])}
        <CopyButton copied={copied === 'main'} onClick={() => copy(account, 'main')} label={t('checkout.pending.copy')} done={t('checkout.pending.copied')} />
        {ins.cvu && holder && <p className="mt-4 rounded-xl bg-gold-400/10 px-4 py-3 text-sm text-gold-200">{t('checkout.pay.fromHolder', { name: holder })}</p>}
      </>
    )
  } else if (pay.kind === 'reference' || pay.kind === 'barcode') {
    const ref = ins.reference || ins.barcode || ''
    body = (
      <>
        <h2 className="font-serif text-4xl font-semibold">{t('checkout.pending.voucherTitle')}</h2>
        <p className="mt-2 text-white/60">{t('checkout.pending.voucherText', { wallet })}</p>
        <div className="mt-8 rounded-3xl bg-white p-6 text-night-950">
          <p className="text-xs uppercase tracking-widest text-night-950/50">{t('checkout.pending.reference')}</p>
          <p className="mt-1 break-all font-mono text-2xl font-bold tracking-wider">{ref.replace(/(\d{4})(?=\d)/g, '$1 ')}</p>
          {ins.barcode_url && <img src={ins.barcode_url} alt="" className="mt-4 w-full" />}
        </div>
        <CopyButton copied={copied === 'main'} onClick={() => copy(ref, 'main')} label={t('checkout.pending.copy')} done={t('checkout.pending.copied')} />
      </>
    )
  } else if (pay.kind === 'redirect' && ins.checkout_url) {
    body = (
      <>
        <h2 className="font-serif text-4xl font-semibold">{t(o.wallet === 'whop' ? 'checkout.pay.cardTitle' : 'checkout.pay.redirectTitle', { wallet })}</h2>
        <p className="mt-2 text-white/60">{t(o.wallet === 'whop' ? 'checkout.pay.cardText' : 'checkout.pay.redirectText', { wallet })}</p>
        <a href={ins.checkout_url} rel="noopener" onClick={() => track('redirect_open', { method: o.wallet })} className="btn-gold mt-8 w-full">
          {t('checkout.pay.open')} <ArrowTopRightOnSquareIcon className="h-5 w-5" />
        </a>
      </>
    )
  } else if (code || ins.qr_code || ins.llave) {
    body = (
      <>
        {o.wallet === 'pix' && <PixLogo className="mx-auto mb-3 h-10 w-10 text-[#32BCAD]" />}
        <h2 className="font-serif text-4xl font-semibold">{t('checkout.pending.qrTitle')}</h2>
        <p className="mt-2 text-white/60">{t(code && c.currency === 'BRL' ? 'checkout.pay.pixText' : 'checkout.pending.qrText', { wallet })}</p>
        {ins.llave && rows([[t('checkout.pay.key'), ins.llave, true], [t('checkout.pay.bank'), ins.bank_name], [t('checkout.pending.amount'), money(o.total)]])}
        {code && <CopyButton primary copied={copied === 'main'} onClick={() => copy(code, 'main')} label={t('checkout.pending.copy')} done={t('checkout.pending.copied')} />}
        {(qr || ins.qr_code) && (
          <div className="mx-auto mt-6 w-60 rounded-3xl bg-white p-4" style={{ boxShadow: `0 0 60px -10px ${color}` }}>
            <img src={qr || ins.qr_code} alt="QR" className="w-full" />
          </div>
        )}
      </>
    )
  } else {
    body = (
      <>
        <motion.span className="mx-auto block h-14 w-14 rounded-full border-4 border-white/10" style={{ borderTopColor: color }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} />
        <h2 className="mt-8 font-serif text-3xl font-semibold">{t('checkout.pay.preparing')}</h2>
      </>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-md px-5 py-12 text-center">
      {body}
      {o.status !== 'expired' && (
        <>
          <p className="mt-6 font-serif text-3xl font-semibold text-gradient-gold">{money(o.total)}</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white/55">
            <motion.span className="h-2 w-2 shrink-0 rounded-full bg-gold-400" animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} />
            {t('checkout.pay.waiting')}
          </div>
          {o.simulado && (
            <button type="button" onClick={simulate} className="glass mt-8 w-full rounded-2xl px-4 py-3 text-sm text-white/70 hover:text-white">
              {t('checkout.pending.simulate')}
            </button>
          )}
          <button type="button" onClick={onBack} className="mt-4 text-sm text-white/45 hover:text-white">{t('checkout.pending.change')}</button>
        </>
      )}
    </motion.div>
  )
}

function CopyButton({ copied, onClick, label, done, primary }) {
  return (
    <button type="button" onClick={onClick} className={primary ? 'btn-gold mt-6 w-full py-5 text-lg' : 'glass mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 font-medium transition hover:bg-white/10'}>
      {copied ? <CheckIcon className="h-5 w-5 text-emerald-300" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
      {copied ? done : label}
    </button>
  )
}

// QR ilustrativo: ruído determinístico + os 3 marcadores de canto
function FakeQR({ seed }) {
  const cells = useMemo(() => {
    let s = Number(seed.slice(0, 9)) || 7
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647
    const corners = [[0, 0], [0, 18], [18, 0]]
    return Array.from({ length: 625 }, (_, i) => {
      const r = Math.floor(i / 25)
      const col = i % 25
      for (const [fr, fc] of corners) {
        const y = r - fr
        const x = col - fc
        if (y >= -1 && y <= 7 && x >= -1 && x <= 7) {
          if (y < 0 || x < 0 || y > 6 || x > 6) return false
          return y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4)
        }
      }
      return rand() > 0.52
    })
  }, [seed])
  return (
    <div className="grid grid-cols-[repeat(25,1fr)]">
      {cells.map((on, i) => (
        <span key={i} className={`aspect-square ${on ? 'bg-night-950' : ''}`} />
      ))}
    </div>
  )
}

function perfilDoPedido(x) {
  return {
    id: x.id,
    name: x.name,
    relation: x.relation,
    birthDate: x.birthDate,
    birthTime: x.birthTime,
    unknownTime: x.unknownTime,
    place: x.place && { name: x.place.name, lat: x.place.lat, lon: x.place.lon, tz: x.place.tz },
  }
}
