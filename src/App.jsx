import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Starfield } from './components/Sky'
import Intro from './components/Intro'
import Quiz from './components/Quiz'
import Analyzing from './components/Analyzing'
import SalesPage from './components/SalesPage'
import Checkout from './components/Checkout'
import Success from './components/Success'
import { COUNTRIES, detectCountry, I18nProvider } from './i18n'

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
}

const SCREENS = ['intro', 'quiz', 'analyzing', 'offer', 'checkout', 'success']

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

  useEffect(() => {
    sessionStorage.setItem('ceu-natal', JSON.stringify(data))
  }, [data])

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
          {screen === 'intro' && <Intro focus={URL_FOCUS || data.focus} onStart={() => go('quiz')} onSkip={toOffer} onCountry={setCountry} />}
          {screen === 'quiz' && <Quiz focusLocked={!!URL_FOCUS} data={data} setData={setData} onDone={() => go('analyzing')} />}
          {screen === 'analyzing' && <Analyzing name={data.name} hasPalm={!!data.palm} onDone={toOffer} />}
          {screen === 'offer' && <SalesPage data={data} onBuy={() => go('checkout')} onCountry={setCountry} />}
          {screen === 'checkout' && (
            <Checkout
              key={country}
              data={data}
              setData={setData}
              onBack={toOffer}
              onPaid={(o) => {
                setOrder(o)
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
