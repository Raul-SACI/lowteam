import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Jugador } from '../types'
import { staffJugadorIds } from '../lib/plantel'

type Filtro = 'oficiales' | 'todos'

interface StatRow {
  jugador_id: string
  asistencia: string
  goles: number
  asistencias: number
  minutos: number
  amarillas: number
  rojas: number
  evento: { tipo: string; es_oficial: boolean } | null
}

interface Total {
  jugador: Jugador
  pj: number
  goles: number
  asistencias: number
  minutos: number
  amarillas: number
  rojas: number
}

export function Estadisticas({ volver }: { volver: () => void }) {
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [stats, setStats] = useState<StatRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('oficiales')

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError(null)
      const [jr, sr, staff] = await Promise.all([
        supabase
          .from('jugadores')
          .select('*')
          .order('apellido', { ascending: true })
          .range(0, 999),
        supabase
          .from('estadisticas')
          .select(
            'jugador_id, asistencia, goles, asistencias, minutos, amarillas, rojas, evento:eventos(tipo, es_oficial)'
          )
          .range(0, 999),
        staffJugadorIds(),
      ])
      if (jr.error) setError(jr.error.message)
      if (sr.error) setError(sr.error.message)
      setJugadores(((jr.data as Jugador[]) ?? []).filter((j) => !staff.has(j.id)))
      setStats((sr.data as unknown as StatRow[]) ?? [])
      setCargando(false)
    }
    cargar()
  }, [])

  const totales = useMemo<Total[]>(() => {
    const map = new Map<string, Total>()
    jugadores.forEach((j) =>
      map.set(j.id, {
        jugador: j,
        pj: 0,
        goles: 0,
        asistencias: 0,
        minutos: 0,
        amarillas: 0,
        rojas: 0,
      })
    )
    stats.forEach((s) => {
      const ev = s.evento
      const incluir =
        filtro === 'todos'
          ? true
          : ev?.tipo === 'partido' && ev?.es_oficial === true
      if (!incluir) return
      const t = map.get(s.jugador_id)
      if (!t) return
      if (s.asistencia === 'presente' || s.asistencia === 'tarde') t.pj += 1
      t.goles += s.goles || 0
      t.asistencias += s.asistencias || 0
      t.minutos += s.minutos || 0
      t.amarillas += s.amarillas || 0
      t.rojas += s.rojas || 0
    })
    return Array.from(map.values()).sort(
      (a, b) =>
        b.goles - a.goles ||
        b.asistencias - a.asistencias ||
        a.jugador.apellido.localeCompare(b.jugador.apellido)
    )
  }, [jugadores, stats, filtro])

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={volver}>
          ← Volver
        </button>
        <h2>Estadísticas</h2>
        <span />
      </header>

      <main className="main">
        <div className="segmento">
          <button
            className={filtro === 'oficiales' ? 'seg-activo' : ''}
            type="button"
            onClick={() => setFiltro('oficiales')}
          >
            Solo oficiales
          </button>
          <button
            className={filtro === 'todos' ? 'seg-activo' : ''}
            type="button"
            onClick={() => setFiltro('todos')}
          >
            Todos
          </button>
        </div>

        {cargando && <div className="estado estado--probando">Cargando...</div>}
        {error && <div className="error">{error}</div>}

        {!cargando && !error && (
          <div className="tabla-scroll">
            <table className="tabla-resumen">
              <thead>
                <tr>
                  <th className="col-nom">Jugador</th>
                  <th title="Presencias (presente o llegó tarde)">PJ</th>
                  <th title="Goles">G</th>
                  <th title="Asistencias">A</th>
                  <th title="Minutos">Min</th>
                  <th title="Amarillas">Am</th>
                  <th title="Rojas">Ro</th>
                </tr>
              </thead>
              <tbody>
                {totales.map((t) => (
                  <tr key={t.jugador.id}>
                    <td className="col-nom">
                      {t.jugador.numero_camiseta != null && (
                        <span className="dorsal-mini">{t.jugador.numero_camiseta}</span>
                      )}
                      {t.jugador.nombre} {t.jugador.apellido}
                    </td>
                    <td>{t.pj || ''}</td>
                    <td className={t.goles ? 'celda-destacada' : ''}>{t.goles || ''}</td>
                    <td>{t.asistencias || ''}</td>
                    <td>{t.minutos || ''}</td>
                    <td>{t.amarillas || ''}</td>
                    <td>{t.rojas || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="nota">
          {filtro === 'oficiales'
            ? 'Mostrando solo partidos oficiales.'
            : 'Mostrando todo (oficiales, amistosos y entrenamientos).'}
        </p>
      </main>
    </div>
  )
}
