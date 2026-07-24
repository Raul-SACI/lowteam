import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { Rol } from '../types'
import { ROL_LABEL, ROLES } from '../types'

interface PerfilRow {
  id: string
  rol: Rol
  jugador: { nombre: string; apellido: string; numero_camiseta: number | null } | null
}

export function Usuarios({ volver }: { volver: () => void }) {
  const { session } = useAuth()
  const miId = session?.user.id

  const [perfiles, setPerfiles] = useState<PerfilRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardandoId, setGuardandoId] = useState<string | null>(null)

  async function cargar() {
    setCargando(true)
    setError(null)
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, rol, jugador:jugadores(nombre, apellido, numero_camiseta)')
      .range(0, 999)
    if (error) setError(error.message)
    else setPerfiles((data as unknown as PerfilRow[]) ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function cambiarRol(id: string, rol: Rol) {
    setGuardandoId(id)
    setError(null)
    const { error } = await supabase.from('perfiles').update({ rol }).eq('id', id)
    setGuardandoId(null)
    if (error) {
      setError(
        error.message.toLowerCase().includes('row-level security')
          ? 'Solo el Administrador puede cambiar roles.'
          : error.message
      )
    } else {
      setPerfiles((ps) => ps.map((p) => (p.id === id ? { ...p, rol } : p)))
    }
  }

  const ordenados = [...perfiles].sort((a, b) => {
    const na = a.jugador ? `${a.jugador.apellido} ${a.jugador.nombre}` : 'zzz'
    const nb = b.jugador ? `${b.jugador.apellido} ${b.jugador.nombre}` : 'zzz'
    return na.localeCompare(nb)
  })

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={volver}>
          ← Volver
        </button>
        <h2>Usuarios</h2>
        <span />
      </header>

      <main className="main">
        <p className="nota">
          Asigná el rol de cada persona. Los nuevos registros entran como
          Jugador hasta que los cambies acá.
        </p>

        {cargando && <div className="estado estado--probando">Cargando...</div>}
        {error && <div className="error">{error}</div>}

        <div className="lista-jugadores">
          {ordenados.map((p) => {
            const nombre = p.jugador
              ? `${p.jugador.nombre} ${p.jugador.apellido}`.trim()
              : 'Sin ficha'
            const soyYo = p.id === miId
            return (
              <div className="usuario-card" key={p.id}>
                <div className="jugador-nombre">
                  {p.jugador?.numero_camiseta != null && (
                    <span className="dorsal">{p.jugador.numero_camiseta}</span>
                  )}
                  {nombre}
                  {soyYo && <span className="yo-tag">vos</span>}
                </div>
                <select
                  className="stat-asist"
                  value={p.rol}
                  onChange={(e) => cambiarRol(p.id, e.target.value as Rol)}
                  disabled={soyYo || guardandoId === p.id}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROL_LABEL[r]}
                    </option>
                  ))}
                </select>
                {soyYo && (
                  <p className="usuario-nota">No podés cambiar tu propio rol (para no quedarte sin acceso).</p>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
