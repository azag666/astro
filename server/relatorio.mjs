// Relatório de abandono (texto): node server/relatorio.mjs [AAAA-MM-DD início] [AAAA-MM-DD fim]
// Lê os mesmos dados do servidor (DATA_DIR) e imprime quem ficou para trás e por quê.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { jornadas, resumoTexto } from './jornadas.mjs'

const DATA = process.env.DATA_DIR || fileURLToPath(new URL('../data', import.meta.url))
const [de, ate] = process.argv.slice(2)
const pedidos = new Map()
const arq = join(DATA, 'pedidos.jsonl')
if (existsSync(arq)) for (const l of readFileSync(arq, 'utf8').split('\n')) if (l) try { const p = JSON.parse(l); pedidos.set(p.id, p) } catch {}

const lista = jornadas(DATA, pedidos, { de, ate })
console.log(resumoTexto(lista))
const quentes = lista.filter((x) => ['codigo', 'checkout', 'oferta'].includes(x.etapa) && (x.email || x.whatsapp))
console.log(`\nRecuperáveis com contato (geraram pagamento, abriram checkout ou viram a oferta): ${quentes.length}`)
for (const x of quentes.slice(0, 40)) console.log(`- [${x.etapa}] ${x.nome || '?'} · ${x.whatsapp || ''} · ${x.email || ''} · ${x.pais} · ${x.campanha}/${x.criativo} · ${x.pendente || ''} · ${x.motivo}`)
