import { useAuth } from '../auth/AuthContext'
import { ROL_LABEL, puedeEditarDeportivo, esAdmin } from '../types'
import { Logo } from '../components/Logo'

type Pantalla = 'home' | 'plantel' | 'partidos' | 'estadisticas' | 'entrenamientos' | 'usuarios' | 'pagos'

export function Home({ irA }: { irA: (p: Pantalla) => void }) {
  const { perfil, session, cerrarSesion } = useAuth()

  const jugador = perfil?.jugador
  const nombre = jugador
    ? `${jugador.nombre} ${jugador.apellido}`.trim()
    : session?.user.email ?? ''
  const rol = perfil?.rol
  const esStaff = puedeEditarDeportivo(rol)
  const admin = esAdmin(rol)

  return (
    <div className="app">
      <header className="header">
        <Logo />
        <h1>Low Team</h1>
        {rol && <p className="subtitulo">{ROL_LABEL[rol]}</p>}
      </header>

      <main className="main">
        <div className="tarjeta">
          <p className="saludo">Hola{nombre ? `, ${nombre}` : ''} 👋</p>
          <p className="nota">
            {esStaff
              ? 'Tenés acceso de gestión. Empezá por el Plantel; el resto de las secciones se van habilitando.'
              : 'Tenés acceso de consulta. Ya podés ver el Plantel; el resto se habilita pronto.'}
          </p>
        </div>

        <nav className="menu">
          <button className="menu-item" type="button" onClick={() => irA('plantel')}>
            Plantel
            <span className="chevron">›</span>
          </button>
          <button className="menu-item" type="button" onClick={() => irA('entrenamientos')}>
            Entrenamientos
            <span className="chevron">›</span>
          </button>
          <button className="menu-item" type="button" onClick={() => irA('partidos')}>
            Partidos
            <span className="chevron">›</span>
          </button>
          <button className="menu-item" type="button" onClick={() => irA('estadisticas')}>
            Estadísticas
            <span className="chevron">›</span>
          </button>
          <button className="menu-item" type="button" onClick={() => irA('pagos')}>
            Pagos
            <span className="chevron">›</span>
          </button>
          {admin && (
            <button className="menu-item" type="button" onClick={() => irA('usuarios')}>
              Usuarios
              <span className="chevron">›</span>
            </button>
          )}
        </nav>

        <button className="btn btn--secundario" type="button" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </main>

      <footer className="footer">Low Team · v0.3</footer>
    </div>
  )
}
