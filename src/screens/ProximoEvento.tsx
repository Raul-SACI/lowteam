import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { Evento } from '../types'
import { hoyLocal, diasHasta } from '../types'

export function ProximoEvento() {
  const { perfil } = useAuth()
  const miJugador = perfil?.jugador_id ?? null

  const [evento, setEvento] = useState<Evento | null>(null)
  const [miAsiste, setMiAsiste] = useState<boolean | null>(null)
  const [van, setVan] = useState(0)
  const [noVan, setNoVan] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

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
      const { data: conf } = await supabase
        .from('confirmaciones')
        .select('jugador_id, asiste')
        .eq('evento_id', ev.id)
        .range(0, 999)
      const lista = (conf as { jugador_id: string; asiste: boolean }[]) ?? []
      setVan(lista.filter((c) => c.asiste).length)
      setNoVan(lista.filter((c) => !c.asiste).length)
      const mio = lista.find((c) => c.jugador_id === miJugador)
      setMiAsiste(mio ? mio.asiste : null)
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

  if (cargando) return null
  if (!evento) return null

  const esPartido = evento.tipo === 'partido'
  const titulo = esPartido
    ? `Partido${evento.rival ? ` vs ${evento.rival}` : ''}`
    : 'Entrenamiento'
  const dias = evento.fecha ? diasHasta(evento.fecha) : null
  const cuando =
    dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : dias != null ? `En ${dias} días` : ''

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
        {van} confirmaron que van · {noVan} no van
      </div>
    </div>
  )
}
