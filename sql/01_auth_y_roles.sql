-- ============================================================
-- LOW TEAM - Paso 1: Jugadores, Perfiles, Registro y Roles
-- Correr TODO este bloque en Supabase -> SQL Editor -> Run
-- ============================================================

-- 1) FICHA DEL JUGADOR (plantel)
create table if not exists public.jugadores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  dni text,
  posicion_preferida text,
  fecha_nacimiento date,
  talle text,
  numero_camiseta int,
  pie_habil text,
  telefono text,
  foto_url text,
  created_at timestamptz default now()
);

-- 2) PERFIL: rol de cada usuario y link a su ficha
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol text not null default 'jugador'
    check (rol in ('cuerpo_tecnico','administracion','jugador')),
  jugador_id uuid references public.jugadores(id) on delete set null,
  created_at timestamptz default now()
);

-- 3) TRIGGER: al registrarse, se crea la ficha + el perfil (rol jugador)
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
    (nombre, apellido, dni, posicion_preferida, fecha_nacimiento, talle)
  values (
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    coalesce(new.raw_user_meta_data->>'apellido', ''),
    nullif(new.raw_user_meta_data->>'dni', ''),
    nullif(new.raw_user_meta_data->>'posicion_preferida', ''),
    nullif(new.raw_user_meta_data->>'fecha_nacimiento', '')::date,
    nullif(new.raw_user_meta_data->>'talle', '')
  )
  returning id into nuevo_jugador;

  insert into public.perfiles (id, rol, jugador_id)
  values (new.id, 'jugador', nuevo_jugador);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) HELPER: saber si el usuario actual es staff (cuerpo tecnico o admin)
create or replace function public.es_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid()
      and rol in ('cuerpo_tecnico','administracion')
  );
$$;

-- 5) RLS - OPCION B: todos los logueados LEEN; solo el staff ESCRIBE.
--    (Las lecturas quedan libres, no revive el problema de datos viejos.)

alter table public.jugadores enable row level security;
drop policy if exists jugadores_select on public.jugadores;
create policy jugadores_select on public.jugadores
  for select to authenticated using (true);
drop policy if exists jugadores_write on public.jugadores;
create policy jugadores_write on public.jugadores
  for all to authenticated
  using (public.es_staff()) with check (public.es_staff());

alter table public.perfiles enable row level security;
drop policy if exists perfiles_select on public.perfiles;
create policy perfiles_select on public.perfiles
  for select to authenticated using (true);
drop policy if exists perfiles_write on public.perfiles;
create policy perfiles_write on public.perfiles
  for all to authenticated
  using (public.es_staff()) with check (public.es_staff());

-- ============================================================
-- DESPUES de registrarte por primera vez en la app, corre ESTO
-- para convertirte en Administracion (cambia el email por el tuyo):
--
-- update public.perfiles set rol = 'administracion'
-- where id = (select id from auth.users where email = 'raulemilianodc@gmail.com');
-- ============================================================
