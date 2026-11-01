import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Starfield } from './components/Sky'
import Intro from './components/Intro'
import Quiz from './components/Quiz'
import Analyzing from './components/Analyzing'
import SalesPage from './components/SalesPage'
import Checkout from './components/Checkout'
import Success from './components/Success'
import Volta from './components/Volta'
import PosCompra from './components/PosCompra'
import ProsArea from './components/pros/ProsArea'
import AvaliacoesPage from './components/AvaliacoesPage'
import ProCadastro from './components/pros/ProCadastro'
import Login from './components/Login'
import { addOrder, currentAccount, login as loginAccount, logout, saveAccount } from './lib/account'
import { COUNTRIES, detectCountry, I18nProvider } from './i18n'
import { sendLead, setTrackContext, track } from './lib/track'

const SCREEN_EVENTS = { quiz: 'quiz_start', login: 'login', offer: 'offer_view', checkout: 'checkout_view', success: 'paid_view' }

const EMPTY = {
  gender: '',
  focus: 'amor',
  situation: '',
  agree1: '',
  agree2: '',
  experience: '',
  name: '',
  birthDate: '',
  birthTime: '',
  unknownTime: false,
  place: null,
  palm: null,
  email: '',
  phone: '',
  consent: false,
}

const SCREENS = ['intro', 'login', 'quiz', 'analyzing', 'offer', 'checkout', 'success', 'volta', 'pros', 'avaliacoes', 'especialista']

// Campanhas: ?f=amor|dinheiro|carreira|espiritual já define a dor do lead
const FOCUSES = ['amor', 'dinheiro', 'carreira', 'espiritual']
const URL_FOCUS = (() => {
  const f = new URLSearchParams(window.location.search).get('f')
  return FOCUSES.includes(f) ? f : null
})()

function screenFromHash() {
  const h = window.location.hash.replace('#/', '')
  return SCREENS.includes(h) ? h : 'intro'
}

export default function App() {
  const [screen, setScreen] = useState(screenFromHash)
  const [country, setCountry] = useState(detectCountry)
  const [data, setData] = useState(() => {
    try {
      const daSessao = JSON.parse(sessionStorage.getItem('ceu-natal') || '{}')
      // Aba nova ou volta depois: os dados do quiz ficam na conta salva no aparelho
      const daConta = currentAccount()?.data || {}
      const saved = { ...EMPTY, ...daConta, ...Object.fromEntries(Object.entries(daSessao).filter(([, v]) => v !== '' && v != null)) }
      // Oferta focada em amor (é o que mais recebe clique); ?f= da campanha ainda manda
      return { ...saved, focus: URL_FOCUS || 'amor' }
    } catch {
      return EMPTY
    }
  })
  const [order, setOrder] = useState(null)
  const [account, setAccount] = useState(currentAccount)
  // Perfil para quem o mapa está sendo comprado (null = o próprio comprador)
  const [buyFor, setBuyFor] = useState(null)
  // '' = preço normal; 'back' = desconto oferecido a quem tentou sair da oferta
  const [offer, setOffer] = useState(() => sessionStorage.getItem('ceu-natal-oferta') || '')

  useEffect(() => {
    sessionStorage.setItem('ceu-natal', JSON.stringify(data))
  }, [data])

  useEffect(() => {
    setTrackContext({ country, focus: data.focus })
  }, [country, data.focus])

  useEffect(() => {
    track('view', { screen })
  }, [])

  useEffect(() => {
    if (screen === 'checkout') {
      const c = COUNTRIES[country]
      track('checkout_view', { value: offer === 'back' ? c.back : c.price, currency: c.currency })
    } else if (SCREEN_EVENTS[screen]) track(SCREEN_EVENTS[screen])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  useEffect(() => {
    localStorage.setItem('ceu-natal-country', country)
    document.documentElement.lang = COUNTRIES[country].locale
  }, [country])

  useEffect(() => {
    const onHash = () => setScreen(screenFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = useCallback((s) => {
    window.location.hash = `/${s}`
    setScreen(s)
    window.scrollTo({ top: 0 })
  }, [])

  const toOffer = useCallback(() => go('offer'), [go])

  // Até onde a pessoa rolou a oferta (25/50/75/100%): diz se ela chegou a ver o preço
  useEffect(() => {
    if (screen !== 'offer') return
    const vistos = new Set()
    const onScroll = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight
      const pct = alto > 0 ? (window.scrollY / alto) * 100 : 100
      for (const marco of [25, 50, 75, 100]) {
        if (pct >= marco - 2 && !vistos.has(marco)) {
          vistos.add(marco)
          track('offer_scroll', { pct: marco })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [screen])

  // Back redirect: na primeira vez na oferta, o "voltar" do navegador cai na tela de desconto
  useEffect(() => {
    if (screen !== 'offer' || offer || sessionStorage.getItem('ceu-natal-volta')) return
    sessionStorage.setItem('ceu-natal-volta', '1')
    history.replaceState(null, '', '#/volta')
    history.pushState(null, '', '#/offer')
  }, [screen, offer])

  return (
    <I18nProvider country={country} gender={data.gender || 'f'}>
      <Starfield />
      <AnimatePresence mode="wait">
        <motion.main key={screen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          {screen === 'intro' && (
            <Intro focus={URL_FOCUS || data.focus} onStart={() => go('quiz')} onSkip={toOffer} onCountry={setCountry} onLogin={() => (account ? toOffer() : go('login'))} />
          )}
          {screen === 'login' && (
            <Login
              onBack={() => go('intro')}
              onStart={() => go('quiz')}
              onLogin={(acc) => {
                loginAccount(acc)
                setAccount(acc)
                setData({ ...EMPTY, ...acc.data })
                if (acc.country) setCountry(acc.country)
                toOffer()
              }}
            />
          )}
          {screen === 'quiz' && (
            <Quiz focusLocked={!!URL_FOCUS} data={data} setData={setData} onDone={() => {
                // O quiz não tem mais caixa de aceite: o aviso está no texto da tela de contato
                const lead = { ...data, consent: true }
                setData(lead)
                setAccount(saveAccount(lead, country))
                sendLead({ ...lead, phone: `${COUNTRIES[country].phone.code} ${data.phone}` }, country)
                track('signup')
                go('analyzing')
              }}
            />
          )}
          {screen === 'analyzing' && <Analyzing name={data.name} hasPalm={!!data.palm} onDone={toOffer} />}
          {screen === 'offer' && (
            <SalesPage
              data={data}
              account={account}
              onBuy={(profile) => {
                setBuyFor(profile || null)
                go('checkout')
              }}
              onCountry={setCountry}
              onLogout={() => {
                logout()
                setAccount(null)
                setData(EMPTY)
                go('intro')
              }}
            />
          )}
          {screen === 'checkout' && (
            <Checkout
              key={country}
              offer={offer}
              buyFor={buyFor}
              data={data}
              setData={setData}
              onBack={toOffer}
              onPaid={(o) => {
                setOrder(o)
                addOrder({ ...o, profileId: buyFor?.id })
                setAccount(currentAccount())
                go('success')
              }}
            />
          )}
          {screen === 'success' && (
            <PosCompra data={data} order={order} profiles={account?.profiles || []}>
              <Success data={data} order={order || { total: COUNTRIES[country].price }} />
            </PosCompra>
          )}
          {screen === 'volta' && (
            <Volta
              name={data.name}
              onAccept={() => {
                sessionStorage.setItem('ceu-natal-oferta', 'back')
                setOffer('back')
                setBuyFor(null)
                go('checkout')
              }}
              onDecline={() => go('intro')}
            />
          )}
          {screen === 'pros' && <ProsArea data={data} profiles={account?.profiles || []} />}
          {screen === 'avaliacoes' && <AvaliacoesPage onBack={() => window.history.back()} />}
          {screen === 'especialista' && <ProCadastro onBack={() => window.history.back()} />}
        </motion.main>
      </AnimatePresence>
    </I18nProvider>
  )
}
