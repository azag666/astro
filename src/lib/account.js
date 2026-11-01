// Conta do lead (protótipo): fica salva no próprio aparelho via localStorage.
// Em produção, enviar para o backend/CRM no momento do cadastro (saveAccount).
const KEY = 'ceu-natal-accounts'
const CURRENT = 'ceu-natal-current'

const digits = (s) => (s || '').replace(/\D/g, '')

function all() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveAccount(data, country) {
  const email = data.email.trim().toLowerCase()
  const prev = all().find((a) => a.email === email)
  const list = all().filter((a) => a.email !== email)
  const account = {
    email: data.email.trim().toLowerCase(),
    phone: digits(data.phone),
    country,
    data,
    orders: prev?.orders || [],
    profiles: prev?.profiles || [],
    createdAt: new Date().toISOString(),
  }
  list.push(account)
  localStorage.setItem(KEY, JSON.stringify(list))
  localStorage.setItem(CURRENT, account.email)
  return account
}

export function currentAccount() {
  const email = localStorage.getItem(CURRENT)
  return email ? all().find((a) => a.email === email) || null : null
}

export function findAccount(login) {
  const l = login.trim().toLowerCase()
  const d = digits(l)
  return all().find((a) => a.email === l || (d.length >= 8 && a.phone.endsWith(d.slice(-8)))) || null
}

export function login(account) {
  localStorage.setItem(CURRENT, account.email)
}

export function logout() {
  localStorage.removeItem(CURRENT)
}

export function addOrder(order) {
  const email = localStorage.getItem(CURRENT)
  if (!email) return
  const list = all().map((a) => (a.email === email ? { ...a, orders: [...a.orders, { ...order, at: new Date().toISOString() }] } : a))
  localStorage.setItem(KEY, JSON.stringify(list))
}

// Perfis extras (parceiro, filhos, amigos…) ligados à conta logada
export function addProfile(profile) {
  const email = localStorage.getItem(CURRENT)
  if (!email) return null
  const p = { ...profile, id: `p${Date.now().toString(36)}`, createdAt: new Date().toISOString() }
  const list = all().map((a) => (a.email === email ? { ...a, profiles: [...(a.profiles || []), p] } : a))
  localStorage.setItem(KEY, JSON.stringify(list))
  return p
}
