import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '../i18n'
import { track } from '../lib/track'
import QuickPay from './pros/QuickPay'
import { AskForm, ProAvatar } from './pros/ProsArea'
import { useEspecialistas } from '../lib/pros'
import ReviewForm from './ReviewForm'

// Pós-compra do mapa: upsell (3 perguntas com desconto) → se recusar, downsell (1 pergunta) →
// depois de pagar, já abre o formulário das perguntas. Ao final (ou recusando tudo) mostra `children`.
export default function PosCompra({ data, order = null, profiles = [], children }) {
  const { t, money, c } = useI18n()
  const [step, setStep] = useState(() => (sessionStorage.getItem('ceu-natal-poscompra') === 'fim' ? 'done' : 'up'))
  // Quem levou a pergunta no checkout (askBump) já escreve a pergunta e pula o upsell
  const [paid, setPaid] = useState(() => (order?.askBump && order.orderId && sessionStorage.getItem('ceu-natal-poscompra') !== 'fim' ? { id: order.orderId, pack: 1 } : null))
  const [paying, setPaying] = useState(false)
  const pros = useEspecialistas()
  const pro = pros[0]
  const p = pro
  const first = (data.name || '').trim().split(/\s+/)[0]

  const finish = () => {
    sessionStorage.setItem('ceu-natal-poscompra', 'fim')
    setStep('done')
    window.scrollTo({ top: 0 })
  }

  if (step === 'done') {
    return (
      <>
        {children}
        <div className="mx-auto max-w-md px-5 pb-16">
          <ReviewForm />
        </div>
      </>
    )
  }

  const offer = step === 'up' ? { pack: 3, offer: 'up', price: c.askUp, from: c.ask[3] } : { pack: 1, offer: 'down', price: c.askDown, from: c.ask[1] }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={step + (paid ? '-ask' : '')} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-md px-5 py-10">
        {paid ? (
          <AskForm pro={pro} p={p} orderId={paid.id} left={paid.pack} profiles={profiles} onSent={finish} />
        ) : (
          <>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-gold-400">{t('upsell.eyebrow')}</p>
            <h2 className="mt-3 text-center font-serif text-3xl font-semibold leading-tight">
              {step === 'up' ? t('upsell.title', { name: first }) : t('upsell.downTitle')}
            </h2>
            <div className="glass mt-6 flex items-center gap-4 rounded-3xl p-4">
              <ProAvatar pro={pro} />
              <div>
                <p className="font-semibold">{p.name} · <span className="text-gold-300/90">{p.role}</span></p>
                <p className="text-sm text-white/55">{p.bio}</p>
              </div>
            </div>
            <p className="mt-5 text-white/70">{step === 'up' ? t('upsell.text') : t('upsell.downText')}</p>
            <p className="mt-5 text-center">
              <s className="mr-2 text-white/40">{t('upsell.from', { value: money(offer.from) })}</s>
              <span className="font-serif text-4xl font-semibold text-gold-300">{money(offer.price)}</span>
            </p>
            <div className="mt-6">
              {paying ? (
                <QuickPay
                  data={data}
                  pack={offer.pack}
                  offer={offer.offer}
                  cta={t(step === 'up' ? 'upsell.cta' : 'upsell.downCta', { value: money(offer.price) })}
                  onPaid={(o) => setPaid({ id: o.id, pack: offer.pack })}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    track('upsell_accept', { step })
                    setPaying(true)
                  }}
                  className="btn-gold w-full py-5 text-lg"
                >
                  {t(step === 'up' ? 'upsell.cta' : 'upsell.downCta', { value: money(offer.price) })}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                track('upsell_decline', { step })
                setPaying(false)
                if (step === 'up') setStep('down')
                else finish()
              }}
              className="mt-5 block w-full text-center text-sm text-white/45 hover:text-white"
            >
              {step === 'up' ? t('upsell.no') : t('upsell.downNo')}
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
