export type Rol = 'cuerpo_tecnico' | 'administracion' | 'jugador'

export interface Jugador {
  id: string
  nombre: string
  apellido: string
  dni: string | null
  posicion_preferida: string | null
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
