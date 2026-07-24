import { useAuth } from '../auth/AuthContext'
import type { Rol } from '../types'
import { ROL_LABEL, puedeEditarDeportivo, esAdmin } from '../types'
import { Logo } from '../components/Logo'

type Pantalla =
  | 'home'
  | 'plantel'
  | 'partidos'
  | 'estadisticas'
  | 'entrenamientos'
  | 'usuarios'
  | 'pagos'

const ROLES_PREVIEW: Rol[] = ['jugador', 'administracion', 'cuerpo_tecnico']

export function Home({ irA }: { irA: (p: Pantalla) => void }) {
  const { perfil, session, cerrarSesion, rolEfectivo, esAdminReal, vistaComo, setVistaComo } =
    useAuth()

  const jugador = perfil?.jugador
  const nombre = jugador
    ? `${jugador.nombre} ${jugador.apellido}`.trim()
    : session?.user.email ?? ''
  const esStaff = puedeEditarDeportivo(rolEfectivo)
  const admin = esAdmin(rolEfectivo)

  return (
    <div className="app">
      <header className="header">
        <Logo />
        <h1>Low Team</h1>
        {rolEfectivo && <p className="subtitulo">{ROL_LABEL[rolEfectivo]}</p>}
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

        {esAdminReal && !vistaComo && (
          <div className="tarjeta">
            <p className="saludo">Ver la app como…</p>
            <p className="nota">Vista previa de lo que ve cada rol (podés volver cuando quieras).</p>
            <div className="ver-como">
              {ROLES_PREVIEW.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="btn btn--secundario"
                  onClick={() => setVistaComo(r)}
                >
                  {ROL_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
        )}

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

      <footer className="footer">Low Team · v0.6</footer>
    </div>
  )
}
