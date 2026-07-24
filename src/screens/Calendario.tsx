import { useMemo, useState } from 'react'
import type { Evento } from '../types'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function Calendario({
  entrenamientos,
  onSelect,
}: {
  entrenamientos: Evento[]
  onSelect: (ev: Evento) => void
}) {
  const hoy = new Date()
  const hoyStr = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`

  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth()) // 0-11
  const [seleccion, setSeleccion] = useState<string | null>(null)

  // fecha (YYYY-MM-DD) -> entrenamientos de ese dia
  const porDia = useMemo(() => {
    const m = new Map<string, Evento[]>()
    entrenamientos.forEach((e) => {
      if (!e.fecha) return
      const arr = m.get(e.fecha) ?? []
      arr.push(e)
      m.set(e.fecha, arr)
    })
    return m
  }, [entrenamientos])

  const primerDia = new Date(anio, mes, 1).getDay() // 0=Dom
  const offset = (primerDia + 6) % 7 // lunes primero
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()

  const celdas: (number | null)[] = []
  for (let i = 0; i < offset; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  function cambiarMes(dir: -1 | 1) {
    setSeleccion(null)
    let nm = mes + dir
    let na = anio
    if (nm < 0) {
      nm = 11
      na -= 1
    } else if (nm > 11) {
      nm = 0
      na += 1
    }
    setMes(nm)
    setAnio(na)
  }

  const seleccionados = seleccion ? porDia.get(seleccion) ?? [] : []

  return (
    <div className="calendario">
      <div className="cal-header">
        <button type="button" className="mini-btn" onClick={() => cambiarMes(-1)}>
          ‹
        </button>
        <div className="cal-titulo">
          {MESES[mes]} {anio}
        </div>
        <button type="button" className="mini-btn" onClick={() => cambiarMes(1)}>
          ›
        </button>
      </div>

      <div className="cal-grid cal-dias">
        {DIAS.map((d) => (
          <div key={d} className="cal-dia-nombre">
            {d}
          </div>
        ))}
      </div>

      <div className="cal-grid">
        {celdas.map((d, i) => {
          if (d === null) return <div key={`b${i}`} className="cal-celda cal-celda--vacia" />
          const fecha = `${anio}-${pad(mes + 1)}-${pad(d)}`
          const tiene = porDia.has(fecha)
          const esHoy = fecha === hoyStr
          const sel = fecha === seleccion
          return (
            <button
              key={fecha}
              type="button"
              className={
                'cal-celda' +
                (tiene ? ' cal-celda--con' : '') +
                (esHoy ? ' cal-celda--hoy' : '') +
                (sel ? ' cal-celda--sel' : '')
              }
              onClick={() => setSeleccion(fecha)}
            >
              {d}
              {tiene && <span className="cal-punto" />}
            </button>
          )
        })}
      </div>

      {seleccion && (
        <div className="cal-detalle">
          {seleccionados.length === 0 ? (
            <p className="nota">No hay entrenamiento ese día.</p>
          ) : (
            <div className="lista-jugadores">
              {seleccionados.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="jugador-card"
                  onClick={() => onSelect(e)}
                >
                  <div className="jugador-datos">
                    <div className="jugador-nombre">
                      {e.fecha}
                      {e.hora ? ` · ${e.hora.slice(0, 5)}` : ''}
                    </div>
                    <div className="jugador-sub">{e.nota ?? 'Entrenamiento'}</div>
                  </div>
                  <span className="chevron">›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
