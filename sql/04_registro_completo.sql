-- ============================================================
-- LOW TEAM - Paso 4: Registro completo
-- (Requiere 01, 02 y 03 corridos antes)
-- Correr TODO en Supabase -> SQL Editor -> Run
-- ============================================================

-- 1) Trigger ampliado: al registrarse guarda tambien
--    2da posicion, pie habil, telefono y numero de camiseta.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nuevo_jugador uuid;
begin
  insert into public.jugadores
    (nombre, apellido, dni, posicion_preferida, posicion_secundaria,
     pie_habil, telefono, numero_camiseta, fecha_nacimiento, talle)
  values (
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    coalesce(new.raw_user_meta_data->>'apellido', ''),
    nullif(new.raw_user_meta_data->>'dni', ''),
    nullif(new.raw_user_meta_data->>'posicion_preferida', ''),
    nullif(new.raw_user_meta_data->>'posicion_secundaria', ''),
    nullif(new.raw_user_meta_data->>'pie_habil', ''),
    nullif(new.raw_user_meta_data->>'telefono', ''),
    nullif(new.raw_user_meta_data->>'numero_camiseta', '')::int,
    nullif(new.raw_user_meta_data->>'fecha_nacimiento', '')::date,
    nullif(new.raw_user_meta_data->>'talle', '')
  )
  returning id into nuevo_jugador;

  insert into public.perfiles (id, rol, jugador_id)
  values (new.id, 'jugador', nuevo_jugador);

  return new;
end;
$$;

-- 2) Candado: nunca dos jugadores con el mismo numero de camiseta
create unique index if not exists jugadores_numero_unico
  on public.jugadores (numero_camiseta)
  where numero_camiseta is not null;

-- 3) Numeros ya ocupados (solo los numeros, sin datos personales).
--    Se puede consultar sin estar logueado, para el registro.
create or replace function public.numeros_camiseta_ocupados()
returns int[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(numero_camiseta order by numero_camiseta), '{}')
  from public.jugadores
  where numero_camiseta is not null;
$$;

grant execute on function public.numeros_camiseta_ocupados() to anon, authenticated;
