import { useMemo, useState } from 'react'
import { useI18n } from '../i18n'

// Data e hora em listas (dia / mês / ano): no celular abre a roda nativa do sistema,
// bem mais fácil que o calendário do input type="date" para quem nasceu há décadas.
const pad = (n) => String(n).padStart(2, '0')
const daysIn = (y, m) => new Date(y || 2000, m || 1, 0).getDate()

const LABELS = {
  pt: { d: 'Dia', m: 'Mês', y: 'Ano' },
  es: { d: 'Día', m: 'Mes', y: 'Año' },
  zh: { d: '日', m: '月', y: '年' },
}

function Select({ value, onChange, children, label }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`field appearance-none px-3 pr-7 text-center text-lg [color-scheme:dark] ${value === '' ? 'text-white/40' : ''}`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35">▾</span>
    </label>
  )
}

export function DateSelect({ value, onChange, minYear = 1920 }) {
  const { c } = useI18n()
  const [parts, setParts] = useState(() => {
    const [y, m, d] = (value || '').split('-').map((x) => Number(x) || '')
    return { y, m, d }
  })
  const labels = LABELS[c.lang] || LABELS.es
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date(2000, i, 15).toLocaleDateString(c.locale, { month: 'short' }).replace('.', '')),
    [c.locale],
  )
  const years = useMemo(() => {
    const top = new Date().getFullYear()
    return Array.from({ length: top - minYear + 1 }, (_, i) => top - i)
  }, [minYear])

  const set = (k) => (v) => {
    const next = { ...parts, [k]: v === '' ? '' : Number(v) }
    if (next.d && next.y && next.m) next.d = Math.min(next.d, daysIn(next.y, next.m))
    setParts(next)
    onChange(next.d && next.m && next.y ? `${next.y}-${pad(next.m)}-${pad(next.d)}` : '')
  }

  const el = {
    d: (
      <Select key="d" value={parts.d} onChange={set('d')} label={labels.d}>
        <option value="">{labels.d}</option>
        {Array.from({ length: daysIn(parts.y, parts.m) }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </Select>
    ),
    m: (
      <Select key="m" value={parts.m} onChange={set('m')} label={labels.m}>
        <option value="">{labels.m}</option>
        {months.map((name, i) => (
          <option key={i} value={i + 1}>{name}</option>
        ))}
      </Select>
    ),
    y: (
      <Select key="y" value={parts.y} onChange={set('y')} label={labels.y}>
        <option value="">{labels.y}</option>
        {years.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </Select>
    ),
  }
  const order = c.lang === 'zh' ? ['y', 'm', 'd'] : ['d', 'm', 'y']
  return <div className="grid grid-cols-[1fr_1.25fr_1.35fr] gap-2">{order.map((k) => el[k])}</div>
}

export function TimeSelect({ value, onChange, disabled }) {
  const [parts, setParts] = useState(() => {
    const [h = '', mi = ''] = (value || '').split(':')
    return { h, mi }
  })
  const set = (k) => (v) => {
    const next = { ...parts, [k]: v }
    setParts(next)
    onChange(next.h !== '' && next.mi !== '' ? `${next.h}:${next.mi}` : '')
  }
  return (
    <div className={`grid grid-cols-2 gap-2 ${disabled ? 'pointer-events-none opacity-40' : ''}`}>
      <Select value={parts.h} onChange={set('h')} label="h">
        <option value="">--</option>
        {Array.from({ length: 24 }, (_, i) => pad(i)).map((x) => (
          <option key={x} value={x}>{x}h</option>
        ))}
      </Select>
      <Select value={parts.mi} onChange={set('mi')} label="min">
        <option value="">--</option>
        {Array.from({ length: 60 }, (_, i) => pad(i)).map((x) => (
          <option key={x} value={x}>{x} min</option>
        ))}
      </Select>
    </div>
  )
}
