import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Evento, Jugador, Estadistica, Asistencia, MetricaKey } from '../types'
import { ASISTENCIAS, ASISTENCIA_LABEL, ASISTENCIA_CORTO, METRICAS } from '../types'

interface Fila {
  asistencia: Asistencia
  goles: number
  asistencias: number
  minutos: number
  amarillas: number
  rojas: number
}

function filaVacia(): Fila {
  return {
    asistencia: 'presente',
    goles: 0,
    asistencias: 0,
    minutos: 0,
    amarillas: 0,
    rojas: 0,
  }
}

export function PartidoStats({
  partido,
  esStaff,
  onVolver,
}: {
  partido: Evento
  esStaff: boolean
  onVolver: () => void
}) {
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [filas, setFilas] = useState<Record<string, Fila>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [okMsg, setOkMsg] = useState(false)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      const [jr, er] = await Promise.all([
        supabase
          .from('jugadores')
          .select('*')
          .order('numero_camiseta', { ascending: true, nullsFirst: false })
          .order('apellido', { ascending: true })
          .range(0, 999),
        supabase.from('estadisticas').select('*').eq('evento_id', partido.id).range(0, 999),
      ])
      if (jr.error) setError(jr.error.message)
      const js = (jr.data as Jugador[]) ?? []
      setJugadores(js)
      const previas = (er.data as Estadistica[]) ?? []
      const map: Record<string, Fila> = {}
      js.forEach((j) => {
        const p = previas.find((x) => x.jugador_id === j.id)
        map[j.id] = p
          ? {
              asistencia: p.asistencia,
              goles: p.goles,
              asistencias: p.asistencias,
              minutos: p.minutos,
              amarillas: p.amarillas,
              rojas: p.rojas,
            }
          : filaVacia()
      })
      setFilas(map)
      setCargando(false)
    }
    cargar()
  }, [partido.id])

  function setAsist(id: string, v: Asistencia) {
    setFilas((f) => ({ ...f, [id]: { ...f[id], asistencia: v } }))
    setOkMsg(false)
  }
  function setNum(id: string, key: MetricaKey, v: string) {
    const n = v === '' ? 0 : Math.max(0, Number(v))
    setFilas((f) => ({ ...f, [id]: { ...f[id], [key]: n } }))
    setOkMsg(false)
  }

  async function guardar() {
    setGuardando(true)
    setError(null)
    const rows = jugadores.map((j) => ({
      evento_id: partido.id,
      jugador_id: j.id,
      ...filas[j.id],
    }))
    const { error } = await supabase
      .from('estadisticas')
      .upsert(rows, { onConflict: 'evento_id,jugador_id' })
    setGuardando(false)
    if (error) {
      setError(
        error.message.toLowerCase().includes('row-level security')
          ? 'No tenés permiso (solo el staff puede editar).'
          : error.message
      )
    } else {
      setOkMsg(true)
    }
  }

  const titulo = `${partido.rival ?? 'Partido'}${partido.fecha ? ' · ' + partido.fecha : ''}`

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={onVolver}>
          ← Volver
        </button>
        <h2>Estadísticas</h2>
        <span />
      </header>

      <main className="main">
        <div className="tarjeta">
          <p className="saludo">{titulo}</p>
          <p className="nota">
            {esStaff
              ? 'Cargá la asistencia y los números de cada jugador. Al final, "Guardar".'
              : 'Estadísticas del partido (solo lectura).'}
          </p>
        </div>

        {cargando && <div className="estado estado--probando">Cargando...</div>}
        {error && <div className="error">{error}</div>}

        <div className="stats-lista">
          {jugadores.map((j) => {
            const fila = filas[j.id]
            if (!fila) return null
            return (
              <div className="stat-card" key={j.id}>
                <div className="stat-nombre">
                  {j.numero_camiseta != null && <span className="dorsal">{j.numero_camiseta}</span>}
                  {j.nombre} {j.apellido}
                </div>
                <select
                  className="stat-asist"
                  value={fila.asistencia}
                  onChange={(e) => setAsist(j.id, e.target.value as Asistencia)}
                  disabled={!esStaff}
                >
                  {ASISTENCIAS.map((a) => (
                    <option key={a} value={a}>
                      {ASISTENCIA_LABEL[a]}
                    </option>
                  ))}
                </select>
                <div className="stat-metricas">
                  {METRICAS.map((m) => (
                    <label className="stat-num" key={m.key}>
                      <span title={m.label}>{m.corto}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={fila[m.key] === 0 ? '' : fila[m.key]}
                        placeholder="0"
                        onChange={(e) => setNum(j.id, m.key, e.target.value)}
                        disabled={!esStaff}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {esStaff && (
          <button className="btn" type="button" onClick={guardar} disabled={guardando || cargando}>
            {guardando ? 'Guardando...' : 'Guardar estadísticas'}
          </button>
        )}
        {okMsg && <div className="estado estado--ok">Estadísticas guardadas ✅</div>}

        {!cargando && jugadores.length > 0 && (
          <>
            <h3 className="resumen-titulo">Resumen</h3>
            <div className="tabla-scroll">
              <table className="tabla-resumen">
                <thead>
                  <tr>
                    <th className="col-num">#</th>
                    <th className="col-nom">Jugador</th>
                    <th>As</th>
                    {METRICAS.map((m) => (
                      <th key={m.key} title={m.label}>
                        {m.corto}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jugadores.map((j) => {
                    const f = filas[j.id]
                    if (!f) return null
                    return (
                      <tr key={j.id}>
                        <td className="col-num">{j.numero_camiseta ?? ''}</td>
                        <td className="col-nom">
                          {j.nombre} {j.apellido}
                        </td>
                        <td className={f.asistencia === 'ausente' ? 'celda-aus' : ''}>
                          {ASISTENCIA_CORTO[f.asistencia]}
                        </td>
                        {METRICAS.map((m) => (
                          <td key={m.key}>{f[m.key] || ''}</td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
