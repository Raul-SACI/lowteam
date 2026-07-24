import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import type { Ejercicio } from '../types'
import { puedeEditarDeportivo } from '../types'

export function Biblioteca({ volver }: { volver: () => void }) {
  const { perfil } = useAuth()
  const esStaff = puedeEditarDeportivo(perfil?.rol)

  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // formulario (alta/edicion)
  const [editando, setEditando] = useState<Ejercicio | 'nuevo' | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    setError(null)
    const { data, error } = await supabase
      .from('ejercicios')
      .select('*')
      .order('nombre', { ascending: true })
      .range(0, 999)
    if (error) setError(error.message)
    else setEjercicios((data as Ejercicio[]) ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  function abrirNuevo() {
    setNombre('')
    setDescripcion('')
    setEditando('nuevo')
  }
  function abrirEdicion(e: Ejercicio) {
    setNombre(e.nombre)
    setDescripcion(e.descripcion ?? '')
    setEditando(e)
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    setGuardando(true)
    setError(null)
    const datos = { nombre: nombre.trim(), descripcion: descripcion.trim() || null }
    const { error } =
      editando === 'nuevo'
        ? await supabase.from('ejercicios').insert(datos)
        : await supabase.from('ejercicios').update(datos).eq('id', (editando as Ejercicio).id)
    setGuardando(false)
    if (error) {
      setError(error.message)
    } else {
      setEditando(null)
      cargar()
    }
  }

  async function eliminar(e: Ejercicio) {
    setError(null)
    const { error } = await supabase.from('ejercicios').delete().eq('id', e.id)
    if (error) setError(error.message)
    else cargar()
  }

  if (editando) {
    return (
      <div className="app">
        <header className="barra">
          <button className="volver" type="button" onClick={() => setEditando(null)}>
            ← Volver
          </button>
          <h2>{editando === 'nuevo' ? 'Nuevo ejercicio' : 'Editar ejercicio'}</h2>
          <span />
        </header>
        <main className="main">
          <form className="form" onSubmit={guardar}>
            <label className="campo">
              <span>Nombre</span>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </label>
            <label className="campo">
              <span>Descripción <em className="opcional">(opcional)</em></span>
              <textarea
                className="area"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
              />
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

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={volver}>
          ← Volver
        </button>
        <h2>Ejercicios</h2>
        <span />
      </header>

      <main className="main">
        {esStaff && (
          <button className="btn" type="button" onClick={abrirNuevo}>
            + Nuevo ejercicio
          </button>
        )}

        {cargando && <div className="estado estado--probando">Cargando...</div>}
        {error && <div className="error">{error}</div>}
        {!cargando && !error && ejercicios.length === 0 && (
          <p className="nota">Todavía no hay ejercicios en la biblioteca.</p>
        )}

        <div className="lista-jugadores">
          {ejercicios.map((e) => (
            <div className="ejercicio-card" key={e.id}>
              <div className="ejercicio-info">
                <div className="jugador-nombre">{e.nombre}</div>
                {e.descripcion && <div className="jugador-sub">{e.descripcion}</div>}
              </div>
              {esStaff && (
                <div className="ejercicio-acciones">
                  <button type="button" className="link" onClick={() => abrirEdicion(e)}>
                    Editar
                  </button>
                  <button type="button" className="link link--rojo" onClick={() => eliminar(e)}>
                    Borrar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
