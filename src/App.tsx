import { useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { Login } from './screens/Login'
import { Registro } from './screens/Registro'
import { Home } from './screens/Home'
import { Plantel } from './screens/Plantel'
import { Partidos } from './screens/Partidos'
import { Estadisticas } from './screens/Estadisticas'
import './App.css'

type Pantalla = 'home' | 'plantel' | 'partidos' | 'estadisticas'

function App() {
  const { session, cargando } = useAuth()
  const [vista, setVista] = useState<'login' | 'registro'>('login')
  const [pantalla, setPantalla] = useState<Pantalla>('home')

  if (cargando) {
    return (
      <div className="app">
        <div className="estado estado--probando">Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return vista === 'login' ? (
      <Login irARegistro={() => setVista('registro')} />
    ) : (
      <Registro irALogin={() => setVista('login')} />
    )
  }

  if (pantalla === 'plantel') {
    return <Plantel volver={() => setPantalla('home')} />
  }
  if (pantalla === 'partidos') {
    return <Partidos volver={() => setPantalla('home')} />
  }
  if (pantalla === 'estadisticas') {
    return <Estadisticas volver={() => setPantalla('home')} />
  }
  return <Home irA={setPantalla} />
}

export default App
