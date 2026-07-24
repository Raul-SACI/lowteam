-- ============================================================
-- LOW TEAM - Paso 11: Email en la ficha del jugador (para el Excel)
-- (Requiere 01..10 corridos antes)
-- Correr TODO en Supabase -> SQL Editor -> Run
-- ============================================================

alter table public.jugadores add column if not exists email text;

-- Rellenar el email de los jugadores que ya tienen cuenta
update public.jugadores j
set email = u.email
from public.perfiles p
join auth.users u on u.id = p.id
where p.jugador_id = j.id
  and (j.email is null or j.email = '');

-- Trigger de registro: guardar tambien el email del alta
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare nuevo_jugador uuid;
begin
  insert into public.jugadores
    (nombre, apellido, dni, posicion_preferida, posicion_secundaria,
     pie_habil, telefono, numero_camiseta, fecha_nacimiento, talle, peso, altura, email)
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
    nullif(new.raw_user_meta_data->>'altura','')::numeric,
    new.email
  ) returning id into nuevo_jugador;
  insert into public.perfiles (id, rol, jugador_id) values (new.id, 'jugador', nuevo_jugador);
  return new;
end; $$;
