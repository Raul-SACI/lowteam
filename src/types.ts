export type Rol = 'cuerpo_tecnico' | 'administracion' | 'jugador'

export interface Jugador {
  id: string
  nombre: string
  apellido: string
  dni: string | null
  posicion_preferida: string | null
  posicion_secundaria: string | null
  fecha_nacimiento: string | null
  talle: string | null
  numero_camiseta: number | null
  pie_habil: string | null
  telefono: string | null
  foto_url: string | null
}

export interface Perfil {
  id: string
  rol: Rol
  jugador_id: string | null
  jugador?: Jugador | null
}

export const ROL_LABEL: Record<Rol, string> = {
  cuerpo_tecnico: 'Cuerpo Tecnico',
  administracion: 'Administracion',
  jugador: 'Jugador',
}

export const POSICIONES = [
  'Arquero',
  'Defensor central',
  'Lateral derecho',
  'Lateral izquierdo',
  'Volante central',
  'Volante por derecha',
  'Volante por izquierda',
  'Enganche',
  'Delantero',
]

export const TALLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const PIES = ['Derecho', 'Izquierdo', 'Ambos']

export function edadDesde(fecha: string | null): number | null {
  if (!fecha) return null
  // fecha viene como 'YYYY-MM-DD'; usamos componentes locales (sin toISOString)
  const partes = fecha.split('-')
  if (partes.length !== 3) return null
  const anio = Number(partes[0])
  const mes = Number(partes[1])
  const dia = Number(partes[2])
  const hoy = new Date()
  let edad = hoy.getFullYear() - anio
  const cumpleEsteAnio =
    hoy.getMonth() + 1 > mes ||
    (hoy.getMonth() + 1 === mes && hoy.getDate() >= dia)
  if (!cumpleEsteAnio) edad -= 1
  return edad >= 0 && edad < 120 ? edad : null
}
