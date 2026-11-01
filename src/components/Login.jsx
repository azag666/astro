import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, ArrowRightIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import Logo from './Logo'
import { findAccount } from '../lib/account'
import { useI18n } from '../i18n'

export default function Login({ onLogin, onStart, onBack }) {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  const [notFound, setNotFound] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    const acc = findAccount(value)
    if (acc) onLogin(acc)
    else setNotFound(true)
  }

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col px-5 py-4">
      <header className="flex items-center justify-between py-2">
        <button onClick={onBack} aria-label={t('common.back')} className="grid h-10 w-10 place-items-center rounded-full border border-white/10">
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <Logo />
        <span className="w-10" />
      </header>
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="my-auto">
        <UserCircleIcon className="mx-auto h-16 w-16 text-gold-300" strokeWidth={1} />
        <h1 className="mt-4 text-center font-serif text-4xl font-semibold">{t('login.title')}</h1>
        <p className="mt-2 text-center text-white/60">{t('login.sub')}</p>
        <input
          autoFocus
          className="field mt-8"
          placeholder={t('login.placeholder')}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setNotFound(false)
          }}
        />
        {notFound && <p className="mt-3 text-center text-sm text-rose-200">{t('login.notFound')}</p>}
        <button type="submit" disabled={value.trim().length < 5} className="btn-gold mt-5 w-full">
          {t('login.cta')} <ArrowRightIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={onStart} className="mt-4 w-full py-2 text-sm text-gold-300">
          {t('login.start')}
        </button>
      </motion.form>
    </div>
  )
}
