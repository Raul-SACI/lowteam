import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { POSICIONES, TALLES } from '../types'
import { Logo } from '../components/Logo'

export function Registro({ irALogin }: { irALogin: () => void }) {
  const { registrar } = useAuth()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [dni, setDni] = useState('')
  const [posicion, setPosicion] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [talle, setTalle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setEnviando(true)
    const err = await registrar({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      dni: dni.trim(),
      posicion_preferida: posicion,
      fecha_nacimiento: fechaNac,
      talle,
      email: email.trim(),
      password,
    })
    setEnviando(false)
    if (err) {
      setError(traducirError(err))
    } else {
      setOk(true)
    }
  }

  if (ok) {
    return (
      <div className="auth">
        <header className="header">
          <Logo />
          <h1>Low Team</h1>
        </header>
        <div className="estado estado--ok">
          Usuario creado. Ya podés ingresar con tu email y contraseña.
        </div>
        <button className="btn" type="button" onClick={irALogin}>
          Ir a Ingresar
        </button>
      </div>
    )
  }

  return (
    <div className="auth">
      <header className="header">
        <Logo />
        <h1>Low Team</h1>
        <p className="subtitulo">Crear Usuario</p>
      </header>

      <form className="form" onSubmit={onSubmit}>
        <label className="campo">
          <span>Nombre</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>
        <label className="campo">
          <span>Apellido</span>
          <input value={apellido} onChange={(e) => setApellido(e.target.value)} required />
        </label>
        <label className="campo">
          <span>DNI</span>
          <input
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="campo">
          <span>Posición preferida <em className="opcional">(dejala vacía si no sos jugador)</em></span>
          <select value={posicion} onChange={(e) => setPosicion(e.target.value)}>
            <option value="">Elegir...</option>
            {POSICIONES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Fecha de nacimiento</span>
          <input
            type="date"
            value={fechaNac}
            onChange={(e) => setFechaNac(e.target.value)}
          />
        </label>
        <label className="campo">
          <span>Talle</span>
          <select value={talle} onChange={(e) => setTalle(e.target.value)}>
            <option value="">Elegir...</option>
            {TALLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <div className="separador">Datos para ingresar</div>

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
            autoComplete="new-password"
            required
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn" type="submit" disabled={enviando}>
          {enviando ? 'Creando...' : 'Crear Usuario'}
        </button>
      </form>

      <p className="link-nota">
        ¿Ya tenés cuenta?{' '}
        <button className="link" type="button" onClick={irALogin}>
          Ingresar
        </button>
      </p>
    </div>
  )
}

function traducirError(msg: string): string {
  if (msg.includes('already registered')) return 'Ese email ya esta registrado.'
  if (msg.includes('valid email')) return 'Ingresá un email válido.'
  return msg
}
