import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Evento } from '../types'

interface Props {
  partido: Evento | null // null = nuevo
  onListo: () => void
  onCancelar: () => void
}

export function PartidoForm({ partido, onListo, onCancelar }: Props) {
  const [rival, setRival] = useState(partido?.rival ?? '')
  const [fecha, setFecha] = useState(partido?.fecha ?? '')
  const [hora, setHora] = useState(partido?.hora?.slice(0, 5) ?? '')
  const [condicion, setCondicion] = useState(partido?.condicion ?? '')
  const [oficial, setOficial] = useState(partido?.es_oficial ?? true)
  const [gf, setGf] = useState(
    partido?.goles_favor != null ? String(partido.goles_favor) : ''
  )
  const [gc, setGc] = useState(
    partido?.goles_contra != null ? String(partido.goles_contra) : ''
  )
  const [nota, setNota] = useState(partido?.nota ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    const datos = {
      tipo: 'partido',
      rival: rival.trim() || null,
      fecha: fecha || null,
      hora: hora || null,
      condicion: condicion || null,
      es_oficial: oficial,
      goles_favor: gf.trim() ? Number(gf) : null,
      goles_contra: gc.trim() ? Number(gc) : null,
      nota: nota.trim() || null,
    }
    const { error } = partido
      ? await supabase.from('eventos').update(datos).eq('id', partido.id)
      : await supabase.from('eventos').insert(datos)
    setGuardando(false)
    if (error) {
      setError(
        error.message.toLowerCase().includes('row-level security')
          ? 'No tenés permiso (solo el staff puede editar).'
          : error.message
      )
    } else {
      onListo()
    }
  }

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={onCancelar}>
          ← Volver
        </button>
        <h2>{partido ? 'Editar partido' : 'Nuevo partido'}</h2>
        <span />
      </header>

      <main className="main">
        <form className="form" onSubmit={guardar}>
          <label className="campo">
            <span>Rival</span>
            <input value={rival} onChange={(e) => setRival(e.target.value)} required />
          </label>

          <div className="fila-2">
            <label className="campo">
              <span>Fecha</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </label>
            <label className="campo">
              <span>Hora</span>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </label>
          </div>

          <div className="fila-2">
            <label className="campo">
              <span>Condición</span>
              <select value={condicion} onChange={(e) => setCondicion(e.target.value as '' | 'local' | 'visitante')}>
                <option value="">Elegir...</option>
                <option value="local">Local</option>
                <option value="visitante">Visitante</option>
              </select>
            </label>
            <label className="campo">
              <span>Tipo</span>
              <select value={oficial ? 'of' : 'am'} onChange={(e) => setOficial(e.target.value === 'of')}>
                <option value="of">Oficial</option>
                <option value="am">Amistoso</option>
              </select>
            </label>
          </div>

          <div className="fila-2">
            <label className="campo">
              <span>Goles a favor</span>
              <input type="number" inputMode="numeric" value={gf} onChange={(e) => setGf(e.target.value)} />
            </label>
            <label className="campo">
              <span>Goles en contra</span>
              <input type="number" inputMode="numeric" value={gc} onChange={(e) => setGc(e.target.value)} />
            </label>
          </div>

          <label className="campo">
            <span>Nota <em className="opcional">(opcional)</em></span>
            <input value={nota} onChange={(e) => setNota(e.target.value)} />
          </label>

          {error && <div className="error">{error}</div>}

          <button className="btn" type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </main>
    </div>
  )
}
