import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Cuota } from '../types'
import { estadoCuota, ESTADO_PAGO_LABEL } from '../types'
import { PagosCuota } from './PagosCuota'

type Vista = { t: 'lista' } | { t: 'form' } | { t: 'cuota'; cuota: Cuota }

export function PagosAdmin({ volver }: { volver: () => void }) {
  const [cuotas, setCuotas] = useState<Cuota[]>([])
  const [conteo, setConteo] = useState<Record<string, number>>({})
  const [totalJug, setTotalJug] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vista, setVista] = useState<Vista>({ t: 'lista' })

  // form nueva cuota
  const [concepto, setConcepto] = useState('')
  const [venc, setVenc] = useState('')
  const [monto, setMonto] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    setError(null)
    const [cr, pr, jr] = await Promise.all([
      supabase
        .from('cuotas')
        .select('*')
        .order('fecha_vencimiento', { ascending: false })
        .range(0, 999),
      supabase.from('pagos').select('cuota_id, pagado').range(0, 9999),
      supabase.from('jugadores').select('id').range(0, 999),
    ])
    if (cr.error) setError(cr.error.message)
    setCuotas((cr.data as Cuota[]) ?? [])
    const cnt: Record<string, number> = {}
    ;((pr.data as { cuota_id: string; pagado: boolean }[]) ?? []).forEach((p) => {
      if (p.pagado) cnt[p.cuota_id] = (cnt[p.cuota_id] ?? 0) + 1
    })
    setConteo(cnt)
    setTotalJug(((jr.data as { id: string }[]) ?? []).length)
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function crearCuota(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    const { error } = await supabase.from('cuotas').insert({
      concepto: concepto.trim(),
      fecha_vencimiento: venc,
      monto: monto.trim() ? Number(monto) : null,
    })
    setGuardando(false)
    if (error) setError(error.message)
    else {
      setConcepto('')
      setVenc('')
      setMonto('')
      setVista({ t: 'lista' })
      cargar()
    }
  }

  if (vista.t === 'cuota') {
    return (
      <PagosCuota
        cuota={vista.cuota}
        onVolver={() => {
          setVista({ t: 'lista' })
          cargar()
        }}
      />
    )
  }

  if (vista.t === 'form') {
    return (
      <div className="app">
        <header className="barra">
          <button className="volver" type="button" onClick={() => setVista({ t: 'lista' })}>
            ← Volver
          </button>
          <h2>Nueva cuota</h2>
          <span />
        </header>
        <main className="main">
          <form className="form" onSubmit={crearCuota}>
            <label className="campo">
              <span>Concepto</span>
              <input
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej: Cuota Julio"
                required
              />
            </label>
            <div className="fila-2">
              <label className="campo">
                <span>Vencimiento</span>
                <input type="date" value={venc} onChange={(e) => setVenc(e.target.value)} required />
              </label>
              <label className="campo">
                <span>Monto</span>
                <input type="number" inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} />
              </label>
            </div>
            {error && <div className="error">{error}</div>}
            <button className="btn" type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Crear cuota'}
            </button>
          </form>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={volver}>
          ← Volver
        </button>
        <h2>Pagos</h2>
        <span />
      </header>

      <main className="main">
        <button className="btn" type="button" onClick={() => setVista({ t: 'form' })}>
          + Nueva cuota
        </button>

        {cargando && <div className="estado estado--probando">Cargando...</div>}
        {error && <div className="error">{error}</div>}
        {!cargando && !error && cuotas.length === 0 && (
          <p className="nota">Todavía no hay cuotas cargadas.</p>
        )}

        <div className="lista-jugadores">
          {cuotas.map((c) => {
            const est = estadoCuota(c.fecha_vencimiento, false)
            return (
              <button
                className="jugador-card"
                type="button"
                key={c.id}
                onClick={() => setVista({ t: 'cuota', cuota: c })}
              >
                <div className="jugador-datos">
                  <div className="jugador-nombre">
                    {c.concepto}
                    {c.monto != null && <span className="tag tag--am">${c.monto}</span>}
                  </div>
                  <div className="jugador-sub">
                    Vence {c.fecha_vencimiento} · Pagaron {conteo[c.id] ?? 0}/{totalJug}
                    <span className={`estado-pago estado-pago--${est}`}>{ESTADO_PAGO_LABEL[est]}</span>
                  </div>
                </div>
                <span className="chevron">›</span>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
