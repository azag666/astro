// Avaliações e detalhes das especialistas.
// `reais`: preencha com avaliações de clientes de verdade (com autorização). Só elas aparecem para o tráfego.
// `exemplos`: maquete para desenhar a página; aparecem só no localhost ou com ?mock=1 na URL, com selo "exemplo".
//
// Formato de cada avaliação:
//   { nome: 'Ana P.', cidade: 'Recife', pais: 'br', nota: 5, texto: '...', produto: 'mapa' | 'perguntas', pro: 'helena', foto: '/avaliacoes/ana.jpg' (opcional) }

export const reais = []

export const exemplos = [
  { nome: 'Camila R.', cidade: 'São Paulo', pais: 'br', nota: 5, produto: 'mapa', texto: 'As datas de ouro bateram com a semana em que fechei o contrato novo. Li o mapa inteiro em uma noite.' },
  { nome: 'Juliana M.', cidade: 'Belo Horizonte', pais: 'br', nota: 5, produto: 'perguntas', pro: 'luna', texto: 'Perguntei sobre meu ex e a resposta foi direta, sem enrolação. Me ajudou a decidir.' },
  { nome: 'Patrícia S.', cidade: 'Curitiba', pais: 'br', nota: 4, produto: 'mapa', texto: 'Gostei muito da parte do Ascendente e da Lua. Queria ainda mais sobre carreira.' },
  { nome: 'Fernanda L.', cidade: 'Salvador', pais: 'br', nota: 5, produto: 'perguntas', pro: 'clara', texto: 'A Clara apontou o mês certo para pedir aumento. Pedi e deu certo.' },
  { nome: 'Daniela G.', cidade: 'Guadalajara', pais: 'mx', nota: 5, produto: 'mapa', texto: 'Muy completa, y llegó al instante después de pagar en OXXO.' },
  { nome: 'Mariana T.', cidade: 'Monterrey', pais: 'mx', nota: 5, produto: 'perguntas', pro: 'marina', texto: 'La lectura de tarot de Marina fue muy clara, me respondió en pocas horas.' },
  { nome: 'Valentina C.', cidade: 'Medellín', pais: 'co', nota: 5, produto: 'mapa', texto: 'Las fechas de oro me sirvieron para planear el mes. La recomiendo.' },
  { nome: 'Laura P.', cidade: 'Bogotá', pais: 'co', nota: 4, produto: 'perguntas', pro: 'helena', texto: 'Respuesta cuidadosa y con detalles de mi carta. Volveré a preguntar.' },
  { nome: 'Sofía B.', cidade: 'Córdoba', pais: 'ar', nota: 5, produto: 'mapa', texto: 'Re completa. La parte de la Luna me describió tal cual.' },
  { nome: 'Lucía F.', cidade: 'Rosario', pais: 'ar', nota: 5, produto: 'perguntas', pro: 'sofia', texto: 'La numeróloga me explicó mi año personal con ejemplos concretos.' },
]

// Detalhes das especialistas que dependem de dado real (anos de prática, nota, nº de avaliações).
// Enquanto `reais` estiver vazio para elas, aparecem só na maquete.
export const prosReais = {}

export const prosExemplo = {
  helena: { anos: 18, nota: 4.9, avaliacoes: 312 },
  luna: { anos: 9, nota: 4.9, avaliacoes: 248 },
  marina: { anos: 12, nota: 4.8, avaliacoes: 276 },
  clara: { anos: 14, nota: 4.8, avaliacoes: 151 },
  sofia: { anos: 10, nota: 4.9, avaliacoes: 133 },
}

// Maquete ligada: localhost, ou ?mock=1 na URL (fica salvo na aba)
export const MOCK = (() => {
  if (typeof window === 'undefined') return false
  const q = new URLSearchParams(window.location.search).get('mock')
  if (q === '1') sessionStorage.setItem('ceu-natal-mock', '1')
  if (q === '0') sessionStorage.removeItem('ceu-natal-mock')
  return /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) || sessionStorage.getItem('ceu-natal-mock') === '1'
})()

export function avaliacoes({ pais, produto, pro } = {}) {
  const base = reais.length ? reais : MOCK ? exemplos : []
  const filtradas = base.filter((a) => (!pro || a.pro === pro) && (!produto || a.produto === produto))
  const doPais = filtradas.filter((a) => !pais || a.pais === pais)
  return { lista: doPais.length ? doPais : filtradas, exemplo: !reais.length && MOCK }
}

export function detalhesDoPro(id) {
  if (prosReais[id]) return { ...prosReais[id], exemplo: false }
  return MOCK && prosExemplo[id] ? { ...prosExemplo[id], exemplo: true } : null
}
