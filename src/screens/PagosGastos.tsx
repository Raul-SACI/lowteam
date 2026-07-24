import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Gasto } from '../types'
import { hoyLocal } from '../types'

export function PagosGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nuevo, setNuevo] = useState(false)
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoyLocal())
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    setError(null)
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false })
      .range(0, 999)
    if (error) setError(error.message)
    else setGastos((data as Gasto[]) ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    const { error } = await supabase.from('gastos').insert({
      concepto: concepto.trim(),
      monto: Number(monto),
      fecha,
    })
    setGuardando(false)
    if (error) setError(error.message)
    else {
      setConcepto('')
      setMonto('')
      setFecha(hoyLocal())
      setNuevo(false)
      cargar()
    }
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('gastos').delete().eq('id', id)
    if (error) setError(error.message)
    else cargar()
  }

  const total = gastos.reduce((s, g) => s + Number(g.monto), 0)

  return (
    <div>
      {!nuevo && (
        <button className="btn" type="button" onClick={() => setNuevo(true)}>
          + Nuevo gasto
        </button>
      )}

      {nuevo && (
        <form className="form" onSubmit={crear}>
          <label className="campo">
            <span>Concepto</span>
            <input
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej: Alquiler de cancha"
              required
            />
          </label>
          <div className="fila-2">
            <label className="campo">
              <span>Monto</span>
              <input
                type="number"
                inputMode="decimal"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </label>
            <label className="campo">
              <span>Fecha</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </label>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="fila-2">
            <button className="btn btn--secundario" type="button" onClick={() => setNuevo(false)}>
              Cancelar
            </button>
            <button className="btn" type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar gasto'}
            </button>
          </div>
        </form>
      )}

      {cargando && <div className="estado estado--probando">Cargando...</div>}
      {error && !nuevo && <div className="error">{error}</div>}
      {!cargando && gastos.length === 0 && <p className="nota">Todavía no hay gastos cargados.</p>}

      {gastos.length > 0 && (
        <>
          <p className="nota">Total de gastos: <strong>${total.toLocaleString('es-AR')}</strong></p>
          <div className="lista-jugadores">
            {gastos.map((g) => (
              <div className="jugador-card" key={g.id}>
                <div className="jugador-datos">
                  <div className="jugador-nombre">{g.concepto}</div>
                  <div className="jugador-sub">{g.fecha}</div>
                </div>
                <span className="gasto-monto">-${Number(g.monto).toLocaleString('es-AR')}</span>
                <button className="link link--rojo" type="button" onClick={() => eliminar(g.id)}>
                  Borrar
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
