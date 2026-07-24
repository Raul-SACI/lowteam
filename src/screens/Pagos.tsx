import { useAuth } from '../auth/AuthContext'
import { puedeEditarPagos } from '../types'
import { PagosAdmin } from './PagosAdmin'
import { PagosJugador } from './PagosJugador'

export function Pagos({ volver }: { volver: () => void }) {
  const { rolEfectivo } = useAuth()
  return puedeEditarPagos(rolEfectivo) ? (
    <PagosAdmin volver={volver} />
  ) : (
    <PagosJugador volver={volver} />
  )
}
