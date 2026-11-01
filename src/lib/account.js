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
  const list = all().filter((a) => a.email !== data.email.trim().toLowerCase())
  const account = {
    email: data.email.trim().toLowerCase(),
    phone: digits(data.phone),
    country,
    data,
    orders: list.find((a) => a.email === data.email)?.orders || [],
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
