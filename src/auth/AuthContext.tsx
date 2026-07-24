import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Perfil, Rol } from '../types'
import { esAdmin } from '../types'

interface DatosRegistro {
  nombre: string
  apellido: string
  dni: string
  posicion_preferida: string
  posicion_secundaria: string
  pie_habil: string
  telefono: string
  numero_camiseta: string
  fecha_nacimiento: string
  talle: string
  peso: string
  altura: string
  email: string
  password: string
}

interface AuthContextValue {
  session: Session | null
  perfil: Perfil | null
  cargando: boolean
  iniciarSesion: (email: string, password: string) => Promise<string | null>
  registrar: (datos: DatosRegistro, selfie?: File | null) => Promise<string | null>
  cerrarSesion: () => Promise<void>
  // Vista previa de rol (solo Administrador)
  vistaComo: Rol | null
  setVistaComo: (rol: Rol | null) => void
  rolEfectivo: Rol | null | undefined
  esAdminReal: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)
  const [vistaComo, setVistaComo] = useState<Rol | null>(null)

  async function cargarPerfil(userId: string) {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*, jugador:jugadores(*)')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      console.error('Error cargando perfil:', error.message)
      setPerfil(null)
      return
    }
    setPerfil((data as Perfil) ?? null)
  }

  useEffect(() => {
    let activo = true

    async function init() {
      const { data } = await supabase.auth.getSession()
      if (!activo) return
      setSession(data.session)
      if (data.session) {
        await cargarPerfil(data.session.user.id)
      }
      setCargando(false)
    }
    init()

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_evento, nuevaSesion) => {
        if (!activo) return
        setSession(nuevaSesion)
        if (nuevaSesion) {
          await cargarPerfil(nuevaSesion.user.id)
        } else {
          setPerfil(null)
        }
      }
    )

    return () => {
      activo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function iniciarSesion(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }

  async function registrar(datos: DatosRegistro, selfie?: File | null) {
    const { data, error } = await supabase.auth.signUp({
      email: datos.email,
      password: datos.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido,
          dni: datos.dni,
          posicion_preferida: datos.posicion_preferida,
          posicion_secundaria: datos.posicion_secundaria,
          pie_habil: datos.pie_habil,
          telefono: datos.telefono,
          numero_camiseta: datos.numero_camiseta,
          fecha_nacimiento: datos.fecha_nacimiento,
          talle: datos.talle,
          peso: datos.peso,
          altura: datos.altura,
        },
      },
    })
    if (error) return error.message

    // Selfie (best-effort): si falla, NO bloqueamos el alta.
    const userId = data.user?.id
    if (selfie && data.session && userId) {
      try {
        const { data: p } = await supabase
          .from('perfiles')
          .select('jugador_id')
          .eq('id', userId)
          .single()
        const jid = p?.jugador_id
        if (jid) {
          const path = `jugadores/${jid}`
          const { error: upErr } = await supabase.storage
            .from('fotos')
            .upload(path, selfie, { upsert: true, contentType: selfie.type })
          if (!upErr) {
            const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(path)
            await supabase.rpc('guardar_mi_foto', {
              url: `${urlData.publicUrl}?t=${Date.now()}`,
            })
          }
        }
      } catch (e) {
        console.error('No se pudo guardar la selfie:', e)
      }
    }

    return null
  }

  async function cerrarSesion() {
    setVistaComo(null)
    await supabase.auth.signOut()
  }

  const esAdminReal = esAdmin(perfil?.rol)
  const rolEfectivo = esAdminReal ? vistaComo ?? perfil?.rol : perfil?.rol

  return (
    <AuthContext.Provider
      value={{
        session,
        perfil,
        cargando,
        iniciarSesion,
        registrar,
        cerrarSesion,
        vistaComo: esAdminReal ? vistaComo : null,
        setVistaComo,
        rolEfectivo,
        esAdminReal,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
