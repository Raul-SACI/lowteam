import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'

export function MiFoto({ volver }: { volver: () => void }) {
  const { perfil, recargarPerfil } = useAuth()
  const jugadorId = perfil?.jugador_id ?? null
  const fotoActual = perfil?.jugador?.foto_url ?? null
  const nombre = perfil?.jugador
    ? `${perfil.jugador.nombre} ${perfil.jugador.apellido}`.trim()
    : ''
  const iniciales = perfil?.jugador
    ? `${perfil.jugador.nombre[0] ?? ''}${perfil.jugador.apellido[0] ?? ''}`.toUpperCase()
    : '?'

  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState(false)

  function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setArchivo(f)
    setOkMsg(false)
    if (f) setPreview(URL.createObjectURL(f))
  }

  async function guardar() {
    if (!archivo || !jugadorId) return
    setGuardando(true)
    setError(null)
    try {
      const path = `jugadores/${jugadorId}`
      const { error: upErr } = await supabase.storage
        .from('fotos')
        .upload(path, archivo, { upsert: true, contentType: archivo.type })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(path)
      const { error: rpcErr } = await supabase.rpc('guardar_mi_foto', {
        url: `${urlData.publicUrl}?t=${Date.now()}`,
      })
      if (rpcErr) throw rpcErr
      await recargarPerfil()
      setOkMsg(true)
      setArchivo(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la foto.')
    }
    setGuardando(false)
  }

  const mostrar = preview ?? fotoActual

  return (
    <div className="app">
      <header className="barra">
        <button className="volver" type="button" onClick={volver}>
          ← Volver
        </button>
        <h2>Mi foto</h2>
        <span />
      </header>

      <main className="main">
        {!jugadorId ? (
          <p className="nota">Tu usuario no tiene una ficha asociada.</p>
        ) : (
          <div className="foto-editor">
            <div className="foto-preview foto-preview--grande">
              {mostrar ? <img src={mostrar} alt="Mi foto" /> : <span className="foto-iniciales">{iniciales}</span>}
            </div>
            {nombre && <p className="nota">{nombre}</p>}

            <label className="btn btn--secundario foto-boton">
              📸 Sacar / elegir foto
              <input type="file" accept="image/*" capture="user" onChange={onArchivo} hidden />
            </label>

            {error && <div className="error">{error}</div>}
            {okMsg && <div className="estado estado--ok">Foto actualizada ✅</div>}

            <button className="btn" type="button" onClick={guardar} disabled={!archivo || guardando}>
              {guardando ? 'Guardando...' : 'Guardar foto'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
