import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { useI18n } from '../i18n'
import { sid, track } from '../lib/track'

// Avaliação: nome, estrelas e texto. Entra como pendente; aparece no site depois de aprovada no /painel.
// pro: especialista avaliada (null = avaliação do Céu Natal). pros: lista para escolher, se não vier pro.
export default function ReviewForm({ pro = null, pros = null }) {
  const { t, country } = useI18n()
  const [nome, setNome] = useState('')
  const [nota, setNota] = useState(0)
  const [texto, setTexto] = useState('')
  const [alvo, setAlvo] = useState(pro?.id || '')
  const [estado, setEstado] = useState('')

  const ok = nome.trim().length >= 2 && nota > 0 && texto.trim().length >= 3

  const enviar = async (e) => {
    e.preventDefault()
    if (!ok) return
    setEstado('enviando')
    const r = await fetch('/api/avaliacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid, country, nome: nome.trim(), nota, texto: texto.trim(), pro: alvo || null }),
    }).catch(() => null)
    if (r?.ok) {
      setEstado('ok')
      track('review_open', { pro: alvo, nota })
    } else setEstado(r?.status === 429 ? 'limite' : 'erro')
  }

  if (estado === 'ok') {
    return (
      <div className="glass mt-8 rounded-3xl p-6 text-center">
        <CheckCircleIcon className="mx-auto h-10 w-10 text-emerald-300" />
        <p className="mt-3">{t('reviews.thanks')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="glass mt-8 space-y-3 rounded-3xl p-5">
      <p className="font-semibold">{pro ? t('reviews.ratePro', { name: pro.name }) : t('reviews.rate')}</p>
      {!pro && pros?.length > 0 && (
        <select value={alvo} onChange={(e) => setAlvo(e.target.value)} className="field appearance-none [color-scheme:dark]">
          <option value="">{t('reviews.aboutSite')}</option>
          {pros.map((x) => (
            <option key={x.id} value={x.id}>{x.name} · {x.role}</option>
          ))}
        </select>
      )}
      <div className="flex gap-1" role="radiogroup" aria-label={t('reviews.stars')}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={nota === n} onClick={() => setNota(n)} className="p-0.5">
            <StarIcon className={`h-8 w-8 transition ${n <= nota ? 'text-gold-400' : 'text-white/15 hover:text-white/30'}`} />
          </button>
        ))}
      </div>
      <input className="field" placeholder={t('reviews.name')} value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} autoComplete="given-name" />
      <textarea className="field resize-none" rows={3} placeholder={t('reviews.text')} value={texto} maxLength={1000} onChange={(e) => setTexto(e.target.value)} />
      {estado === 'erro' && <p className="text-sm text-rose-300">{t('reviews.error')}</p>}
      {estado === 'limite' && <p className="text-sm text-rose-300">{t('reviews.tooMany')}</p>}
      <button disabled={!ok || estado === 'enviando'} className="btn-gold w-full disabled:opacity-50">{t('reviews.send')}</button>
    </form>
  )
}
