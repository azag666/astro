// Pixel da Meta no navegador. O id vem do servidor (window.__PIXEL); o mesmo event_id vai
// para o /api/e, e o servidor manda o evento pela Conversions API (a Meta junta os dois).
const PIXEL = typeof window !== 'undefined' ? window.__PIXEL : ''

if (PIXEL && !window.fbq) {
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = !0
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = !0
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */
  window.fbq('init', PIXEL)
}

export const pixelOn = !!PIXEL

export function fbEvent(name, eventId, data = {}) {
  if (!PIXEL || !window.fbq) return
  window.fbq('track', name, data, { eventID: eventId })
}

export function fbCookies() {
  const pega = (k) => document.cookie.split('; ').find((c) => c.startsWith(k + '='))?.split('=')[1] || ''
  return { fbp: pega('_fbp'), fbc: pega('_fbc') }
}
