import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

type Estado = 'probando' | 'ok' | 'error'

function App() {
  const [estado, setEstado] = useState<Estado>('probando')
  const [detalle, setDetalle] = useState<string>('')

  useEffect(() => {
    // Prueba minima de conexion: pedimos la sesion actual a Supabase.
    // Si responde (aunque no haya sesion), la conexion funciona.
    async function probarConexion() {
      const { error } = await supabase.auth.getSession()
      if (error) {
        setEstado('error')
        setDetalle(error.message)
      } else {
        setEstado('ok')
      }
    }
    probarConexion()
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div className="logo">LT</div>
        <h1>Low Team</h1>
        <p className="subtitulo">Gestion del equipo</p>
      </header>

      <main className="main">
        <div className={`estado estado--${estado}`}>
          {estado === 'probando' && 'Probando conexion con Supabase...'}
          {estado === 'ok' && 'Conexion con Supabase OK'}
          {estado === 'error' && `Error de conexion: ${detalle}`}
        </div>

        <p className="nota">
          Estructura base lista. Las pantallas (plantel, entrenamientos,
          partidos, estadisticas) y el login con roles se construyen en los
          proximos pasos.
        </p>
      </main>

      <footer className="footer">Low Team - v0.1</footer>
    </div>
  )
}

export default App
