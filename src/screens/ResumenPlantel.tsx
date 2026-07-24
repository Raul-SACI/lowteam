import { useMemo } from 'react'
import type { Jugador, Rol } from '../types'
import { edadDesde, POSICIONES, puedeEditarPagos } from '../types'

type Linea = 'arq' | 'def' | 'med' | 'del' | 'otro'

function lineaDe(pos: string | null): Linea {
  if (!pos) return 'otro'
  if (pos === 'Arquero') return 'arq'
  if (pos.startsWith('Defensor') || pos.startsWith('Lateral')) return 'def'
  if (pos.startsWith('Volante') || pos === 'Enganche') return 'med'
  if (pos === 'Delantero') return 'del'
  return 'otro'
}

function Chip({ j }: { j: Jugador }) {
  const ini = `${j.nombre[0] ?? ''}${j.apellido[0] ?? ''}`.toUpperCase() || '?'
  return (
    <div className="chip-jugador" title={`${j.nombre} ${j.apellido}`}>
      <div className="chip-foto">
        {j.foto_url ? <img src={j.foto_url} alt={j.nombre} /> : <span>{ini}</span>}
        {j.numero_camiseta != null && <span className="chip-dorsal">{j.numero_camiseta}</span>}
      </div>
      <span className="chip-nombre">{j.apellido || j.nombre}</span>
    </div>
  )
}

export function ResumenPlantel({
  jugadores,
  rolEfectivo,
}: {
  jugadores: Jugador[]
  rolEfectivo: Rol | null | undefined
}) {
  const stats = useMemo(() => {
    const edades = jugadores.map((j) => edadDesde(j.fecha_nacimiento)).filter((e): e is number => e != null)
    const edadProm = edades.length ? Math.round(edades.reduce((a, b) => a + b, 0) / edades.length) : null
    const zurdos = jugadores.filter((j) => j.pie_habil === 'Izquierdo').length
    const derechos = jugadores.filter((j) => j.pie_habil === 'Derecho').length
    const ambos = jugadores.filter((j) => j.pie_habil === 'Ambos').length
    const porPos: Record<string, number> = {}
    POSICIONES.forEach((p) => (porPos[p] = 0))
    let sinPos = 0
    jugadores.forEach((j) => {
      if (j.posicion_preferida && porPos[j.posicion_preferida] != null) porPos[j.posicion_preferida] += 1
      else sinPos += 1
    })
    return { edadProm, zurdos, derechos, ambos, porPos, sinPos }
  }, [jugadores])

  const porLinea = useMemo(() => {
    const g: Record<Linea, Jugador[]> = { arq: [], def: [], med: [], del: [], otro: [] }
    jugadores.forEach((j) => g[lineaDe(j.posicion_preferida)].push(j))
    return g
  }, [jugadores])

  async function descargarExcel() {
    const XLSX = await import('xlsx')
    const rows = jugadores.map((j) => ({
      'N°': j.numero_camiseta ?? '',
      Nombre: j.nombre,
      Apellido: j.apellido,
      DNI: j.dni ?? '',
      Posición: j.posicion_preferida ?? '',
      '2ª posición': j.posicion_secundaria ?? '',
      'Pie hábil': j.pie_habil ?? '',
      'Fecha nac.': j.fecha_nacimiento ?? '',
      Edad: edadDesde(j.fecha_nacimiento) ?? '',
      Talle: j.talle ?? '',
      'Peso (kg)': j.peso ?? '',
      'Altura (cm)': j.altura ?? '',
      Teléfono: j.telefono ?? '',
      Email: j.email ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantel')
    XLSX.writeFile(wb, 'plantel-low-team.xlsx')
  }

  return (
    <div>
      <div className="tiles">
        <div className="tile">
          <div className="tile-num">{jugadores.length}</div>
          <div className="tile-lbl">Jugadores</div>
        </div>
        <div className="tile">
          <div className="tile-num">{stats.edadProm ?? '–'}</div>
          <div className="tile-lbl">Edad promedio</div>
        </div>
        <div className="tile">
          <div className="tile-num">{stats.zurdos}</div>
          <div className="tile-lbl">Zurdos</div>
        </div>
        <div className="tile">
          <div className="tile-num">{stats.derechos}</div>
          <div className="tile-lbl">Derechos</div>
        </div>
      </div>
      {stats.ambos > 0 && (
        <p className="nota">Ambos pies: {stats.ambos}</p>
      )}

      <h3 className="resumen-titulo">Por posición</h3>
      <div className="tabla-scroll">
        <table className="tabla-resumen">
          <tbody>
            {POSICIONES.map((p) => (
              <tr key={p}>
                <td className="col-nom">{p}</td>
                <td>{stats.porPos[p]}</td>
              </tr>
            ))}
            {stats.sinPos > 0 && (
              <tr>
                <td className="col-nom">Sin posición</td>
                <td>{stats.sinPos}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="resumen-titulo">Cancha (plantel por línea)</h3>
      <div className="cancha">
        <div className="linea-cancha">
          {porLinea.del.length ? porLinea.del.map((j) => <Chip key={j.id} j={j} />) : <span className="linea-vacia">Delanteros</span>}
        </div>
        <div className="linea-cancha">
          {porLinea.med.length ? porLinea.med.map((j) => <Chip key={j.id} j={j} />) : <span className="linea-vacia">Mediocampistas</span>}
        </div>
        <div className="linea-cancha">
          {porLinea.def.length ? porLinea.def.map((j) => <Chip key={j.id} j={j} />) : <span className="linea-vacia">Defensores</span>}
        </div>
        <div className="linea-cancha">
          {porLinea.arq.length ? porLinea.arq.map((j) => <Chip key={j.id} j={j} />) : <span className="linea-vacia">Arqueros</span>}
        </div>
      </div>
      {porLinea.otro.length > 0 && (
        <p className="nota">Sin posición: {porLinea.otro.map((j) => `${j.nombre} ${j.apellido}`).join(', ')}</p>
      )}

      {puedeEditarPagos(rolEfectivo) && (
        <button className="btn" type="button" onClick={descargarExcel} style={{ marginTop: 18 }}>
          ⬇ Descargar Excel del plantel
        </button>
      )}
    </div>
  )
}
