import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { Evento } from '../types'
import { hoyLocal, diasHasta } from '../types'
import { staffJugadorIds } from '../lib/plantel'

interface JugMin {
  id: string
  nombre: string
  apellido: string
}

export function ProximoEvento() {
  const { perfil } = useAuth()
  const miJugador = perfil?.jugador_id ?? null

  const [evento, setEvento] = useState<Evento | null>(null)
  const [miAsiste, setMiAsiste] = useState<boolean | null>(null)
  const [van, setVan] = useState<JugMin[]>([])
  const [noVan, setNoVan] = useState<JugMin[]>([])
  const [sinResp, setSinResp] = useState<JugMin[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mostrarLista, setMostrarLista] = useState(false)

  async function cargar() {
    setCargando(true)
    const { data: evs } = await supabase
      .from('eventos')
      .select('*')
      .gte('fecha', hoyLocal())
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true, nullsFirst: true })
      .limit(1)
    const ev = ((evs as Evento[]) ?? [])[0] ?? null
    setEvento(ev)
    if (ev) {
      const [jr, cr, staff] = await Promise.all([
        supabase.from('jugadores').select('id, nombre, apellido').order('apellido', { ascending: true }).range(0, 999),
        supabase.from('confirmaciones').select('jugador_id, asiste').eq('evento_id', ev.id).range(0, 999),
        staffJugadorIds(),
      ])
      const jugadores = ((jr.data as JugMin[]) ?? []).filter((j) => !staff.has(j.id))
      const conf = new Map<string, boolean>()
      ;((cr.data as { jugador_id: string; asiste: boolean }[]) ?? []).forEach((c) =>
        conf.set(c.jugador_id, c.asiste)
      )
      setVan(jugadores.filter((j) => conf.get(j.id) === true))
      setNoVan(jugadores.filter((j) => conf.get(j.id) === false))
      setSinResp(jugadores.filter((j) => !conf.has(j.id)))
      setMiAsiste(miJugador && conf.has(miJugador) ? conf.get(miJugador)! : null)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [miJugador])

  async function confirmar(asiste: boolean) {
    if (!evento || !miJugador) return
    setGuardando(true)
    const { error } = await supabase
      .from('confirmaciones')
      .upsert(
        { evento_id: evento.id, jugador_id: miJugador, asiste },
        { onConflict: 'evento_id,jugador_id' }
      )
    setGuardando(false)
    if (!error) {
      setMiAsiste(asiste)
      cargar()
    }
  }

  if (cargando || !evento) return null

  const esPartido = evento.tipo === 'partido'
  const titulo = esPartido ? `Partido${evento.rival ? ` vs ${evento.rival}` : ''}` : 'Entrenamiento'
  const dias = evento.fecha ? diasHasta(evento.fecha) : null
  const cuando = dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : dias != null ? `En ${dias} días` : ''

  function grupo(titulo: string, lista: JugMin[]) {
    return (
      <div className="prox-grupo">
        <div className="prox-grupo-tit">{titulo} ({lista.length})</div>
        {lista.length === 0 ? (
          <div className="prox-grupo-vacio">—</div>
        ) : (
          <ul className="prox-grupo-lista">
            {lista.map((j) => (
              <li key={j.id}>{j.nombre} {j.apellido}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="prox-evento">
      <div className="prox-top">
        <span className={`prox-tag ${esPartido ? 'prox-tag--p' : 'prox-tag--e'}`}>
          {esPartido ? '⚽ Partido' : '🏃 Entrenamiento'}
        </span>
        <span className="prox-cuando">{cuando}</span>
      </div>
      <div className="prox-titulo">{titulo}</div>
      <div className="prox-fecha">
        {evento.fecha}
        {evento.hora ? ` · ${evento.hora.slice(0, 5)}` : ''}
        {esPartido && evento.condicion ? ` · ${evento.condicion === 'local' ? 'Local' : 'Visitante'}` : ''}
      </div>
      {evento.nota && !esPartido && <div className="prox-nota">{evento.nota}</div>}

      {miJugador && (
        <>
          <div className="prox-pregunta">¿Vas a ir?</div>
          <div className="prox-botones">
            <button
              type="button"
              className={`prox-btn ${miAsiste === true ? 'prox-btn--si-on' : ''}`}
              onClick={() => confirmar(true)}
              disabled={guardando}
            >
              ✅ Voy
            </button>
            <button
              type="button"
              className={`prox-btn ${miAsiste === false ? 'prox-btn--no-on' : ''}`}
              onClick={() => confirmar(false)}
              disabled={guardando}
            >
              ❌ No voy
            </button>
          </div>
        </>
      )}

      <div className="prox-conteo">
        {van.length} van · {noVan.length} no van · {sinResp.length} sin responder
      </div>

      <button className="prox-verlista" type="button" onClick={() => setMostrarLista((v) => !v)}>
        {mostrarLista ? 'Ocultar lista' : 'Ver quiénes'}
      </button>

      {mostrarLista && (
        <div className="prox-listas">
          {grupo('✅ Van', van)}
          {grupo('❌ No van', noVan)}
          {grupo('❔ Sin responder', sinResp)}
        </div>
      )}
    </div>
  )
}
