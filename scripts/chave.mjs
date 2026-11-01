// Grava a API key da HotTrack no .env a partir da área de transferência (macOS).
// Uso: copie a chave e rode `npm run chave`. A chave nunca é impressa nem vai para o git.
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'

const key = execSync('pbpaste').toString().trim()
if (!/^ht_(live|test)_[A-Za-z0-9_-]{8,}$/.test(key)) {
  console.error('A área de transferência não contém uma chave HotTrack válida (ht_live_... ou ht_test_...).')
  process.exit(1)
}

const file = new URL('../.env', import.meta.url)
const lines = existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter((l) => l && !l.startsWith('HOTTRACK_API_KEY=')) : []
lines.push(`HOTTRACK_API_KEY=${key}`)
writeFileSync(file, lines.join('\n') + '\n')
chmodSync(file, 0o600)

const modo = key.startsWith('ht_live_') ? 'PRODUÇÃO (cobranças reais)' : 'TESTE (cobranças simuladas)'
console.log(`Chave gravada no .env: ${key.slice(0, 8)}…${key.slice(-4)} — modo ${modo}.`)
console.log('Reinicie o servidor (npm run server) para usar a chave.')
