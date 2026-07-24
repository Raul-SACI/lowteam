import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { Evento } from '../types'
import { PartidoForm } from './PartidoForm'
import { PartidoStats } from './PartidoStats'

type Vista =
  | { t: 'lista' }
  | { t: 'form'; partido: Evento | null }
  | { t: 'stats'; partido: Evento }

export function Partidos({ volver }: { volver: () => void }) {
  const { perfil } = useAuth()
  const esStaff = perfil?.rol === 'cuerpo_tecnico' || perfil?.rol === 'administracion'

  const [partidos, setPartidos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vista, setVista] = useState<Vista>({ t: 'lista' })

  async function cargar() {
    setCargando(true)
    setError(null)
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('tipo', 'partido')
      .order('fecha', { ascending: false, nullsFirst: false })
      .range(0, 999)
    if (error) setError(error.message)
    else setPartidos((data as Evento[]) ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  if (vista.t === 'form') {
    return (
      <PartidoForm
        partido={vista.partido}
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
        partido={vista.partido}
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
        <h2>Partidos</h2>
        <span />
      </header>

      <main className="main">
        {esStaff && (
          <button className="btn" type="button" onClick={() => setVista({ t: 'form', partido: null })}>
            + Nuevo partido
          </button>
        )}

        {cargando && <div className="estado estado--probando">Cargando partidos...</div>}
        {error && <div className="error">{error}</div>}
        {!cargando && !error && partidos.length === 0 && (
          <p className="nota">Todavía no hay partidos cargados.</p>
        )}

        <div className="lista-jugadores">
          {partidos.map((p) => {
            const hayResultado = p.goles_favor != null && p.goles_contra != null
            return (
              <div className="partido-card" key={p.id}>
                <button
                  className="partido-main"
                  type="button"
                  onClick={() => setVista({ t: 'stats', partido: p })}
                >
                  <div className="partido-info">
                    <div className="jugador-nombre">
                      {p.rival ?? 'Rival sin nombre'}
                      <span className={`tag ${p.es_oficial ? 'tag--of' : 'tag--am'}`}>
                        {p.es_oficial ? 'Oficial' : 'Amistoso'}
                      </span>
                    </div>
                    <div className="jugador-sub">
                      {p.fecha ?? 'Sin fecha'}
                      {p.condicion ? ` · ${p.condicion === 'local' ? 'Local' : 'Visitante'}` : ''}
                    </div>
                  </div>
                  <div className="partido-resultado">
                    {hayResultado ? `${p.goles_favor} - ${p.goles_contra}` : '–'}
                  </div>
                </button>
                {esStaff && (
                  <button
                    className="partido-editar"
                    type="button"
                    onClick={() => setVista({ t: 'form', partido: p })}
                  >
                    ✎ Editar
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
