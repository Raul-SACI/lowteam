import { useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { ROL_LABEL } from './types'
import { Login } from './screens/Login'
import { Registro } from './screens/Registro'
import { Home } from './screens/Home'
import { Plantel } from './screens/Plantel'
import { Partidos } from './screens/Partidos'
import { Estadisticas } from './screens/Estadisticas'
import { Entrenamientos } from './screens/Entrenamientos'
import { Usuarios } from './screens/Usuarios'
import { Pagos } from './screens/Pagos'
import { MiFoto } from './screens/MiFoto'
import './App.css'

type Pantalla =
  | 'home'
  | 'plantel'
  | 'partidos'
  | 'estadisticas'
  | 'entrenamientos'
  | 'usuarios'
  | 'pagos'
  | 'mifoto'

function App() {
  const { session, cargando, vistaComo, setVistaComo } = useAuth()
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

  const volverHome = () => setPantalla('home')
  let contenido
  if (pantalla === 'plantel') contenido = <Plantel volver={volverHome} />
  else if (pantalla === 'partidos') contenido = <Partidos volver={volverHome} />
  else if (pantalla === 'estadisticas') contenido = <Estadisticas volver={volverHome} />
  else if (pantalla === 'entrenamientos') contenido = <Entrenamientos volver={volverHome} />
  else if (pantalla === 'usuarios') contenido = <Usuarios volver={volverHome} />
  else if (pantalla === 'pagos') contenido = <Pagos volver={volverHome} />
  else if (pantalla === 'mifoto') contenido = <MiFoto volver={volverHome} />
  else contenido = <Home irA={setPantalla} />

  return (
    <>
      {vistaComo && (
        <div className="banner-preview">
          <span>
            Viendo como <strong>{ROL_LABEL[vistaComo]}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              setVistaComo(null)
              setPantalla('home')
            }}
          >
            Volver a Administrador
          </button>
        </div>
      )}
      {contenido}
    </>
  )
}

export default App
