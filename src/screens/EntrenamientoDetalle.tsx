import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Evento, Ejercicio, EntrenamientoEjercicio } from '../types'

interface Props {
  ent: Evento
  esStaff: boolean
  onVolver: () => void
  onEditar: () => void
  onCargarStats: () => void
}

export function EntrenamientoDetalle({ ent, esStaff, onVolver, onEditar, onCargarStats }: Props) {
  const [asignados, setAsignados] = useState<EntrenamientoEjercicio[]>([])
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nuevoEj, setNuevoEj] = useState('')
  const [nuevaDur, setNuevaDur] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function cargar() {
    setCargando(true)
    setError(null)
    const [ar, er] = await Promise.all([
      supabase
        .from('entrenamiento_ejercicios')
        .select('*, ejercicio:ejercicios(id, nombre, descripcion)')
        .eq('evento_id', ent.id)
        .order('orden', { ascending: true })
        .range(0, 999),
      supabase.from('ejercicios').select('*').order('nombre', { ascending: true }).range(0, 999),
    ])
    if (ar.error) setError(ar.error.message)
    setAsignados((ar.data as unknown as EntrenamientoEjercicio[]) ?? [])
    setEjercicios((er.data as Ejercicio[]) ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [ent.id])

  async function agregar() {
    if (!nuevoEj) return
    setOcupado(true)
    setError(null)
    const maxOrden = asignados.reduce((m, a) => Math.max(m, a.orden), 0)
    const { error } = await supabase.from('entrenamiento_ejercicios').insert({
      evento_id: ent.id,
      ejercicio_id: nuevoEj,
      duracion_min: nuevaDur.trim() ? Number(nuevaDur) : null,
      orden: maxOrden + 1,
    })
    setOcupado(false)
    if (error) setError(error.message)
    else {
      setNuevoEj('')
      setNuevaDur('')
      cargar()
    }
  }

  async function quitar(id: string) {
    setError(null)
    const { error } = await supabase.from('entrenamiento_ejercicios').delete().eq('id', id)
    if (error) setError(error.message)
    else cargar()
  }

  async function mover(idx: number, dir: -1 | 1) {
    const otro = idx + dir
    if (otro < 0 || otro >= asignados.length) return
    const a = asignados[idx]
    const b = asignados[otro]
    setOcupado(true)
    await supabase.from('entrenamiento_ejercicios').update({ orden: b.orden }).eq('id', a.id)
    await supabase.from('entrenamiento_ejercicios').update({ orden: a.orden }).eq('id', b.id)
    setOcupado(false)
    cargar()
  }

  const totalMin = asignados.reduce((s, a) => s + (a.duracion_min ?? 0), 0)

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={onVolver}>
          ← Volver
        </button>
        <h2>Entrenamiento</h2>
        <span />
      </header>

      <main className="main">
        <div className="tarjeta">
          <p className="saludo">{ent.fecha ?? 'Sin fecha'}{ent.hora ? ` · ${ent.hora.slice(0, 5)}` : ''}</p>
          {ent.nota && <p className="nota">{ent.nota}</p>}
        </div>

        <div className="botones-fila">
          <button className="btn" type="button" onClick={onCargarStats}>
            Asistencia y métricas
          </button>
          {esStaff && (
            <button className="btn btn--secundario" type="button" onClick={onEditar}>
              Editar
            </button>
          )}
        </div>

        <h3 className="resumen-titulo">
          Planificación {totalMin > 0 && <span className="total-min">({totalMin} min)</span>}
        </h3>

        {cargando && <div className="estado estado--probando">Cargando...</div>}
        {error && <div className="error">{error}</div>}
        {!cargando && asignados.length === 0 && (
          <p className="nota">Todavía no hay ejercicios en este entrenamiento.</p>
        )}

        <div className="lista-jugadores">
          {asignados.map((a, i) => (
            <div className="ejercicio-card" key={a.id}>
              <div className="ejercicio-info">
                <div className="jugador-nombre">
                  <span className="orden-num">{i + 1}</span>
                  {a.ejercicio?.nombre ?? 'Ejercicio'}
                </div>
                <div className="jugador-sub">
                  {a.duracion_min != null ? `${a.duracion_min} min` : 'Sin duración'}
                </div>
              </div>
              {esStaff && (
                <div className="ejercicio-acciones">
                  <button type="button" className="mini-btn" disabled={i === 0 || ocupado} onClick={() => mover(i, -1)}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="mini-btn"
                    disabled={i === asignados.length - 1 || ocupado}
                    onClick={() => mover(i, 1)}
                  >
                    ↓
                  </button>
                  <button type="button" className="link link--rojo" onClick={() => quitar(a.id)}>
                    Quitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {esStaff && (
          <div className="agregar-ej">
            {ejercicios.length === 0 ? (
              <p className="nota">
                No hay ejercicios en la biblioteca todavía. Creá algunos desde "Ejercicios".
              </p>
            ) : (
              <>
                <div className="fila-2">
                  <label className="campo">
                    <span>Ejercicio</span>
                    <select value={nuevoEj} onChange={(e) => setNuevoEj(e.target.value)}>
                      <option value="">Elegir...</option>
                      {ejercicios.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="campo">
                    <span>Duración (min)</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={nuevaDur}
                      onChange={(e) => setNuevaDur(e.target.value)}
                    />
                  </label>
                </div>
                <button className="btn" type="button" onClick={agregar} disabled={!nuevoEj || ocupado}>
                  + Agregar al entrenamiento
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
