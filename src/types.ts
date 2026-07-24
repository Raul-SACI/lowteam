export type Rol = 'administrador' | 'administracion' | 'cuerpo_tecnico' | 'jugador'

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
  peso: number | null
  altura: number | null
  email: string | null
  foto_url: string | null
}

export interface Perfil {
  id: string
  rol: Rol
  jugador_id: string | null
  jugador?: Jugador | null
}

export const ROL_LABEL: Record<Rol, string> = {
  administrador: 'Administrador',
  administracion: 'Administracion',
  cuerpo_tecnico: 'Cuerpo Tecnico',
  jugador: 'Jugador',
}

export const ROLES: Rol[] = [
  'administrador',
  'administracion',
  'cuerpo_tecnico',
  'jugador',
]

// Puede editar lo deportivo (plantel, partidos, entrenamientos, estadisticas)
export function puedeEditarDeportivo(rol?: Rol | null): boolean {
  return rol === 'administrador' || rol === 'cuerpo_tecnico'
}

// Acceso total / gestion de roles
export function esAdmin(rol?: Rol | null): boolean {
  return rol === 'administrador'
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

export type TipoEvento = 'partido' | 'entrenamiento'
export type Asistencia = 'presente' | 'ausente' | 'tarde' | 'justificado' | 'lesionado'

export interface Evento {
  id: string
  tipo: TipoEvento
  fecha: string | null
  hora: string | null
  rival: string | null
  condicion: 'local' | 'visitante' | null
  es_oficial: boolean
  goles_favor: number | null
  goles_contra: number | null
  nota: string | null
}

export interface Estadistica {
  id?: string
  evento_id: string
  jugador_id: string
  asistencia: Asistencia
  goles: number
  asistencias: number
  minutos: number
  amarillas: number
  rojas: number
}

export const ASISTENCIA_LABEL: Record<Asistencia, string> = {
  presente: 'Presente',
  ausente: 'Ausente',
  tarde: 'Llegó tarde',
  justificado: 'Justificado',
  lesionado: 'Lesionado',
}

export const ASISTENCIA_CORTO: Record<Asistencia, string> = {
  presente: 'Pre',
  ausente: 'Aus',
  tarde: 'Tar',
  justificado: 'Jus',
  lesionado: 'Les',
}

export const ASISTENCIAS: Asistencia[] = [
  'presente',
  'ausente',
  'tarde',
  'justificado',
  'lesionado',
]

export type MetricaKey =
  | 'goles'
  | 'asistencias'
  | 'minutos'
  | 'amarillas'
  | 'rojas'

// Columnas numericas de estadistica (clave -> etiqueta corta)
export const METRICAS: { key: MetricaKey; label: string; corto: string }[] = [
  { key: 'goles', label: 'Goles', corto: 'G' },
  { key: 'asistencias', label: 'Asistencias', corto: 'A' },
  { key: 'minutos', label: 'Minutos', corto: 'Min' },
  { key: 'amarillas', label: 'Amarillas', corto: 'Am' },
  { key: 'rojas', label: 'Rojas', corto: 'Ro' },
]

export interface Ejercicio {
  id: string
  nombre: string
  descripcion: string | null
}

export interface EntrenamientoEjercicio {
  id: string
  evento_id: string
  ejercicio_id: string
  duracion_min: number | null
  orden: number
  ejercicio?: Ejercicio | null
}

export interface Cuota {
  id: string
  concepto: string
  fecha_vencimiento: string
  monto: number | null
}

export interface Pago {
  id?: string
  cuota_id: string
  jugador_id: string
  pagado: boolean
  fecha_pago: string | null
}

export type EstadoPago = 'pagada' | 'atrasada' | 'proxima' | 'pendiente'

export const ESTADO_PAGO_LABEL: Record<EstadoPago, string> = {
  pagada: 'Pagada',
  atrasada: 'Atrasada',
  proxima: 'Próxima a vencer',
  pendiente: 'Pendiente',
}

// Puede gestionar pagos (crear cuotas y anotar pagos)
export function puedeEditarPagos(rol?: Rol | null): boolean {
  return rol === 'administrador' || rol === 'administracion'
}

// Dias desde hoy hasta la fecha (positivo = futuro), con fecha local (sin toISOString)
export function diasHasta(fecha: string): number {
  const partes = fecha.split('-').map(Number)
  if (partes.length !== 3) return 0
  const objetivo = new Date(partes[0], partes[1] - 1, partes[2])
  const ahora = new Date()
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86400000)
}

export function estadoCuota(fechaVenc: string, pagado: boolean): EstadoPago {
  if (pagado) return 'pagada'
  const dias = diasHasta(fechaVenc)
  if (dias < 0) return 'atrasada'
  if (dias <= 7) return 'proxima'
  return 'pendiente'
}

// Fecha de hoy en formato YYYY-MM-DD usando componentes locales
export function hoyLocal(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
