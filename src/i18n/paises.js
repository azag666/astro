// kind: como o pagamento é concluído — card | qr | voucher | transfer | push | redirect
// ht: id do método na API da HotTrack (sem ht = ainda não cobra de verdade)
export const WALLETS = {
  pix: { ht: 'pix', name: 'Pix', kind: 'qr', color: '#32BCAD', note: { pt: 'Aprovação na hora' } },
  card: { name: { pt: 'Cartão', es: 'Tarjeta', zh: '银行卡' }, kind: 'card', color: '#e2c27d', note: { pt: 'Até 3x sem juros', es: 'Crédito o débito', zh: '信用卡 / 借记卡' } },
  mercadopago: { ht: { ARS: 'mercado-pago' }, name: 'Mercado Pago', kind: 'qr', color: '#00B1EA', note: { pt: 'Saldo ou cartão salvo', es: 'Dinero en cuenta o tarjeta guardada' } },
  oxxo: { ht: 'oxxo', name: 'OXXO', kind: 'voucher', color: '#E31B23', note: { es: 'Paga en efectivo en tienda' } },
  spei: { ht: 'spei', name: 'SPEI', kind: 'transfer', color: '#0F6CBD', note: { es: 'Transferencia bancaria' } },
  nequi: { ht: 'nequi', name: 'Nequi', kind: 'push', color: '#DA0081', note: { es: 'Aprueba en tu app' } },
  breb: { ht: 'bre-b-llave', name: 'Bre-B', kind: 'push', color: '#00A859', note: { es: 'Desde cualquier banco' } },
  cvu: { ht: 'cvu', name: { es: 'Transferencia' }, kind: 'transfer', color: '#6CB4EE', note: { es: 'CVU desde tu banco o billetera' } },
  whop: { ht: 'whop', name: { pt: 'Cartão', es: 'Tarjeta' }, kind: 'redirect', color: '#e2c27d', note: { pt: 'Crédito, débito, Apple Pay e Google Pay', es: 'Crédito, débito, Apple Pay y Google Pay' } },
  transfcl: { ht: { CLP: 'transferencia' }, name: { es: 'Transferencia' }, kind: 'redirect', color: '#0F6CBD', note: { es: 'Paga desde la app de tu banco' } },
  daviplata: { name: 'Daviplata', kind: 'push', color: '#ED1C24', note: { es: 'Aprueba en tu app' } },
  pse: { ht: 'pse', name: 'PSE', kind: 'redirect', color: '#1F4E9C', note: { es: 'Débito desde tu banco' } },
  modo: { ht: 'qr-interoperable', name: 'MODO', kind: 'qr', color: '#4B2BD8', note: { es: 'Pagá con la app de tu banco' } },
  alipay: { name: '支付宝', kind: 'qr', color: '#1677FF', note: { zh: '扫码支付' } },
  wechat: { name: '微信支付', kind: 'qr', color: '#07C160', note: { zh: '扫码支付' } },
  unionpay: { name: '云闪付', kind: 'qr', color: '#E21836', note: { zh: '银联扫码' } },
}

export const COUNTRIES = {
  br: {
    name: 'Brasil', flag: 'BR', lang: 'pt', locale: 'pt-BR', currency: 'BRL', decimals: 2,
    price: 27.9, numBump: 19.9, numBumpFrom: 57.9, from: 97.9, bump: 17.9, bumpFrom: 67.9, installments: 3,
    back: 19.9, ask: { 1: 19.9, 3: 47.9, 5: 69.9 }, askUp: 37, askDown: 14.9,
    phone: { code: '+55', min: 10, max: 11, placeholder: '(11) 99999-9999' },
    wallets: ['pix', 'whop'],
    banks: [],
  },
  mx: {
    name: 'México', flag: 'MX', lang: 'es', locale: 'es-MX', currency: 'MXN', decimals: 0,
    price: 149, numBump: 99, numBumpFrom: 279, from: 499, bump: 89, bumpFrom: 299, installments: 3,
    back: 99, ask: { 1: 99, 3: 229, 5: 329 }, askUp: 179, askDown: 79,
    phone: { code: '+52', min: 10, max: 10, placeholder: '55 1234 5678' },
    wallets: ['spei', 'oxxo', 'whop'],
    banks: [],
  },
  co: {
    name: 'Colombia', flag: 'CO', lang: 'es', locale: 'es-CO', currency: 'COP', decimals: 0,
    price: 34900, numBump: 24900, numBumpFrom: 59900, from: 119900, bump: 19900, bumpFrom: 69900, installments: 3,
    back: 24900, ask: { 1: 24900, 3: 54900, 5: 79900 }, askUp: 44900, askDown: 19900,
    phone: { code: '+57', min: 10, max: 10, placeholder: '300 123 4567' },
    wallets: ['nequi', 'breb', 'whop'],
    banks: [],
  },
  cl: {
    name: 'Chile', flag: 'CL', lang: 'es', locale: 'es-CL', currency: 'CLP', decimals: 0,
    price: 7900, numBump: 5900, numBumpFrom: 17900, from: 26900, bump: 4900, bumpFrom: 15900, installments: 3,
    back: 5900, ask: { 1: 5900, 3: 13900, 5: 19900 }, askUp: 10900, askDown: 4900,
    phone: { code: '+56', min: 9, max: 9, placeholder: '9 1234 5678' },
    wallets: ['transfcl', 'whop'],
    banks: [],
  },
  ar: {
    name: 'Argentina', flag: 'AR', lang: 'es', variant: 'ar', locale: 'es-AR', currency: 'ARS', decimals: 0,
    price: 14900, numBump: 9900, numBumpFrom: 24900, from: 49900, bump: 8900, bumpFrom: 29900, installments: 3,
    back: 9900, ask: { 1: 9900, 3: 24900, 5: 34900 }, askUp: 19900, askDown: 7900,
    phone: { code: '+54', min: 10, max: 11, placeholder: '11 1234 5678' },
    wallets: ['whop'],
    banks: [],
  },
  cn: {
    name: '中国', flag: 'CN', lang: 'zh', locale: 'zh-CN', currency: 'CNY', decimals: 0,
    price: 39, numBump: 25, numBumpFrom: 59, from: 129, bump: 19, bumpFrom: 68, installments: 3,
    back: 29, ask: { 1: 25, 3: 59, 5: 89 }, askUp: 45, askDown: 19,
    phone: { code: '+86', min: 11, max: 11, placeholder: '138 0013 8000' },
    wallets: ['alipay', 'wechat', 'unionpay', 'card'],
    banks: [],
  },
}

// Método da HotTrack para a carteira nesta moeda (null = só demonstração)
export function htMethod(wallet, currency) {
  const ht = WALLETS[wallet]?.ht
  return (typeof ht === 'object' ? ht?.[currency] : ht) || null
}

// Valor em centavos da moeda (a API sempre recebe centavos, mesmo em moeda sem decimais).
// product: 'mapa' (oferta principal; offer 'back' = preço da volta) ou 'perguntas' (pack 1/3/5;
// offer 'up' = 3 perguntas no pós-compra, 'down' = 1 pergunta se recusar o upsell)
export const PACKS = [1, 3, 5]

export function orderTotal(country, { product = 'mapa', offer = '', bump = false, numBump = false, askBump = false, pack = 0 } = {}) {
  const c = COUNTRIES[country]
  if (!c) return null
  let total
  if (product === 'perguntas') {
    if (!PACKS.includes(pack)) return null
    total = offer === 'up' && pack === 3 ? c.askUp : offer === 'down' && pack === 1 ? c.askDown : c.ask[pack]
  } else {
    total = (offer === 'back' ? c.back : c.price) + (bump ? c.bump : 0) + (numBump ? c.numBump : 0) + (askBump ? c.askDown : 0)
  }
  return { total, cents: Math.round(total * 100), currency: c.currency }
}
