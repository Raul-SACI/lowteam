import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { Cuota, Pago, EstadoPago } from '../types'
import { estadoCuota, ESTADO_PAGO_LABEL, diasHasta } from '../types'

interface ItemCuota {
  cuota: Cuota
  estado: EstadoPago
}

const ORDEN: Record<EstadoPago, number> = { atrasada: 0, proxima: 1, pendiente: 2, pagada: 3 }

export function PagosJugador({ volver }: { volver: () => void }) {
  const { perfil } = useAuth()
  const miJugador = perfil?.jugador_id ?? null

  const [items, setItems] = useState<ItemCuota[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError(null)
      const [cr, pr] = await Promise.all([
        supabase
          .from('cuotas')
          .select('*')
          .order('fecha_vencimiento', { ascending: true })
          .range(0, 999),
        supabase.from('pagos').select('*').range(0, 999), // RLS solo devuelve las mias
      ])
      if (cr.error) setError(cr.error.message)
      const cuotas = (cr.data as Cuota[]) ?? []
      const pagos = (pr.data as Pago[]) ?? []
      const lista: ItemCuota[] = cuotas.map((c) => {
        const p = pagos.find((x) => x.cuota_id === c.id && x.jugador_id === miJugador)
        return { cuota: c, estado: estadoCuota(c.fecha_vencimiento, p?.pagado ?? false) }
      })
      lista.sort(
        (a, b) =>
          ORDEN[a.estado] - ORDEN[b.estado] ||
          a.cuota.fecha_vencimiento.localeCompare(b.cuota.fecha_vencimiento)
      )
      setItems(lista)
      setCargando(false)
    }
    cargar()
  }, [miJugador])

  const atrasadas = items.filter((i) => i.estado === 'atrasada').length
  const proximas = items.filter((i) => i.estado === 'proxima').length

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={volver}>
          ← Volver
        </button>
        <h2>Mis pagos</h2>
        <span />
      </header>

      <main className="main">
        {(atrasadas > 0 || proximas > 0) && (
          <div className="tarjeta">
            <p className="nota">
              {atrasadas > 0 && <strong style={{ color: '#b91c1c' }}>Tenés {atrasadas} cuota(s) atrasada(s). </strong>}
              {proximas > 0 && <span>{proximas} cuota(s) por vencer pronto.</span>}
            </p>
          </div>
        )}

        {cargando && <div className="estado estado--probando">Cargando...</div>}
        {error && <div className="error">{error}</div>}
        {!cargando && !error && items.length === 0 && (
          <p className="nota">No tenés cuotas asignadas.</p>
        )}

        <div className="lista-jugadores">
          {items.map(({ cuota, estado }) => {
            const dias = diasHasta(cuota.fecha_vencimiento)
            let detalle = ''
            if (estado === 'atrasada') detalle = `Venció hace ${Math.abs(dias)} día(s)`
            else if (estado === 'proxima') detalle = dias === 0 ? 'Vence hoy' : `Vence en ${dias} día(s)`
            else if (estado === 'pendiente') detalle = `Vence el ${cuota.fecha_vencimiento}`
            return (
              <div className="jugador-card" key={cuota.id}>
                <div className="jugador-datos">
                  <div className="jugador-nombre">
                    {cuota.concepto}
                    {cuota.monto != null && <span className="tag tag--am">${cuota.monto}</span>}
                  </div>
                  <div className="jugador-sub">{detalle}</div>
                </div>
                <span className={`estado-pago estado-pago--${estado}`}>{ESTADO_PAGO_LABEL[estado]}</span>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
