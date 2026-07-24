import { useAuth } from '../auth/AuthContext'
import { ROL_LABEL } from '../types'
import { Logo } from '../components/Logo'

export function Home() {
  const { perfil, session, cerrarSesion } = useAuth()

  const jugador = perfil?.jugador
  const nombre = jugador
    ? `${jugador.nombre} ${jugador.apellido}`.trim()
    : session?.user.email ?? ''
  const rol = perfil?.rol
  const esStaff = rol === 'cuerpo_tecnico' || rol === 'administracion'

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
              ? 'Tenés acceso de gestión. Las secciones para cargar plantel, entrenamientos, partidos y estadísticas se irán habilitando en los próximos pasos.'
              : 'Tenés acceso de consulta. Vas a poder ver el equipo, tus estadísticas y la planificación de entrenamientos a medida que se habiliten las secciones.'}
          </p>
        </div>

        <nav className="menu">
          <div className="menu-item menu-item--proximo">Plantel · próximamente</div>
          <div className="menu-item menu-item--proximo">Entrenamientos · próximamente</div>
          <div className="menu-item menu-item--proximo">Partidos · próximamente</div>
          <div className="menu-item menu-item--proximo">Estadísticas · próximamente</div>
        </nav>

        <button className="btn btn--secundario" type="button" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </main>

      <footer className="footer">Low Team · v0.2</footer>
    </div>
  )
}
