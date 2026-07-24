import { supabase } from './supabase'

// IDs de jugadores que en realidad son staff (Administrador o Cuerpo Tecnico):
// no deben figurar en el plantel ni en las estadisticas.
export async function staffJugadorIds(): Promise<Set<string>> {
  const { data } = await supabase
    .from('perfiles')
    .select('jugador_id')
    .in('rol', ['administrador', 'cuerpo_tecnico'])
    .range(0, 999)
  return new Set(
    ((data as { jugador_id: string | null }[]) ?? [])
      .map((p) => p.jugador_id)
      .filter((x): x is string => !!x)
  )
}
