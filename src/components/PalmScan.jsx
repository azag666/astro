import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowPathIcon, CameraIcon, HandRaisedIcon, PhotoIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { HAND_CONNECTIONS, loadLandmarker, readPalm } from '../lib/palm'
import { useI18n } from '../i18n'

export default function PalmScan({ onResult }) {
  const { t } = useI18n()
  const [mode, setMode] = useState('choose') // choose | camera | scanning | result | error
  const [shot, setShot] = useState(null) // dataURL
  const [ratio, setRatio] = useState(0.8)
  const [result, setResult] = useState(null)
  const [loadingModel, setLoadingModel] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    loadLandmarker().catch(() => {})
    return stopCamera
  }, [])

  function stopCamera() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    streamRef.current = null
  }

  async function startCamera() {
    setMode('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 1280 } })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    } catch {
      setMode('choose')
      fileRef.current?.click()
    }
  }

  async function analyze(dataUrl) {
    setShot(dataUrl)
    setMode('scanning')
    setLoadingModel(true)
    const img = new Image()
    img.src = dataUrl
    await img.decode()
    setRatio(img.naturalWidth / img.naturalHeight)
    try {
      const [res] = await Promise.all([readPalm(img), new Promise((r) => setTimeout(r, 2200))])
      setLoadingModel(false)
      if (!res) return setMode('error')
      setResult(res)
      setMode('result')
      onResult(res)
    } catch {
      setLoadingModel(false)
      setMode('error')
    }
  }

  function capture() {
    const v = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    canvas.getContext('2d').drawImage(v, 0, 0)
    stopCamera()
    analyze(canvas.toDataURL('image/jpeg', 0.9))
  }

  function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => analyze(reader.result)
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  const reset = () => {
    setShot(null)
    setResult(null)
    setMode('choose')
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      <div className="relative h-[46svh] min-h-72 w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        {mode === 'choose' && (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <HandRaisedIcon className="h-24 w-24 text-gold-300/80" strokeWidth={1} />
            </motion.div>
            <p className="text-sm text-white/55">{t('quiz.palm.tip')}</p>
          </div>
        )}

        {mode === 'camera' && (
          <>
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            <svg viewBox="0 0 100 125" className="pointer-events-none absolute inset-0 h-full w-full">
              <path
                d="M30 115 L28 70 Q26 60 22 52 L14 38 Q12 32 18 31 Q22 31 26 38 L32 48 L32 18 Q32 12 37 12 Q42 12 42 18 L43 42 L44 12 Q44 6 50 6 Q55 6 55 12 L55 42 L57 15 Q57 9 62 9 Q67 9 67 15 L66 45 L69 25 Q70 20 74 20 Q79 21 78 27 L75 70 Q74 90 68 115 Z"
                fill="none"
                stroke="#e2c27d"
                strokeOpacity=".6"
                strokeDasharray="2 2"
              />
            </svg>
          </>
        )}

        {shot && mode !== 'camera' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div
              className="relative"
              style={ratio < 0.9 ? { height: '100%', aspectRatio: ratio } : { width: '100%', aspectRatio: ratio }}
            >
              <img src={shot} alt="" className="h-full w-full" />
              {result && <Landmarks landmarks={result.landmarks} />}
            </div>
          </div>
        )}

        <AnimatePresence>
          {mode === 'scanning' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-night-950/40">
              <motion.div
                className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-gold-300/40 to-transparent"
                animate={{ top: ['-20%', '100%'] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              />
              <p className="absolute inset-x-0 bottom-6 text-center text-sm font-medium">
                {loadingModel ? t('quiz.palm.scanning') : t('quiz.palm.loading')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {mode === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-night-950/80 p-8 text-center text-sm text-rose-200">{t('quiz.palm.notFound')}</div>
        )}

        {mode === 'result' && result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-3 bottom-3 rounded-2xl border border-gold-400/40 bg-night-950/85 p-4 backdrop-blur"
          >
            <p className="font-serif text-xl font-semibold text-gold-300">{t(`palmTypes.${result.element}.title`)}</p>
            <p className="mt-1 text-sm text-white/75">{t(`palmTypes.${result.element}.text`)}</p>
          </motion.div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {mode === 'camera' ? (
          <button type="button" onClick={capture} className="btn-gold col-span-2">
            <CameraIcon className="h-5 w-5" /> {t('quiz.palm.capture')}
          </button>
        ) : mode === 'choose' ? (
          <>
            <button type="button" onClick={startCamera} className="glass flex items-center justify-center gap-2 rounded-2xl py-4 font-medium hover:bg-white/10">
              <CameraIcon className="h-5 w-5 text-gold-300" /> {t('quiz.palm.camera')}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="glass flex items-center justify-center gap-2 rounded-2xl py-4 font-medium hover:bg-white/10">
              <PhotoIcon className="h-5 w-5 text-gold-300" /> {t('quiz.palm.upload')}
            </button>
          </>
        ) : mode !== 'scanning' ? (
          <button type="button" onClick={reset} className="col-span-2 flex items-center justify-center gap-2 py-2 text-sm text-white/55 hover:text-white">
            <ArrowPathIcon className="h-4 w-4" /> {t('quiz.palm.retry')}
          </button>
        ) : null}
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/40">
        <ShieldCheckIcon className="h-4 w-4" /> {t('quiz.palm.privacy')}
      </p>
    </div>
  )
}

function Landmarks({ landmarks }) {
  return (
    <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
      {HAND_CONNECTIONS.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={landmarks[a].x}
          y1={landmarks[a].y}
          x2={landmarks[b].x}
          y2={landmarks[b].y}
          stroke="#e2c27d"
          strokeWidth="0.006"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.9 }}
          transition={{ delay: i * 0.03, duration: 0.4 }}
        />
      ))}
      {landmarks.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r="0.009" fill="#f6e7c1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.02 }} />
      ))}
    </svg>
  )
}
