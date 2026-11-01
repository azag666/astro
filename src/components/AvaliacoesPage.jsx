import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useI18n } from '../i18n'
import { useEspecialistas } from '../lib/pros'
import Reviews from './Reviews'
import ReviewForm from './ReviewForm'

// Aba de avaliações (#/avaliacoes): todas as aprovadas + formulário (Céu Natal ou uma especialista)
export default function AvaliacoesPage({ onBack }) {
  const { t } = useI18n()
  const pros = useEspecialistas().filter((x) => x.real)
  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      {onBack && (
        <button type="button" onClick={onBack} className="mb-5 flex items-center gap-2 text-sm text-white/55 hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" /> {t('common.back')}
        </button>
      )}
      <h2 className="font-serif text-3xl font-semibold">{t('reviews.title')}</h2>
      <p className="mt-2 text-white/60">{t('reviews.sub')}</p>
      <Reviews grid limit={100} />
      <ReviewForm pros={pros} />
    </div>
  )
}
