-- ============================================================
-- LOW TEAM - Paso 9: Alineacion (11 titular en la cancha)
-- (Requiere 01..08 corridos antes)
-- Correr TODO en Supabase -> SQL Editor -> Run
-- ============================================================

-- Sistema/formacion del partido (referencia)
alter table public.eventos add column if not exists sistema text;

-- Posicion de cada jugador en la cancha para un partido (x,y en %)
create table if not exists public.alineacion (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  jugador_id uuid not null references public.jugadores(id) on delete cascade,
  x numeric not null default 50,
  y numeric not null default 50,
  created_at timestamptz default now(),
  unique (evento_id, jugador_id)
);

-- RLS Opcion B: todos leen, solo staff escribe
alter table public.alineacion enable row level security;
drop policy if exists alineacion_select on public.alineacion;
create policy alineacion_select on public.alineacion for select to authenticated using (true);
drop policy if exists alineacion_write on public.alineacion;
create policy alineacion_write on public.alineacion for all to authenticated
  using (public.es_staff()) with check (public.es_staff());
