import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { Jugador } from '../types'
import { edadDesde } from '../types'
import { JugadorForm } from './JugadorForm'

export function Plantel({ volver }: { volver: () => void }) {
  const { perfil } = useAuth()
  const esStaff =
    perfil?.rol === 'cuerpo_tecnico' || perfil?.rol === 'administracion'

  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState<Jugador | 'nuevo' | null>(null)

  async function cargar() {
    setCargando(true)
    setError(null)
    const { data, error } = await supabase
      .from('jugadores')
      .select('*')
      .order('numero_camiseta', { ascending: true, nullsFirst: false })
      .order('apellido', { ascending: true })
      .range(0, 999)
    if (error) setError(error.message)
    else setJugadores((data as Jugador[]) ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  if (editando) {
    return (
      <JugadorForm
        jugador={editando === 'nuevo' ? null : editando}
        onListo={() => {
          setEditando(null)
          cargar()
        }}
        onCancelar={() => setEditando(null)}
      />
    )
  }

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={volver}>
          ← Volver
        </button>
        <h2>Plantel</h2>
        <span />
      </header>

      <main className="main">
        {esStaff && (
          <button
            className="btn"
            type="button"
            onClick={() => setEditando('nuevo')}
          >
            + Agregar jugador
          </button>
        )}

        {cargando && (
          <div className="estado estado--probando">Cargando plantel...</div>
        )}
        {error && <div className="error">{error}</div>}

        {!cargando && !error && jugadores.length === 0 && (
          <p className="nota">
            Todavía no hay jugadores cargados.
            {esStaff ? ' Tocá "Agregar jugador" para empezar.' : ''}
          </p>
        )}

        <div className="lista-jugadores">
          {jugadores.map((j) => {
            const edad = edadDesde(j.fecha_nacimiento)
            const posiciones = [j.posicion_preferida, j.posicion_secundaria]
              .filter(Boolean)
              .join(' · ')
            const iniciales =
              `${j.nombre[0] ?? ''}${j.apellido[0] ?? ''}`.toUpperCase() || '?'
            return (
              <button
                key={j.id}
                className="jugador-card"
                type="button"
                onClick={() => esStaff && setEditando(j)}
                disabled={!esStaff}
              >
                <div className="jugador-foto">
                  {j.foto_url ? (
                    <img src={j.foto_url} alt={j.nombre} />
                  ) : (
                    <span>{iniciales}</span>
                  )}
                </div>
                <div className="jugador-datos">
                  <div className="jugador-nombre">
                    {j.numero_camiseta != null && (
                      <span className="dorsal">{j.numero_camiseta}</span>
                    )}
                    {j.nombre} {j.apellido}
                  </div>
                  <div className="jugador-sub">
                    {posiciones || 'Sin posición'}
                    {edad != null ? ` · ${edad} años` : ''}
                  </div>
                </div>
                {esStaff && <span className="chevron">›</span>}
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
