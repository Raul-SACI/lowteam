import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export function Login({ irARegistro }: { irARegistro: () => void }) {
  const { iniciarSesion } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    const err = await iniciarSesion(email.trim(), password)
    setEnviando(false)
    if (err) setError(traducirError(err))
  }

  return (
    <div className="auth">
      <header className="header">
        <div className="logo">LT</div>
        <h1>Low Team</h1>
        <p className="subtitulo">Ingresar</p>
      </header>

      <form className="form" onSubmit={onSubmit}>
        <label className="campo">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="campo">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn" type="submit" disabled={enviando}>
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p className="link-nota">
        ¿No tenés cuenta?{' '}
        <button className="link" type="button" onClick={irARegistro}>
          Crear Usuario
        </button>
      </p>
    </div>
  )
}

function traducirError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (msg.includes('Email not confirmed')) return 'El email todavia no fue confirmado.'
  return msg
}
