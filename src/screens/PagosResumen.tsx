import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Cuota, Gasto } from '../types'
import { hoyLocal } from '../types'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
function pad(n: number) {
  return String(n).padStart(2, '0')
}
function money(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

interface JugMin {
  id: string
  nombre: string
  apellido: string
  numero_camiseta: number | null
}
interface PagoRow {
  cuota_id: string
  jugador_id: string
  pagado: boolean
  fecha_pago: string | null
  cuota: { monto: number | null } | null
}

export function PagosResumen() {
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())

  const [cuotas, setCuotas] = useState<Cuota[]>([])
  const [pagos, setPagos] = useState<PagoRow[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [jugadores, setJugadores] = useState<JugMin[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError(null)
      const [cr, pr, gr, jr] = await Promise.all([
        supabase.from('cuotas').select('*').range(0, 999),
        supabase.from('pagos').select('cuota_id, jugador_id, pagado, fecha_pago, cuota:cuotas(monto)').range(0, 9999),
        supabase.from('gastos').select('*').range(0, 9999),
        supabase.from('jugadores').select('id, nombre, apellido, numero_camiseta').range(0, 999),
      ])
      if (cr.error || pr.error || gr.error || jr.error) {
        setError(cr.error?.message || pr.error?.message || gr.error?.message || jr.error?.message || 'Error')
      }
      setCuotas((cr.data as Cuota[]) ?? [])
      setPagos((pr.data as unknown as PagoRow[]) ?? [])
      setGastos((gr.data as Gasto[]) ?? [])
      setJugadores((jr.data as JugMin[]) ?? [])
      setCargando(false)
    }
    cargar()
  }, [])

  const prefijo = `${anio}-${pad(mes + 1)}`

  const ingresos = useMemo(
    () =>
      pagos
        .filter((p) => p.pagado && p.fecha_pago && p.fecha_pago.startsWith(prefijo))
        .reduce((s, p) => s + Number(p.cuota?.monto ?? 0), 0),
    [pagos, prefijo]
  )
  const egresos = useMemo(
    () => gastos.filter((g) => g.fecha.startsWith(prefijo)).reduce((s, g) => s + Number(g.monto), 0),
    [gastos, prefijo]
  )
  const saldo = ingresos - egresos

  const deudores = useMemo(() => {
    const hoyStr = hoyLocal()
    const vencidas = cuotas.filter((c) => c.fecha_vencimiento < hoyStr)
    const pagadoSet = new Set(pagos.filter((p) => p.pagado).map((p) => `${p.cuota_id}|${p.jugador_id}`))
    return jugadores
      .map((j) => {
        const imp = vencidas.filter((c) => !pagadoSet.has(`${c.id}|${j.id}`))
        const total = imp.reduce((s, c) => s + Number(c.monto ?? 0), 0)
        return { jugador: j, cantidad: imp.length, total }
      })
      .filter((d) => d.cantidad > 0)
      .sort((a, b) => b.total - a.total || b.cantidad - a.cantidad)
  }, [cuotas, pagos, jugadores])

  function cambiarMes(dir: -1 | 1) {
    let nm = mes + dir
    let na = anio
    if (nm < 0) { nm = 11; na -= 1 }
    else if (nm > 11) { nm = 0; na += 1 }
    setMes(nm)
    setAnio(na)
  }

  return (
    <div>
      <div className="cal-header">
        <button type="button" className="mini-btn" onClick={() => cambiarMes(-1)}>‹</button>
        <div className="cal-titulo">{MESES[mes]} {anio}</div>
        <button type="button" className="mini-btn" onClick={() => cambiarMes(1)}>›</button>
      </div>

      {cargando && <div className="estado estado--probando">Cargando...</div>}
      {error && <div className="error">{error}</div>}

      {!cargando && (
        <>
          <div className="tiles">
            <div className="tile">
              <div className="tile-num" style={{ color: '#0b8f5a' }}>{money(ingresos)}</div>
              <div className="tile-lbl">Ingresos</div>
            </div>
            <div className="tile">
              <div className="tile-num" style={{ color: '#b91c1c' }}>{money(egresos)}</div>
              <div className="tile-lbl">Egresos</div>
            </div>
          </div>
          <div className="tile tile--saldo">
            <div className="tile-num" style={{ color: saldo >= 0 ? 'var(--azul)' : '#b91c1c' }}>
              {money(saldo)}
            </div>
            <div className="tile-lbl">Saldo del mes</div>
          </div>

          <h3 className="resumen-titulo">Jugadores con cuotas vencidas</h3>
          {deudores.length === 0 ? (
            <p className="nota">¡Nadie tiene cuotas vencidas! 🎉</p>
          ) : (
            <div className="lista-jugadores">
              {deudores.map((d) => (
                <div className="jugador-card" key={d.jugador.id}>
                  <div className="jugador-datos">
                    <div className="jugador-nombre">
                      {d.jugador.numero_camiseta != null && (
                        <span className="dorsal">{d.jugador.numero_camiseta}</span>
                      )}
                      {d.jugador.nombre} {d.jugador.apellido}
                    </div>
                    <div className="jugador-sub">
                      {d.cantidad} cuota(s) vencida(s)
                    </div>
                  </div>
                  <span className="gasto-monto">{money(d.total)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
