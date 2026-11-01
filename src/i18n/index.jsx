import { createContext, useContext, useMemo } from 'react'
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

// kind: como o pagamento é concluído — card | qr | voucher | transfer | push | redirect
export const WALLETS = {
  pix: { name: 'Pix', kind: 'qr', color: '#32BCAD', note: { pt: 'Aprovação na hora' } },
  card: { name: { pt: 'Cartão', es: 'Tarjeta', zh: '银行卡' }, kind: 'card', color: '#e2c27d', note: { pt: 'Até 3x sem juros', es: 'Crédito o débito', zh: '信用卡 / 借记卡' } },
  mercadopago: { name: 'Mercado Pago', kind: 'qr', color: '#00B1EA', note: { pt: 'Saldo ou cartão salvo', es: 'Dinero en cuenta o tarjeta guardada' } },
  oxxo: { name: 'OXXO', kind: 'voucher', color: '#E31B23', note: { es: 'Paga en efectivo en tienda' } },
  spei: { name: 'SPEI', kind: 'transfer', color: '#0F6CBD', note: { es: 'Transferencia bancaria' } },
  nequi: { name: 'Nequi', kind: 'push', color: '#DA0081', note: { es: 'Aprueba en tu app' } },
  daviplata: { name: 'Daviplata', kind: 'push', color: '#ED1C24', note: { es: 'Aprueba en tu app' } },
  pse: { name: 'PSE', kind: 'redirect', color: '#1F4E9C', note: { es: 'Débito desde tu banco' } },
  modo: { name: 'MODO', kind: 'qr', color: '#4B2BD8', note: { es: 'Pagá con la app de tu banco' } },
  alipay: { name: '支付宝', kind: 'qr', color: '#1677FF', note: { zh: '扫码支付' } },
  wechat: { name: '微信支付', kind: 'qr', color: '#07C160', note: { zh: '扫码支付' } },
  unionpay: { name: '云闪付', kind: 'qr', color: '#E21836', note: { zh: '银联扫码' } },
}

export const COUNTRIES = {
  br: {
    name: 'Brasil', flag: 'BR', lang: 'pt', locale: 'pt-BR', currency: 'BRL', decimals: 2,
    price: 27.9, numBump: 19.9, numBumpFrom: 57.9, from: 97.9, bump: 17.9, bumpFrom: 67.9, bonus: [47, 37], installments: 3,
    phone: { code: '+55', min: 10, max: 11, placeholder: '(11) 99999-9999' },
    wallets: ['pix', 'card', 'mercadopago'],
    banks: [],
  },
  mx: {
    name: 'México', flag: 'MX', lang: 'es', locale: 'es-MX', currency: 'MXN', decimals: 0,
    price: 149, numBump: 99, numBumpFrom: 279, from: 499, bump: 89, bumpFrom: 299, bonus: [249, 199], installments: 3,
    phone: { code: '+52', min: 10, max: 10, placeholder: '55 1234 5678' },
    wallets: ['card', 'oxxo', 'spei', 'mercadopago'],
    banks: [],
  },
  co: {
    name: 'Colombia', flag: 'CO', lang: 'es', locale: 'es-CO', currency: 'COP', decimals: 0,
    price: 34900, numBump: 24900, numBumpFrom: 59900, from: 119900, bump: 19900, bumpFrom: 69900, bonus: [59900, 49900], installments: 3,
    phone: { code: '+57', min: 10, max: 10, placeholder: '300 123 4567' },
    wallets: ['nequi', 'pse', 'card', 'daviplata'],
    banks: ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA Colombia', 'Banco de Occidente', 'Banco Popular', 'Scotiabank Colpatria'],
  },
  ar: {
    name: 'Argentina', flag: 'AR', lang: 'es', variant: 'ar', locale: 'es-AR', currency: 'ARS', decimals: 0,
    price: 14900, numBump: 9900, numBumpFrom: 24900, from: 49900, bump: 8900, bumpFrom: 29900, bonus: [24900, 19900], installments: 3,
    phone: { code: '+54', min: 10, max: 11, placeholder: '11 1234 5678' },
    wallets: ['mercadopago', 'modo', 'card'],
    banks: [],
  },
  cn: {
    name: '中国', flag: 'CN', lang: 'zh', locale: 'zh-CN', currency: 'CNY', decimals: 0,
    price: 39, numBump: 25, numBumpFrom: 59, from: 129, bump: 19, bumpFrom: 68, bonus: [68, 58], installments: 3,
    phone: { code: '+86', min: 11, max: 11, placeholder: '138 0013 8000' },
    wallets: ['alipay', 'wechat', 'unionpay', 'card'],
    banks: [],
  },
}

const DICTS = {
  pt: merge(merge(pt, extraPt), extra2Pt),
  es: merge(merge(es, extraEs), extra2Es),
  zh: merge(merge(zh, extraZh), extra2Zh),
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

// Detecta o país: ?c=mx na URL (para anúncios por país) > fuso horário > idioma do navegador.
export function detectCountry() {
  const param = new URLSearchParams(window.location.search).get('c')
  if (param && COUNTRIES[param]) return param
  const saved = localStorage.getItem('ceu-natal-country')
  if (saved && COUNTRIES[saved]) return saved
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  if (tz.startsWith('America/Argentina') || tz === 'America/Buenos_Aires') return 'ar'
  if (tz === 'America/Bogota') return 'co'
  if (/America\/(Mexico_City|Cancun|Merida|Monterrey|Tijuana|Chihuahua|Hermosillo|Mazatlan)/.test(tz)) return 'mx'
  if (/Asia\/(Shanghai|Chongqing|Harbin|Urumqi)/.test(tz)) return 'cn'
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('zh')) return 'cn'
  if (lang === 'es-mx') return 'mx'
  if (lang === 'es-co') return 'co'
  if (lang === 'es-ar') return 'ar'
  if (lang.startsWith('es')) return 'mx'
  return 'br'
}

const I18n = createContext(null)

export function I18nProvider({ country, gender, children }) {
  const value = useMemo(() => {
    const c = COUNTRIES[country]
    const dict = c.variant === 'ar' ? merge(merge(merge(DICTS.es, esAR), extraEsAR), extra2EsAR) : DICTS[c.lang]
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
      fill,
      dict,
      money: (n) => money.format(n),
      walletName,
      walletNote,
      monthName: new Date().toLocaleDateString(c.locale, { month: 'long' }),
    }
  }, [country, gender])

  return <I18n.Provider value={value}>{children}</I18n.Provider>
}

export const useI18n = () => useContext(I18n)
