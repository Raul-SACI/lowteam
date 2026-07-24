import { useAuth } from '../auth/AuthContext'
import { puedeEditarPagos } from '../types'
import { PagosAdmin } from './PagosAdmin'
import { PagosJugador } from './PagosJugador'

export function Pagos({ volver }: { volver: () => void }) {
  const { perfil } = useAuth()
  return puedeEditarPagos(perfil?.rol) ? (
    <PagosAdmin volver={volver} />
  ) : (
    <PagosJugador volver={volver} />
  )
}
