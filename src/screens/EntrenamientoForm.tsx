import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Evento } from '../types'

interface Props {
  entrenamiento: Evento | null // null = nuevo
  onListo: () => void
  onCancelar: () => void
}

export function EntrenamientoForm({ entrenamiento, onListo, onCancelar }: Props) {
  const [fecha, setFecha] = useState(entrenamiento?.fecha ?? '')
  const [hora, setHora] = useState(entrenamiento?.hora?.slice(0, 5) ?? '')
  const [nota, setNota] = useState(entrenamiento?.nota ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    const datos = {
      tipo: 'entrenamiento',
      fecha: fecha || null,
      hora: hora || null,
      nota: nota.trim() || null,
    }
    const { error } = entrenamiento
      ? await supabase.from('eventos').update(datos).eq('id', entrenamiento.id)
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
        <h2>{entrenamiento ? 'Editar entrenamiento' : 'Nuevo entrenamiento'}</h2>
        <span />
      </header>

      <main className="main">
        <form className="form" onSubmit={guardar}>
          <div className="fila-2">
            <label className="campo">
              <span>Fecha</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </label>
            <label className="campo">
              <span>Hora</span>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </label>
          </div>

          <label className="campo">
            <span>Objetivo / nota <em className="opcional">(opcional)</em></span>
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
