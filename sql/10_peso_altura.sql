-- ============================================================
-- LOW TEAM - Paso 10: Peso y Altura en la ficha
-- (Requiere 01..09 corridos antes)
-- Correr TODO en Supabase -> SQL Editor -> Run
-- ============================================================

alter table public.jugadores add column if not exists peso numeric;   -- kg
alter table public.jugadores add column if not exists altura numeric; -- cm

-- Trigger de registro: ahora toma tambien peso y altura
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare nuevo_jugador uuid;
begin
  insert into public.jugadores
    (nombre, apellido, dni, posicion_preferida, posicion_secundaria,
     pie_habil, telefono, numero_camiseta, fecha_nacimiento, talle, peso, altura)
  values (
    coalesce(new.raw_user_meta_data->>'nombre',''),
    coalesce(new.raw_user_meta_data->>'apellido',''),
    nullif(new.raw_user_meta_data->>'dni',''),
    nullif(new.raw_user_meta_data->>'posicion_preferida',''),
    nullif(new.raw_user_meta_data->>'posicion_secundaria',''),
    nullif(new.raw_user_meta_data->>'pie_habil',''),
    nullif(new.raw_user_meta_data->>'telefono',''),
    nullif(new.raw_user_meta_data->>'numero_camiseta','')::int,
    nullif(new.raw_user_meta_data->>'fecha_nacimiento','')::date,
    nullif(new.raw_user_meta_data->>'talle',''),
    nullif(new.raw_user_meta_data->>'peso','')::numeric,
    nullif(new.raw_user_meta_data->>'altura','')::numeric
  ) returning id into nuevo_jugador;
  insert into public.perfiles (id, rol, jugador_id) values (new.id, 'jugador', nuevo_jugador);
  return new;
end; $$;
