import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Perfil } from '../types'

interface DatosRegistro {
  nombre: string
  apellido: string
  dni: string
  posicion_preferida: string
  fecha_nacimiento: string
  talle: string
  email: string
  password: string
}

interface AuthContextValue {
  session: Session | null
  perfil: Perfil | null
  cargando: boolean
  iniciarSesion: (email: string, password: string) => Promise<string | null>
  registrar: (datos: DatosRegistro) => Promise<string | null>
  cerrarSesion: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)

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

  async function registrar(datos: DatosRegistro) {
    const { error } = await supabase.auth.signUp({
      email: datos.email,
      password: datos.password,
      options: {
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido,
          dni: datos.dni,
          posicion_preferida: datos.posicion_preferida,
          fecha_nacimiento: datos.fecha_nacimiento,
          talle: datos.talle,
        },
      },
    })
    return error ? error.message : null
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ session, perfil, cargando, iniciarSesion, registrar, cerrarSesion }}
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
