import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Jugador } from '../types'
import { POSICIONES, TALLES, PIES } from '../types'

interface Props {
  jugador: Jugador | null // null = alta nueva
  onListo: () => void
  onCancelar: () => void
}

export function JugadorForm({ jugador, onListo, onCancelar }: Props) {
  const [nombre, setNombre] = useState(jugador?.nombre ?? '')
  const [apellido, setApellido] = useState(jugador?.apellido ?? '')
  const [dni, setDni] = useState(jugador?.dni ?? '')
  const [numero, setNumero] = useState(
    jugador?.numero_camiseta != null ? String(jugador.numero_camiseta) : ''
  )
  const [pos1, setPos1] = useState(jugador?.posicion_preferida ?? '')
  const [pos2, setPos2] = useState(jugador?.posicion_secundaria ?? '')
  const [pie, setPie] = useState(jugador?.pie_habil ?? '')
  const [fechaNac, setFechaNac] = useState(jugador?.fecha_nacimiento ?? '')
  const [talle, setTalle] = useState(jugador?.talle ?? '')
  const [telefono, setTelefono] = useState(jugador?.telefono ?? '')
  const [peso, setPeso] = useState(jugador?.peso != null ? String(jugador.peso) : '')
  const [altura, setAltura] = useState(jugador?.altura != null ? String(jugador.altura) : '')
  const [email, setEmail] = useState(jugador?.email ?? '')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(jugador?.foto_url ?? null)

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmarBaja, setConfirmarBaja] = useState(false)

  function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setArchivo(f)
    if (f) setPreview(URL.createObjectURL(f))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    try {
      const datos = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim() || null,
        numero_camiseta: numero.trim() ? Number(numero) : null,
        posicion_preferida: pos1 || null,
        posicion_secundaria: pos2 || null,
        pie_habil: pie || null,
        fecha_nacimiento: fechaNac || null,
        talle: talle || null,
        telefono: telefono.trim() || null,
        peso: peso.trim() ? Number(peso) : null,
        altura: altura.trim() ? Number(altura) : null,
        email: email.trim() || null,
      }

      let id = jugador?.id
      if (id) {
        const { error } = await supabase.from('jugadores').update(datos).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('jugadores')
          .insert(datos)
          .select('id')
          .single()
        if (error) throw error
        id = data.id
      }

      // Subir foto (si eligieron una nueva)
      if (archivo && id) {
        const path = `jugadores/${id}`
        const { error: upErr } = await supabase.storage
          .from('fotos')
          .upload(path, archivo, { upsert: true, contentType: archivo.type })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(path)
        const fotoUrl = `${urlData.publicUrl}?t=${Date.now()}`
        const { error: updErr } = await supabase
          .from('jugadores')
          .update({ foto_url: fotoUrl })
          .eq('id', id)
        if (updErr) throw updErr
      }

      onListo()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar.'
      setError(traducir(msg))
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!jugador) return
    setGuardando(true)
    setError(null)
    try {
      await supabase.storage.from('fotos').remove([`jugadores/${jugador.id}`])
      const { error } = await supabase.from('jugadores').delete().eq('id', jugador.id)
      if (error) throw error
      onListo()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar.'
      setError(traducir(msg))
      setGuardando(false)
    }
  }

  const iniciales = `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase() || '?'

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={onCancelar}>
          ← Volver
        </button>
        <h2>{jugador ? 'Editar jugador' : 'Nuevo jugador'}</h2>
        <span />
      </header>

      <main className="main">
        <form className="form" onSubmit={guardar}>
          <div className="foto-editor">
            <div className="foto-preview">
              {preview ? (
                <img src={preview} alt="Foto" />
              ) : (
                <span className="foto-iniciales">{iniciales}</span>
              )}
            </div>
            <label className="btn btn--secundario foto-boton">
              {preview ? 'Cambiar foto' : 'Agregar foto'}
              <input type="file" accept="image/*" onChange={onArchivo} hidden />
            </label>
          </div>

          <label className="campo">
            <span>Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <label className="campo">
            <span>Apellido</span>
            <input value={apellido} onChange={(e) => setApellido(e.target.value)} required />
          </label>

          <div className="fila-2">
            <label className="campo">
              <span>N° camiseta</span>
              <input
                type="number"
                inputMode="numeric"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </label>
            <label className="campo">
              <span>DNI</span>
              <input value={dni} onChange={(e) => setDni(e.target.value)} inputMode="numeric" />
            </label>
          </div>

          <label className="campo">
            <span>Posición preferida</span>
            <select value={pos1} onChange={(e) => setPos1(e.target.value)}>
              <option value="">Elegir...</option>
              {POSICIONES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Segunda posición <em className="opcional">(opcional)</em></span>
            <select value={pos2} onChange={(e) => setPos2(e.target.value)}>
              <option value="">Elegir...</option>
              {POSICIONES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <div className="fila-2">
            <label className="campo">
              <span>Pie hábil</span>
              <select value={pie} onChange={(e) => setPie(e.target.value)}>
                <option value="">Elegir...</option>
                {PIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span>Talle</span>
              <select value={talle} onChange={(e) => setTalle(e.target.value)}>
                <option value="">Elegir...</option>
                {TALLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="campo">
            <span>Fecha de nacimiento</span>
            <input
              type="date"
              value={fechaNac}
              onChange={(e) => setFechaNac(e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Teléfono</span>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              inputMode="tel"
            />
          </label>

          <div className="fila-2">
            <label className="campo">
              <span>Peso (kg)</span>
              <input
                type="number"
                inputMode="decimal"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
              />
            </label>
            <label className="campo">
              <span>Altura (cm)</span>
              <input
                type="number"
                inputMode="decimal"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
              />
            </label>
          </div>

          <label className="campo">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
            />
          </label>

          {error && <div className="error">{error}</div>}

          <button className="btn" type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>

          {jugador &&
            (confirmarBaja ? (
              <div className="baja-confirm">
                <p>¿Seguro que querés eliminar a {jugador.nombre}?</p>
                <div className="fila-2">
                  <button
                    type="button"
                    className="btn btn--secundario"
                    onClick={() => setConfirmarBaja(false)}
                    disabled={guardando}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className="btn btn--peligro"
                    onClick={eliminar}
                    disabled={guardando}
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn--peligro-suave"
                onClick={() => setConfirmarBaja(true)}
                disabled={guardando}
              >
                Eliminar jugador
              </button>
            ))}
        </form>
      </main>
    </div>
  )
}

function traducir(msg: string): string {
  if (msg.toLowerCase().includes('row-level security'))
    return 'No tenés permiso para esta acción (solo el staff puede editar).'
  if (msg.toLowerCase().includes('duplicate') || msg.includes('jugadores_numero_unico'))
    return 'Ese número de camiseta ya está ocupado por otro jugador.'
  return msg
}
