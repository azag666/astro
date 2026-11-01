import { useState } from 'react'
import { ArrowLeftIcon, CameraIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useI18n } from '../../i18n'

const PRINCIPAIS = ['astro', 'tarot', 'numero', 'amor', 'carreira', 'holistica', 'outra']

// Foto escolhida → quadrado 512 px em JPEG (fica leve e igual para todas)
function recortar(arquivo) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const lado = Math.min(img.width, img.height)
      const c = document.createElement('canvas')
      c.width = c.height = 512
      c.getContext('2d').drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 512, 512)
      resolve(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(arquivo)
  })
}

// Cadastro público de especialista (#/especialista): entra pendente e só aparece depois de aprovada no /painel
export default function ProCadastro({ onBack }) {
  const { t, country, c } = useI18n()
  const [f, setF] = useState({ nome: '', principal: '', outra: '', tags: '', bio: '', email: '', whatsapp: '', aceite: false })
  const [foto, setFoto] = useState(null)
  const [estado, setEstado] = useState('')
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const especialidade = f.principal === 'outra' ? f.outra.trim() : f.principal ? t(`proSignup.roles.${f.principal}`) : ''
  const ok = f.nome.trim().length >= 2 && especialidade.length >= 2 && f.bio.trim().length >= 20 && /^\S+@\S+\.\S+$/.test(f.email) && f.aceite

  const enviar = async (e) => {
    e.preventDefault()
    if (!ok) return
    setEstado('enviando')
    const r = await fetch('/api/especialistas/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: f.nome, especialidade, especialidades: f.tags, bio: f.bio, email: f.email, whatsapp: f.whatsapp ? `${c.phone.code} ${f.whatsapp}` : '', foto, country }),
    }).catch(() => null)
    setEstado(r?.ok ? 'ok' : r?.status === 429 ? 'limite' : 'erro')
  }

  if (estado === 'ok') {
    return (
      <div className="mx-auto flex min-h-[80svh] max-w-md flex-col justify-center px-5 text-center">
        <CheckCircleIcon className="mx-auto h-14 w-14 text-emerald-300" />
        <h2 className="mt-5 font-serif text-3xl font-semibold">{t('proSignup.doneTitle')}</h2>
        <p className="mt-3 text-white/65">{t('proSignup.doneText')}</p>
        {onBack && <button type="button" onClick={onBack} className="btn-gold mt-8 w-full">{t('common.back')}</button>}
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-md space-y-4 px-5 py-8">
      {onBack && (
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-white/55 hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" /> {t('common.back')}
        </button>
      )}
      <h2 className="font-serif text-3xl font-semibold">{t('proSignup.title')}</h2>
      <p className="text-white/60">{t('proSignup.sub')}</p>

      <label className="mx-auto flex w-fit cursor-pointer flex-col items-center gap-2 py-2">
        {foto ? (
          <img src={foto} alt="" className="h-28 w-28 rounded-full object-cover ring-2 ring-gold-400/50" />
        ) : (
          <span className="grid h-28 w-28 place-items-center rounded-full border-2 border-dashed border-white/20 text-white/40">
            <CameraIcon className="h-9 w-9" />
          </span>
        )}
        <span className="text-sm text-gold-300">{foto ? t('proSignup.photoChange') : t('proSignup.photo')}</span>
        <input type="file" accept="image/*" className="sr-only" onChange={async (e) => e.target.files?.[0] && setFoto(await recortar(e.target.files[0]).catch(() => null))} />
      </label>

      <input className="field" placeholder={t('proSignup.name')} value={f.nome} onChange={set('nome')} maxLength={60} autoComplete="name" />
      <select className="field appearance-none [color-scheme:dark]" value={f.principal} onChange={set('principal')}>
        <option value="">{t('proSignup.main')}</option>
        {PRINCIPAIS.map((k) => (
          <option key={k} value={k}>{t(`proSignup.roles.${k}`)}</option>
        ))}
      </select>
      {f.principal === 'outra' && <input className="field" placeholder={t('proSignup.mainOther')} value={f.outra} onChange={set('outra')} maxLength={80} />}
      <input className="field" placeholder={t('proSignup.tags')} value={f.tags} onChange={set('tags')} maxLength={200} />
      <textarea className="field resize-none" rows={4} placeholder={t('proSignup.bio')} value={f.bio} onChange={set('bio')} maxLength={600} />
      <p className="-mt-2 pl-1 text-xs text-white/40">{f.bio.trim().length}/600 · {t('proSignup.bioHint')}</p>
      <input className="field" type="email" inputMode="email" placeholder={t('proSignup.email')} value={f.email} onChange={set('email')} autoComplete="email" />
      <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] focus-within:border-gold-400/70">
        <span className="flex items-center border-r border-white/10 px-3 text-sm text-white/60">{c.phone.code}</span>
        <input className="w-full bg-transparent px-3 py-3.5 text-white placeholder-white/35 outline-none" inputMode="tel" placeholder={t('proSignup.whatsapp')} value={f.whatsapp} onChange={set('whatsapp')} maxLength={20} />
      </div>
      <label className="flex items-start gap-3 text-sm text-white/60">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-gold-400" checked={f.aceite} onChange={set('aceite')} />
        {t('proSignup.consent')}
      </label>
      {estado === 'erro' && <p className="text-sm text-rose-300">{t('proSignup.error')}</p>}
      {estado === 'limite' && <p className="text-sm text-rose-300">{t('proSignup.tooMany')}</p>}
      <button disabled={!ok || estado === 'enviando'} className="btn-gold w-full py-5 text-lg disabled:opacity-50">{t('proSignup.send')}</button>
    </form>
  )
}
