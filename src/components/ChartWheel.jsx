import { motion } from 'framer-motion'
import { PLANET_GLYPHS, SIGN_GLYPHS } from '../lib/astro'

// Roda do mapa natal com as posições reais. Ascendente fixo à esquerda (convenção).
export default function ChartWheel({ chart, size = 420 }) {
  const c = size / 2
  const rOuter = c - 4
  const rSigns = c - 34
  const rPlanets = c - 70
  const rInner = c - 110
  const base = chart.asc ? chart.asc.lon : 0
  const pos = (lon, r) => {
    const a = ((180 + (lon - base)) * Math.PI) / 180
    return [c + Math.cos(a) * r, c - Math.sin(a) * r]
  }

  // Espaça planetas muito próximos para os glifos não se sobreporem
  const placed = [...chart.planets].sort((a, b) => a.lon - b.lon).map((p) => ({ ...p, shown: p.lon }))
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 1; i < placed.length; i++) {
      if (placed[i].shown - placed[i - 1].shown < 7) placed[i].shown = placed[i - 1].shown + 7
    }
  }

  const aspectColor = { trine: '#7dd3a8', sextile: '#7dd3a8', square: '#f08a8a', opposition: '#f08a8a', conjunction: '#e2c27d' }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      <circle cx={c} cy={c} r={rOuter} fill="#0d0b26" stroke="#e2c27d" strokeOpacity=".5" />
      <circle cx={c} cy={c} r={rSigns - 18} fill="none" stroke="#e2c27d" strokeOpacity=".35" />
      <circle cx={c} cy={c} r={rInner} fill="none" stroke="#e2c27d" strokeOpacity=".2" />

      {SIGN_GLYPHS.map((g, i) => {
        const [x1, y1] = pos(i * 30, rOuter)
        const [x2, y2] = pos(i * 30, rSigns - 18)
        const [gx, gy] = pos(i * 30 + 15, rSigns)
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e2c27d" strokeOpacity=".35" />
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" fontSize="17" fill="#e2c27d" fillOpacity=".8">
              {g}
            </text>
          </g>
        )
      })}

      {chart.aspects
        .filter((a) => a.type !== 'conjunction')
        .slice(0, 14)
        .map((a, i) => {
          const pa = chart.get(a.a)
          const pb = chart.get(a.b)
          const [x1, y1] = pos(pa.lon, rInner)
          const [x2, y2] = pos(pb.lon, rInner)
          return (
            <motion.line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={aspectColor[a.type]}
              strokeOpacity=".45"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + i * 0.06, duration: 0.8 }}
            />
          )
        })}

      {chart.asc && (
        <>
          <AxisLine from={pos(chart.asc.lon, rOuter)} to={pos(chart.asc.lon + 180, rOuter)} />
          <AxisLine from={pos(chart.mc.lon, rOuter)} to={pos(chart.mc.lon + 180, rOuter)} />
          <Label at={pos(chart.asc.lon, rInner - 16)} text="AC" />
          <Label at={pos(chart.mc.lon, rInner - 16)} text="MC" />
        </>
      )}

      {placed.map((p, i) => {
        const [x, y] = pos(p.shown, rPlanets)
        const [tx, ty] = pos(p.lon, rSigns - 18)
        return (
          <motion.g
            key={p.key}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.07, type: 'spring' }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          >
            <line x1={tx} y1={ty} x2={pos(p.lon, rSigns - 26)[0]} y2={pos(p.lon, rSigns - 26)[1]} stroke="#f6e7c1" strokeOpacity=".6" />
            <circle cx={x} cy={y} r="13" fill="#15123a" stroke="#e2c27d" strokeOpacity=".4" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="15" fill={p.key === 'sun' || p.key === 'moon' ? '#f6e7c1' : '#c9b8ff'}>
              {PLANET_GLYPHS[p.key]}
            </text>
            {p.retro && (
              <text x={x + 12} y={y + 11} fontSize="8" fill="#f08a8a">
                R
              </text>
            )}
          </motion.g>
        )
      })}
    </svg>
  )
}

function AxisLine({ from, to }) {
  return <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="#e2c27d" strokeOpacity=".25" strokeDasharray="3 4" />
}

function Label({ at, text }) {
  return (
    <g>
      <rect x={at[0] - 13} y={at[1] - 9} width="26" height="18" rx="9" fill="#e2c27d" />
      <text x={at[0]} y={at[1]} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill="#0d0b26">
        {text}
      </text>
    </g>
  )
}
