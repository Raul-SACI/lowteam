import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { Evento } from '../types'
import { puedeEditarDeportivo } from '../types'
import { EntrenamientoForm } from './EntrenamientoForm'
import { EntrenamientoDetalle } from './EntrenamientoDetalle'
import { PartidoStats } from './PartidoStats'
import { Biblioteca } from './Biblioteca'
import { Calendario } from './Calendario'

type Vista =
  | { t: 'lista' }
  | { t: 'form'; ent: Evento | null }
  | { t: 'detalle'; ent: Evento }
  | { t: 'stats'; ent: Evento }
  | { t: 'biblioteca' }

export function Entrenamientos({ volver }: { volver: () => void }) {
  const { rolEfectivo } = useAuth()
  const esStaff = puedeEditarDeportivo(rolEfectivo)

  const [ents, setEnts] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vista, setVista] = useState<Vista>({ t: 'lista' })
  const [modo, setModo] = useState<'lista' | 'calendario'>('lista')

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

  if (vista.t === 'biblioteca') {
    return <Biblioteca volver={() => setVista({ t: 'lista' })} />
  }
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
  if (vista.t === 'detalle') {
    return (
      <EntrenamientoDetalle
        ent={vista.ent}
        esStaff={esStaff}
        onVolver={() => setVista({ t: 'lista' })}
        onEditar={() => setVista({ t: 'form', ent: vista.ent })}
        onCargarStats={() => setVista({ t: 'stats', ent: vista.ent })}
      />
    )
  }
  if (vista.t === 'stats') {
    return (
      <PartidoStats
        partido={vista.ent}
        esStaff={esStaff}
        onVolver={() => setVista({ t: 'detalle', ent: vista.ent })}
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
          <div className="botones-fila">
            <button className="btn" type="button" onClick={() => setVista({ t: 'form', ent: null })}>
              + Nuevo
            </button>
            <button className="btn btn--secundario" type="button" onClick={() => setVista({ t: 'biblioteca' })}>
              Ejercicios
            </button>
          </div>
        )}

        <div className="segmento">
          <button
            className={modo === 'lista' ? 'seg-activo' : ''}
            type="button"
            onClick={() => setModo('lista')}
          >
            Lista
          </button>
          <button
            className={modo === 'calendario' ? 'seg-activo' : ''}
            type="button"
            onClick={() => setModo('calendario')}
          >
            Calendario
          </button>
        </div>

        {cargando && <div className="estado estado--probando">Cargando...</div>}
        {error && <div className="error">{error}</div>}
        {!cargando && !error && ents.length === 0 && (
          <p className="nota">Todavía no hay entrenamientos cargados.</p>
        )}

        {modo === 'calendario' ? (
          <Calendario
            entrenamientos={ents}
            onSelect={(e) => setVista({ t: 'detalle', ent: e })}
          />
        ) : (
          <div className="lista-jugadores">
            {ents.map((e) => (
              <button
                className="jugador-card"
                type="button"
                key={e.id}
                onClick={() => setVista({ t: 'detalle', ent: e })}
              >
                <div className="jugador-datos">
                  <div className="jugador-nombre">
                    {e.fecha ?? 'Sin fecha'}
                    {e.hora ? ` · ${e.hora.slice(0, 5)}` : ''}
                  </div>
                  <div className="jugador-sub">{e.nota ?? 'Entrenamiento'}</div>
                </div>
                <span className="chevron">›</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
