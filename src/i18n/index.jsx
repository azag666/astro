import { createContext, useContext, useEffect, useMemo } from 'react'
import pt from './pt'
import es from './es'
import esAR from './es-ar'
import zh from './zh'
import extraPt from './extra-pt'
import extraEs from './extra-es'
import extraEsAR from './extra-es-ar'
import extraZh from './extra-zh'
import extra2Pt from './extra2-pt'
import extra2Es from './extra2-es'
import extra2EsAR from './extra2-es-ar'
import extra2Zh from './extra2-zh'
import pagamento from './pagamento'
import ofertas from './ofertas'
import extra3Pt from './extra3-pt'
import extra3Es from './extra3-es'
import extra3EsAR from './extra3-es-ar'
import extra3Zh from './extra3-zh'

export { WALLETS, COUNTRIES } from './paises.js'
import { COUNTRIES, WALLETS } from './paises.js'

const DICTS = {
  pt: [extraPt, extra2Pt, extra3Pt, pagamento.pt, ofertas.pt].reduce(merge, pt),
  es: [extraEs, extra2Es, extra3Es, pagamento.es, ofertas.es].reduce(merge, es),
  zh: [extraZh, extra2Zh, extra3Zh, pagamento.zh, ofertas.zh].reduce(merge, zh),
}

function merge(base, over) {
  if (!over) return base
  const out = Array.isArray(base) ? [...base] : { ...base }
  for (const [k, v] of Object.entries(over)) {
    const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x)
    out[k] = isObj(v) && isObj(base[k]) ? merge(base[k], v) : v
  }
  return out
}

// Detecta o país: ?c=mx na URL (para anúncios por país) > escolha salva > IP (Cloudflare) > fuso horário > idioma do navegador.
export function detectCountry() {
  const param = new URLSearchParams(window.location.search).get('c')
  if (param && COUNTRIES[param]) return param
  const saved = localStorage.getItem('ceu-natal-country')
  if (saved && COUNTRIES[saved]) return saved
  if (window.__PAIS_IP && COUNTRIES[window.__PAIS_IP]) return window.__PAIS_IP
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  if (tz.startsWith('America/Argentina') || tz === 'America/Buenos_Aires') return 'ar'
  if (tz === 'America/Bogota') return 'co'
  if (tz === 'America/Santiago' || tz === 'America/Punta_Arenas') return 'cl'
  if (/America\/(Mexico_City|Cancun|Merida|Monterrey|Tijuana|Chihuahua|Hermosillo|Mazatlan)/.test(tz)) return 'mx'
  if (/Asia\/(Shanghai|Chongqing|Harbin|Urumqi)/.test(tz)) return 'cn'
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('zh')) return 'cn'
  if (lang === 'es-mx') return 'mx'
  if (lang === 'es-co') return 'co'
  if (lang === 'es-cl') return 'cl'
  if (lang === 'es-ar') return 'ar'
  if (lang.startsWith('es')) return 'mx'
  return 'br'
}

const I18n = createContext(null)

export function I18nProvider({ country, gender, children }) {
  const value = useMemo(() => {
    const c = COUNTRIES[country]
    const dict = c.variant === 'ar' ? [esAR, extraEsAR, extra2EsAR, extra3EsAR, pagamento.esAR, ofertas.esAR].reduce(merge, DICTS.es) : DICTS[c.lang]
    const money = new Intl.NumberFormat(c.locale, {
      style: 'currency',
      currency: c.currency,
      minimumFractionDigits: c.decimals,
      maximumFractionDigits: c.decimals,
    })

    const fill = (str, vars = {}) =>
      str
        .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, m, f) => (gender === 'm' ? m : gender === 'f' ? f : `${m}(${f})`))
        .replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`))

    const t = (path, vars) => {
      const v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), dict)
      if (v == null) return path
      return deep(v, vars)
    }
    // Variante por foco: 'a.b' tenta 'a.bByFocus.<foco>' e cai em 'a.b'
    const tf = (path, focus, vars) => {
      const k = `${path}ByFocus.${focus}`
      const v = t(k, vars)
      return v === k ? t(path, vars) : v
    }
    const deep = (v, vars) =>
      typeof v === 'string'
        ? fill(v, vars)
        : Array.isArray(v)
          ? v.map((x) => deep(x, vars))
          : v && typeof v === 'object'
            ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x, vars)]))
            : v

    const walletName = (id) => {
      const n = WALLETS[id].name
      return typeof n === 'string' ? n : n[c.lang]
    }
    const walletNote = (id) => {
      const n = WALLETS[id].note
      return n[c.variant === 'ar' ? 'es' : c.lang] || n.es || n.pt || ''
    }

    return {
      country,
      c,
      lang: c.lang,
      t,
      tf,
      fill,
      dict,
      money: (n) => money.format(n),
      walletName,
      walletNote,
      monthName: new Date().toLocaleDateString(c.locale, { month: 'long' }),
    }
  }, [country, gender])

  // Título da aba no idioma da página
  const titulo = value.t('meta.title')
  useEffect(() => {
    if (titulo !== 'meta.title') document.title = titulo
  }, [titulo])

  return <I18n.Provider value={value}>{children}</I18n.Provider>
}

export const useI18n = () => useContext(I18n)
