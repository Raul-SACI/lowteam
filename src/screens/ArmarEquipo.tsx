import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Evento, Jugador } from '../types'
import { staffJugadorIds } from '../lib/plantel'

interface Pos {
  x: number
  y: number
}

const FORMACIONES: Record<string, Pos[]> = {
  '4-4-2': [
    { x: 50, y: 90 },
    { x: 16, y: 72 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 84, y: 72 },
    { x: 16, y: 50 }, { x: 38, y: 50 }, { x: 62, y: 50 }, { x: 84, y: 50 },
    { x: 36, y: 26 }, { x: 64, y: 26 },
  ],
  '4-3-3': [
    { x: 50, y: 90 },
    { x: 16, y: 72 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 84, y: 72 },
    { x: 25, y: 50 }, { x: 50, y: 50 }, { x: 75, y: 50 },
    { x: 22, y: 27 }, { x: 50, y: 22 }, { x: 78, y: 27 },
  ],
}

export function ArmarEquipo({
  partido,
  esStaff,
  onVolver,
}: {
  partido: Evento
  esStaff: boolean
  onVolver: () => void
}) {
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [pos, setPos] = useState<Record<string, Pos>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [okMsg, setOkMsg] = useState(false)
  const [drag, setDrag] = useState<string | null>(null)
  const canchaRef = useRef<HTMLDivElement>(null)

  async function cargar() {
    setCargando(true)
    setError(null)
    const [jr, ar, staff] = await Promise.all([
      supabase
        .from('jugadores')
        .select('*')
        .order('numero_camiseta', { ascending: true, nullsFirst: false })
        .order('apellido', { ascending: true })
        .range(0, 999),
      supabase.from('alineacion').select('*').eq('evento_id', partido.id).range(0, 999),
      staffJugadorIds(),
    ])
    if (jr.error) setError(jr.error.message)
    setJugadores(((jr.data as Jugador[]) ?? []).filter((j) => !staff.has(j.id)))
    const map: Record<string, Pos> = {}
    ;((ar.data as { jugador_id: string; x: number; y: number }[]) ?? []).forEach((a) => {
      map[a.jugador_id] = { x: Number(a.x), y: Number(a.y) }
    })
    setPos(map)
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [partido.id])

  const colocados = jugadores.filter((j) => pos[j.id])
  const banco = jugadores.filter((j) => !pos[j.id])

  function agregar(j: Jugador) {
    if (!esStaff) return
    setPos((p) => ({ ...p, [j.id]: { x: 50, y: 62 } }))
    setOkMsg(false)
  }
  function quitar(id: string) {
    setPos((p) => {
      const n = { ...p }
      delete n[id]
      return n
    })
    setOkMsg(false)
  }

  function moverA(clientX: number, clientY: number, id: string) {
    const rect = canchaRef.current?.getBoundingClientRect()
    if (!rect) return
    let x = ((clientX - rect.left) / rect.width) * 100
    let y = ((clientY - rect.top) / rect.height) * 100
    x = Math.max(4, Math.min(96, x))
    y = Math.max(4, Math.min(96, y))
    setPos((p) => ({ ...p, [id]: { x, y } }))
  }

  function onPointerDown(e: React.PointerEvent, id: string) {
    if (!esStaff) return
    e.preventDefault()
    setDrag(id)
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return
    moverA(e.clientX, e.clientY, drag)
    setOkMsg(false)
  }
  function onPointerUp() {
    setDrag(null)
  }

  function aplicar(nombre: string) {
    const slots = FORMACIONES[nombre]
    const ord = [...colocados].sort(
      (a, b) => (a.numero_camiseta ?? 999) - (b.numero_camiseta ?? 999)
    )
    setPos((p) => {
      const n = { ...p }
      ord.slice(0, 11).forEach((j, i) => {
        n[j.id] = slots[i]
      })
      return n
    })
    setOkMsg(false)
  }

  async function guardar() {
    setGuardando(true)
    setError(null)
    const ids = colocados.map((j) => j.id)
    const rows = colocados.map((j) => ({
      evento_id: partido.id,
      jugador_id: j.id,
      x: pos[j.id].x,
      y: pos[j.id].y,
    }))
    let err = null
    if (ids.length === 0) {
      const d = await supabase.from('alineacion').delete().eq('evento_id', partido.id)
      err = d.error
    } else {
      const u = await supabase.from('alineacion').upsert(rows, { onConflict: 'evento_id,jugador_id' })
      err = u.error
      if (!err) {
        const d = await supabase
          .from('alineacion')
          .delete()
          .eq('evento_id', partido.id)
          .not('jugador_id', 'in', `(${ids.join(',')})`)
        err = d.error
      }
    }
    setGuardando(false)
    if (err) {
      setError(
        err.message.toLowerCase().includes('row-level security')
          ? 'No tenés permiso (solo el staff puede editar la formación).'
          : err.message
      )
    } else {
      setOkMsg(true)
    }
  }

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={onVolver}>
          ← Volver
        </button>
        <h2>Formación</h2>
        <span />
      </header>

      <main className="main">
        <div className="tarjeta">
          <p className="saludo">
            {partido.rival ?? 'Partido'}
            {partido.fecha ? ` · ${partido.fecha}` : ''}
          </p>
          <p className="nota">
            {esStaff
              ? 'Agregá jugadores desde el banco y arrastralos en la cancha. Las plantillas 4-4-2 / 4-3-3 los ordenan solos.'
              : 'Formación del partido (solo lectura).'}
          </p>
        </div>

        {esStaff && (
          <div className="botones-fila">
            <button className="btn btn--secundario" type="button" onClick={() => aplicar('4-4-2')}>
              4-4-2
            </button>
            <button className="btn btn--secundario" type="button" onClick={() => aplicar('4-3-3')}>
              4-3-3
            </button>
          </div>
        )}

        {cargando && <div className="estado estado--probando">Cargando...</div>}
        {error && <div className="error">{error}</div>}

        <div
          className="cancha-armar"
          ref={canchaRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div className="cancha-linea-media" />
          <div className="cancha-circulo" />
          {colocados.map((j) => {
            const p = pos[j.id]
            const ini = `${j.nombre[0] ?? ''}${j.apellido[0] ?? ''}`.toUpperCase() || '?'
            return (
              <div
                key={j.id}
                className={'chip-cancha' + (drag === j.id ? ' chip-cancha--drag' : '')}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                onPointerDown={(e) => onPointerDown(e, j.id)}
              >
                {esStaff && (
                  <button
                    className="chip-quitar"
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      quitar(j.id)
                    }}
                  >
                    ×
                  </button>
                )}
                <div className="chip-foto">
                  {j.foto_url ? <img src={j.foto_url} alt={j.nombre} /> : <span>{ini}</span>}
                  {j.numero_camiseta != null && <span className="chip-dorsal">{j.numero_camiseta}</span>}
                </div>
                <span className="chip-nombre chip-nombre--cancha">{j.apellido || j.nombre}</span>
              </div>
            )
          })}
        </div>

        {esStaff && (
          <button className="btn" type="button" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar formación'}
          </button>
        )}
        {okMsg && <div className="estado estado--ok">Formación guardada ✅</div>}

        {esStaff && (
          <>
            <h3 className="resumen-titulo">Banco ({banco.length})</h3>
            {banco.length === 0 ? (
              <p className="nota">Todos los jugadores están en la cancha.</p>
            ) : (
              <div className="banco-lista">
                {banco.map((j) => {
                  const ini = `${j.nombre[0] ?? ''}${j.apellido[0] ?? ''}`.toUpperCase() || '?'
                  return (
                    <button key={j.id} type="button" className="banco-chip" onClick={() => agregar(j)}>
                      <div className="chip-foto chip-foto--sm">
                        {j.foto_url ? <img src={j.foto_url} alt={j.nombre} /> : <span>{ini}</span>}
                      </div>
                      <span>
                        {j.numero_camiseta != null ? `${j.numero_camiseta}. ` : ''}
                        {j.apellido || j.nombre}
                      </span>
                      <span className="banco-mas">+</span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
