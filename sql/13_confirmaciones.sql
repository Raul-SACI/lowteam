-- ============================================================
-- LOW TEAM - Paso 13: Confirmacion de asistencia al proximo evento
-- (Requiere 01..12 corridos antes)
-- Correr TODO en Supabase -> SQL Editor -> Run
-- ============================================================

create table if not exists public.confirmaciones (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  jugador_id uuid not null references public.jugadores(id) on delete cascade,
  asiste boolean not null,
  created_at timestamptz default now(),
  unique (evento_id, jugador_id)
);

alter table public.confirmaciones enable row level security;

-- Todos los logueados pueden VER las confirmaciones (para contar quienes van)
drop policy if exists confirmaciones_select on public.confirmaciones;
create policy confirmaciones_select on public.confirmaciones
  for select to authenticated using (true);

-- Cada usuario confirma SOLO por si mismo; el staff puede por cualquiera
drop policy if exists confirmaciones_write on public.confirmaciones;
create policy confirmaciones_write on public.confirmaciones
  for all to authenticated
  using (
    jugador_id = (select jugador_id from public.perfiles where id = auth.uid())
    or public.es_staff()
  )
  with check (
    jugador_id = (select jugador_id from public.perfiles where id = auth.uid())
    or public.es_staff()
  );
