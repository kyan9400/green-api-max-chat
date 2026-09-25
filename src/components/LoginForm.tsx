import { useState, type FormEvent } from 'react'
import { DEFAULT_API_URL, DEMO_INSTANCE, GreenApiClient } from '../lib/greenApi'
import type { Credentials } from '../lib/types'

interface Props {
  onLogin: (creds: Credentials) => void
}

export function LoginForm({ onLogin }: Props) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const creds = { apiUrl: apiUrl.trim() || DEFAULT_API_URL, idInstance: idInstance.trim(), apiTokenInstance: apiTokenInstance.trim() }
    setError(null)
    setLoading(true)
    try {
      const { stateInstance } = await new GreenApiClient(creds).getStateInstance()
      if (stateInstance !== 'authorized') {
        setError(`Инстанс не авторизован (состояние: ${stateInstance}). Авторизуйте MAX в личном кабинете GREEN-API.`)
        return
      }
      onLogin(creds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось подключиться к GREEN-API')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo" aria-hidden="true">
          <LogoMark />
        </div>
        <h1>Вход в чат MAX</h1>
        <p className="login-hint">
          Введите данные инстанса из{' '}
          <a href="https://console.green-api.com/" target="_blank" rel="noreferrer">
            личного кабинета GREEN-API
          </a>
        </p>

        <label>
          idInstance
          <input
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            inputMode="numeric"
            placeholder="3100000001"
            required
            autoFocus
          />
        </label>
        <label>
          apiTokenInstance
          <input
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            type="password"
            placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd412345"
            required
          />
        </label>
        <details className="login-advanced">
          <summary>Дополнительно</summary>
          <label>
            apiUrl
            <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder={DEFAULT_API_URL} />
          </label>
        </details>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Подключение…' : 'Войти'}
        </button>
        <button
          type="button"
          className="link-btn demo-btn"
          onClick={() => onLogin({ apiUrl: DEFAULT_API_URL, idInstance: DEMO_INSTANCE, apiTokenInstance: DEMO_INSTANCE })}
        >
          Попробовать демо без аккаунта GREEN-API
        </button>
      </form>
    </div>
  )
}

export function LogoMark() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3d7bff" />
          <stop offset="1" stopColor="#8a4dff" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#logo-g)" />
      <path d="M14 33V16l10 10 10-10v17" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
