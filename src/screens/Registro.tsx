import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabase'
import { POSICIONES, TALLES, PIES } from '../types'
import { Logo } from '../components/Logo'

export function Registro({ irALogin }: { irALogin: () => void }) {
  const { registrar } = useAuth()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [dni, setDni] = useState('')
  const [numero, setNumero] = useState('')
  const [pos1, setPos1] = useState('')
  const [pos2, setPos2] = useState('')
  const [pie, setPie] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [talle, setTalle] = useState('')
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selfie, setSelfie] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [ocupados, setOcupados] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    // Traemos los numeros de camiseta ya ocupados (sin datos personales).
    async function cargarOcupados() {
      const { data, error } = await supabase.rpc('numeros_camiseta_ocupados')
      if (!error && Array.isArray(data)) setOcupados(data as number[])
    }
    cargarOcupados()
  }, [])

  const numeroOcupado =
    numero.trim() !== '' && ocupados.includes(Number(numero))

  function onSelfie(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setSelfie(f)
    if (f) setSelfiePreview(URL.createObjectURL(f))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (numeroOcupado) {
      setError('Ese número de camiseta ya está ocupado. Elegí otro.')
      return
    }
    setEnviando(true)
    const err = await registrar(
      {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        posicion_preferida: pos1,
        posicion_secundaria: pos2,
        pie_habil: pie,
        telefono: telefono.trim(),
        numero_camiseta: numero.trim(),
        fecha_nacimiento: fechaNac,
        talle,
        peso: peso.trim(),
        altura: altura.trim(),
        email: email.trim(),
        password,
      },
      selfie
    )
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

  const iniciales = `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase() || '?'

  return (
    <div className="auth">
      <header className="header">
        <Logo />
        <h1>Low Team</h1>
        <p className="subtitulo">Crear Usuario</p>
      </header>

      <form className="form" onSubmit={onSubmit}>
        <div className="foto-editor">
          <div className="foto-preview">
            {selfiePreview ? (
              <img src={selfiePreview} alt="Selfie" />
            ) : (
              <span className="foto-iniciales">{iniciales}</span>
            )}
          </div>
          <label className="btn btn--secundario foto-boton">
            {selfiePreview ? 'Sacar otra' : '📸 Sacate una selfie'}
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={onSelfie}
              hidden
            />
          </label>
          <span className="opcional">Opcional</span>
        </div>

        <label className="campo">
          <span>Nombre</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>
        <label className="campo">
          <span>Apellido</span>
          <input value={apellido} onChange={(e) => setApellido(e.target.value)} required />
        </label>

        <div className="fila-2">
          <label className="campo">
            <span>N° camiseta</span>
            <input
              type="number"
              inputMode="numeric"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className={numeroOcupado ? 'input-error' : ''}
            />
          </label>
          <label className="campo">
            <span>DNI</span>
            <input value={dni} onChange={(e) => setDni(e.target.value)} inputMode="numeric" />
          </label>
        </div>
        {numeroOcupado && (
          <div className="aviso-error">Ese número ya está ocupado, elegí otro.</div>
        )}

        <label className="campo">
          <span>Posición preferida <em className="opcional">(dejala vacía si no sos jugador)</em></span>
          <select value={pos1} onChange={(e) => setPos1(e.target.value)}>
            <option value="">Elegir...</option>
            {POSICIONES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Segunda posición <em className="opcional">(opcional)</em></span>
          <select value={pos2} onChange={(e) => setPos2(e.target.value)}>
            <option value="">Elegir...</option>
            {POSICIONES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <div className="fila-2">
          <label className="campo">
            <span>Pie hábil</span>
            <select value={pie} onChange={(e) => setPie(e.target.value)}>
              <option value="">Elegir...</option>
              {PIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
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
        </div>

        <label className="campo">
          <span>Teléfono</span>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            inputMode="tel"
          />
        </label>

        <div className="fila-2">
          <label className="campo">
            <span>Peso (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Altura (cm)</span>
            <input
              type="number"
              inputMode="decimal"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
            />
          </label>
        </div>
        <label className="campo">
          <span>Fecha de nacimiento</span>
          <input
            type="date"
            value={fechaNac}
            onChange={(e) => setFechaNac(e.target.value)}
          />
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

        <button className="btn" type="submit" disabled={enviando || numeroOcupado}>
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
  if (msg.toLowerCase().includes('duplicate') || msg.includes('jugadores_numero_unico'))
    return 'Ese número de camiseta ya está ocupado. Elegí otro.'
  return msg
}
