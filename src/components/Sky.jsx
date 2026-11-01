import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export function Starfield() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let stars = []
    let raf
    let w, h

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.width = window.innerWidth * dpr
      h = canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      const count = Math.round((window.innerWidth * window.innerHeight) / 5200)
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.2 + 0.2) * dpr,
        a: Math.random(),
        s: Math.random() * 0.012 + 0.003,
        v: (Math.random() * 0.06 + 0.01) * dpr,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const st of stars) {
        st.a += st.s
        st.y -= st.v
        if (st.y < 0) st.y = h
        const alpha = 0.25 + Math.abs(Math.sin(st.a)) * 0.75
        ctx.beginPath()
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 244, 220, ${alpha})`
        ctx.fill()
      }
      if (!reduce) raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#241d5c_0%,#0d0b26_45%,#07061a_100%)]" />
      <motion.div
        className="absolute -left-40 top-1/4 h-[32rem] w-[32rem] rounded-full bg-lilac-400/10 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-gold-400/10 blur-[120px]"
        animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <canvas ref={ref} className="absolute inset-0" />
    </div>
  )
}

const GLYPHS = ['♈︎', '♉︎', '♊︎', '♋︎', '♌︎', '♍︎', '♎︎', '♏︎', '♐︎', '♑︎', '♒︎', '♓︎']

export function ZodiacWheel({ className = '', highlight }) {
  const { scrollY } = useScroll()
  const rotate = useTransform(scrollY, [0, 2000], [0, 90])

  return (
    <motion.div style={{ rotate }} className={className}>
      <motion.svg
        viewBox="0 0 400 400"
        className="h-full w-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 160, repeat: Infinity, ease: 'linear' }}
      >
        <defs>
          <linearGradient id="gold" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f6e7c1" />
            <stop offset="100%" stopColor="#b98d43" />
          </linearGradient>
        </defs>
        <circle cx="200" cy="200" r="196" fill="none" stroke="url(#gold)" strokeOpacity=".5" />
        <circle cx="200" cy="200" r="160" fill="none" stroke="url(#gold)" strokeOpacity=".35" />
        <circle cx="200" cy="200" r="110" fill="none" stroke="url(#gold)" strokeOpacity=".2" strokeDasharray="2 6" />
        {GLYPHS.map((g, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180)
          const line = ((i * 30 - 75) * Math.PI) / 180
          const active = highlight === g
          return (
            <g key={g}>
              <line
                x1={200 + Math.cos(line) * 160}
                y1={200 + Math.sin(line) * 160}
                x2={200 + Math.cos(line) * 196}
                y2={200 + Math.sin(line) * 196}
                stroke="url(#gold)"
                strokeOpacity=".4"
              />
              <text
                x={200 + Math.cos(angle) * 178}
                y={200 + Math.sin(angle) * 178}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={active ? 22 : 17}
                fill={active ? '#f6e7c1' : '#e2c27d'}
                fillOpacity={active ? 1 : 0.7}
              >
                {g}
              </text>
            </g>
          )
        })}
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i * 51 + 20) * (Math.PI / 180)
          const r = 60 + (i % 3) * 25
          return <circle key={i} cx={200 + Math.cos(a) * r} cy={200 + Math.sin(a) * r} r="3" fill="#e2c27d" fillOpacity=".8" />
        })}
        <path
          d="M 260 200 L 168 255 L 185 140 Z M 230 120 L 140 210"
          fill="none"
          stroke="#c9b8ff"
          strokeOpacity=".35"
        />
      </motion.svg>
    </motion.div>
  )
}
