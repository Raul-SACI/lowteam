import { useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { Login } from './screens/Login'
import { Registro } from './screens/Registro'
import { Home } from './screens/Home'
import './App.css'

function App() {
  const { session, cargando } = useAuth()
  const [vista, setVista] = useState<'login' | 'registro'>('login')

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

  return <Home />
}

export default App
