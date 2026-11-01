// Palpite de gênero pelo primeiro nome (nomes em português e espanhol). Devolve 'f', 'm' ou null quando não dá para saber.
// Serve só para ajustar o texto (dele/dela); errar aqui troca uma palavra, nada mais.
const F = new Set([
  'raquel', 'isabel', 'beatriz', 'ester', 'esther', 'ruth', 'rute', 'carmen', 'ines', 'mercedes', 'lourdes', 'dolores', 'rocio', 'pilar',
  'luz', 'sol', 'abigail', 'miriam', 'mirian', 'karen', 'ingrid', 'jennifer', 'jenifer', 'nicole', 'simone', 'alice', 'elaine', 'daniele',
  'danielle', 'gabrielle', 'michele', 'michelle', 'rachel', 'cristiane', 'viviane', 'josiane', 'luciane', 'tatiane', 'ariane', 'eliane',
  'aline', 'jaqueline', 'jacqueline', 'caroline', 'carolina', 'evelyn', 'kelly', 'sheila', 'yasmin', 'jasmin', 'ivone', 'irene', 'liliane',
  'denise', 'deise', 'rose', 'cleide', 'neide', 'lucimar', 'marisol', 'nathaly', 'nataly', 'emily', 'emilly', 'any', 'graziele', 'mirella',
  'adriane', 'gisele', 'giselle', 'rafaele', 'suelen', 'ellen', 'helen', 'lilian', 'vivian', 'marilyn', 'iris', 'isis', 'thais', 'tais',
  'lais', 'ines', 'agnes', 'ruby', 'beth', 'liz', 'lis', 'ana', 'noemi', 'nohemi', 'yolanda', 'socorro', 'consuelo', 'amparo', 'rosario',
])
const M = new Set([
  'luca', 'lucca', 'joshua', 'nikita', 'jonatha', 'garcia', 'elia', 'josue', 'josué', 'jesus', 'noa', 'isaias', 'jeremias', 'matias',
  'tobias', 'elias', 'zacarias', 'andrea', 'battista', 'dima', 'sasha', 'misha',
])
// Nomes usados por homens e mulheres
const N = new Set(['ariel', 'darcy', 'juci', 'alex', 'sam', 'cris', 'chris', 'dani', 'gabi', 'rafa', 'jean', 'kim', 'rene', 'renê', 'guadalupe'])

export function guessGender(name) {
  const first = (name || '').trim().split(/\s+/)[0]?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (!first || first.length < 2) return null
  if (N.has(first)) return null
  if (F.has(first)) return 'f'
  if (M.has(first)) return 'm'
  if (/a$/.test(first)) return 'f'
  if (/(ane|ine|ele|elle|ete|ette|ise|isse|ly|lly|ny|nny|ys)$/.test(first)) return 'f'
  if (/(o|os|or|on|el|il|ul|im|om|um|an|in|es|is|us|e|r|l|n|s|d|t|z|k|x)$/.test(first)) return 'm'
  return null
}
