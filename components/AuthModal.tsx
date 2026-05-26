import { useState } from 'react'
import { signIn, signUp } from '../lib/auth'

type Props = {
  onSuccess: () => void
}

export function AuthModal({ onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        onSuccess()
      } else {
        await signUp(email, password, fullName)
        setMessage('Revisa tu email para confirmar la cuenta.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-[32px] border border-black/10 bg-[#f5ecdf] p-6 shadow-[0_24px_80px_rgba(44,30,15,0.15)]">
        
        <p className="text-xs uppercase tracking-[0.36em] text-stone-500">Dog-id</p>
        <h2 className="mt-1 font-display text-4xl text-stone-950">
          {mode === 'login' ? 'Acceder' : 'Registrarse'}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          {mode === 'login'
            ? 'Accede para gestionar el pasaporte de tu mascota.'
            : 'Crea tu cuenta de propietario.'}
        </p>

        <div className="mt-6 space-y-3">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-stone-500">Nombre completo</span>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Tu nombre"
                className="field-input"
              />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-stone-500">Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="field-input"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-stone-500">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="field-input"
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-5 w-full rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
          className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
        >
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Accede'}
        </button>
      </div>
    </div>
  )
}