import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { puedeEditarDeportivo } from '../types'
import type { Evento } from '../types'
import { EntrenamientoForm } from './EntrenamientoForm'
import { PartidoStats } from './PartidoStats'

type Vista =
  | { t: 'lista' }
  | { t: 'form'; ent: Evento | null }
  | { t: 'stats'; ent: Evento }

export function Entrenamientos({ volver }: { volver: () => void }) {
  const { perfil } = useAuth()
  const esStaff = puedeEditarDeportivo(perfil?.rol)

  const [ents, setEnts] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vista, setVista] = useState<Vista>({ t: 'lista' })

  async function cargar() {
    setCargando(true)
    setError(null)
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('tipo', 'entrenamiento')
      .order('fecha', { ascending: false, nullsFirst: false })
      .range(0, 999)
    if (error) setError(error.message)
    else setEnts((data as Evento[]) ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  if (vista.t === 'form') {
    return (
      <EntrenamientoForm
        entrenamiento={vista.ent}
        onListo={() => {
          setVista({ t: 'lista' })
          cargar()
        }}
        onCancelar={() => setVista({ t: 'lista' })}
      />
    )
  }
  if (vista.t === 'stats') {
    return (
      <PartidoStats
        partido={vista.ent}
        esStaff={esStaff}
        onVolver={() => setVista({ t: 'lista' })}
      />
    )
  }

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={volver}>
          ← Volver
        </button>
        <h2>Entrenamientos</h2>
        <span />
      </header>

      <main className="main">
        {esStaff && (
          <button className="btn" type="button" onClick={() => setVista({ t: 'form', ent: null })}>
            + Nuevo entrenamiento
          </button>
        )}

        {cargando && <div className="estado estado--probando">Cargando...</div>}
        {error && <div className="error">{error}</div>}
        {!cargando && !error && ents.length === 0 && (
          <p className="nota">Todavía no hay entrenamientos cargados.</p>
        )}

        <div className="lista-jugadores">
          {ents.map((e) => (
            <div className="partido-card" key={e.id}>
              <button
                className="partido-main"
                type="button"
                onClick={() => setVista({ t: 'stats', ent: e })}
              >
                <div className="partido-info">
                  <div className="jugador-nombre">
                    {e.fecha ?? 'Sin fecha'}
                    {e.hora ? <span className="jugador-sub"> · {e.hora.slice(0, 5)}</span> : null}
                  </div>
                  <div className="jugador-sub">{e.nota ?? 'Entrenamiento'}</div>
                </div>
                <span className="chevron">›</span>
              </button>
              {esStaff && (
                <button
                  className="partido-editar"
                  type="button"
                  onClick={() => setVista({ t: 'form', ent: e })}
                >
                  ✎ Editar
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
