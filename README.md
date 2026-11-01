# Céu Natal — funil de mapa astral

Quiz de aquecimento → diagnóstico astral gratuito (cálculo real) → página de vendas → checkout com carteiras por país.

**Stack:** Vite + React 19 + Tailwind 4 + framer-motion + @heroicons/react + astronomy-engine + @mediapipe/tasks-vision.

## Rodar

```bash
npm install
npm run setup:mediapipe   # modelo da leitura de mão (~65 MB, fica fora do git)
npx vite --port 5181 --host 127.0.0.1
```

## Links de campanha

- Dor: `?f=amor` · `?f=dinheiro` · `?f=carreira` · `?f=espiritual`
- País: `?c=br` · `?c=mx` · `?c=co` · `?c=ar` · `?c=cn`

## Onde está cada coisa

- `src/lib/astro.js` — mapa natal real (planetas, Ascendente, MC, aspectos) + busca de cidade (Open-Meteo)
- `src/lib/forecast.js` — datas de ouro (trânsitos dos próximos 30 dias), fases da Lua, numerologia
- `src/lib/palm.js` — leitura de mão com MediaPipe (roda no aparelho)
- `src/lib/account.js` — cadastro/login sem senha (protótipo em localStorage; trocar por backend)
- `src/i18n/` — textos pt/es/es-AR/zh em camadas (`*.js`, `extra-*.js`, `extra2-*.js`), países, moedas e carteiras em `index.jsx`

O checkout é demonstração: não há gateway de pagamento ligado. Depoimentos são ilustrativos.
