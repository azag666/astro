import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Starfield } from './components/Sky'
import Intro from './components/Intro'
import Quiz from './components/Quiz'
import Analyzing from './components/Analyzing'
import SalesPage from './components/SalesPage'
import Checkout from './components/Checkout'
import Success from './components/Success'
import Login from './components/Login'
import { addOrder, currentAccount, login as loginAccount, logout, saveAccount } from './lib/account'
import { COUNTRIES, detectCountry, I18nProvider } from './i18n'
import { sendLead, setTrackContext, track } from './lib/track'

const SCREEN_EVENTS = { quiz: 'quiz_start', login: 'login', offer: 'offer_view', checkout: 'checkout_view', success: 'paid_view' }

const EMPTY = {
  gender: '',
  focus: '',
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

const SCREENS = ['intro', 'login', 'quiz', 'analyzing', 'offer', 'checkout', 'success']

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
      const saved = { ...EMPTY, ...JSON.parse(sessionStorage.getItem('ceu-natal') || '{}') }
      return URL_FOCUS ? { ...saved, focus: URL_FOCUS } : saved
    } catch {
      return EMPTY
    }
  })
  const [order, setOrder] = useState(null)
  const [account, setAccount] = useState(currentAccount)

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
    if (SCREEN_EVENTS[screen]) track(SCREEN_EVENTS[screen])
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

  return (
    <I18nProvider country={country} gender={data.gender}>
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
                setAccount(saveAccount(data, country))
                sendLead({ ...data, phone: `${COUNTRIES[country].phone.code} ${data.phone}` }, country)
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
              onBuy={() => go('checkout')}
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
              data={data}
              setData={setData}
              onBack={toOffer}
              onPaid={(o) => {
                setOrder(o)
                addOrder(o)
                setAccount(currentAccount())
                go('success')
              }}
            />
          )}
          {screen === 'success' && <Success data={data} order={order || { total: COUNTRIES[country].price }} />}
        </motion.main>
      </AnimatePresence>
    </I18nProvider>
  )
}
