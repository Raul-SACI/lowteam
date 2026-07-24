import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Cuota, Jugador, Pago } from '../types'
import { hoyLocal } from '../types'

interface Row {
  pagado: boolean
  fecha_pago: string | null
}

export function PagosCuota({ cuota, onVolver }: { cuota: Cuota; onVolver: () => void }) {
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [rows, setRows] = useState<Record<string, Row>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [okMsg, setOkMsg] = useState(false)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      const [jr, pr] = await Promise.all([
        supabase
          .from('jugadores')
          .select('*')
          .order('apellido', { ascending: true })
          .range(0, 999),
        supabase.from('pagos').select('*').eq('cuota_id', cuota.id).range(0, 999),
      ])
      const js = (jr.data as Jugador[]) ?? []
      const ps = (pr.data as Pago[]) ?? []
      setJugadores(js)
      const map: Record<string, Row> = {}
      js.forEach((j) => {
        const p = ps.find((x) => x.jugador_id === j.id)
        map[j.id] = { pagado: p?.pagado ?? false, fecha_pago: p?.fecha_pago ?? null }
      })
      setRows(map)
      setCargando(false)
    }
    cargar()
  }, [cuota.id])

  function toggle(id: string) {
    setOkMsg(false)
    setRows((r) => {
      const actual = r[id]
      const pagado = !actual.pagado
      return {
        ...r,
        [id]: {
          pagado,
          fecha_pago: pagado ? actual.fecha_pago ?? hoyLocal() : actual.fecha_pago,
        },
      }
    })
  }

  function setFecha(id: string, v: string) {
    setOkMsg(false)
    setRows((r) => ({ ...r, [id]: { ...r[id], fecha_pago: v || null } }))
  }

  async function guardar() {
    setGuardando(true)
    setError(null)
    const payload = jugadores.map((j) => ({
      cuota_id: cuota.id,
      jugador_id: j.id,
      pagado: rows[j.id].pagado,
      fecha_pago: rows[j.id].pagado ? rows[j.id].fecha_pago : null,
    }))
    const { error } = await supabase
      .from('pagos')
      .upsert(payload, { onConflict: 'cuota_id,jugador_id' })
    setGuardando(false)
    if (error) setError(error.message)
    else setOkMsg(true)
  }

  const pagados = Object.values(rows).filter((r) => r.pagado).length

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={onVolver}>
          ← Volver
        </button>
        <h2>Pagos</h2>
        <span />
      </header>

      <main className="main">
        <div className="tarjeta">
          <p className="saludo">{cuota.concepto}</p>
          <p className="nota">
            Vence: {cuota.fecha_vencimiento}
            {cuota.monto != null ? ` · $${cuota.monto}` : ''} · Pagaron {pagados}/{jugadores.length}
          </p>
        </div>

        {cargando && <div className="estado estado--probando">Cargando...</div>}
        {error && <div className="error">{error}</div>}

        <div className="lista-jugadores">
          {jugadores.map((j) => {
            const r = rows[j.id]
            if (!r) return null
            return (
              <div className="pago-card" key={j.id}>
                <label className="pago-check">
                  <input type="checkbox" checked={r.pagado} onChange={() => toggle(j.id)} />
                  <span className="jugador-nombre">
                    {j.numero_camiseta != null && <span className="dorsal">{j.numero_camiseta}</span>}
                    {j.nombre} {j.apellido}
                  </span>
                </label>
                {r.pagado && (
                  <input
                    className="pago-fecha"
                    type="date"
                    value={r.fecha_pago ?? ''}
                    onChange={(e) => setFecha(j.id, e.target.value)}
                  />
                )}
              </div>
            )
          })}
        </div>

        <button className="btn" type="button" onClick={guardar} disabled={guardando || cargando}>
          {guardando ? 'Guardando...' : 'Guardar pagos'}
        </button>
        {okMsg && <div className="estado estado--ok">Pagos guardados ✅</div>}
      </main>
    </div>
  )
}
