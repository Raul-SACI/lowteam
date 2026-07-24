-- ============================================================
-- LOW TEAM - Paso 5: Partidos y Estadisticas
-- (Requiere 01..04 corridos antes)
-- Correr TODO en Supabase -> SQL Editor -> Run
-- ============================================================

-- 1) EVENTOS: sirve para partidos y (mas adelante) entrenamientos
create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'partido' check (tipo in ('partido','entrenamiento')),
  fecha date,
  hora time,
  rival text,
  condicion text check (condicion in ('local','visitante')),
  es_oficial boolean default true,       -- partido: true=oficial, false=amistoso
  goles_favor int,
  goles_contra int,
  nota text,
  created_at timestamptz default now()
);

-- 2) ESTADISTICAS: una fila por jugador por evento
create table if not exists public.estadisticas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  jugador_id uuid not null references public.jugadores(id) on delete cascade,
  asistencia text default 'presente'
    check (asistencia in ('presente','ausente','tarde','justificado','lesionado')),
  goles int default 0,
  asistencias int default 0,
  minutos int default 0,
  amarillas int default 0,
  rojas int default 0,
  autogoles int default 0,
  atajadas int default 0,
  unique (evento_id, jugador_id)
);

-- 3) RLS OPCION B: todos los logueados LEEN; solo el staff ESCRIBE
alter table public.eventos enable row level security;
drop policy if exists eventos_select on public.eventos;
create policy eventos_select on public.eventos for select to authenticated using (true);
drop policy if exists eventos_write on public.eventos;
create policy eventos_write on public.eventos for all to authenticated
  using (public.es_staff()) with check (public.es_staff());

alter table public.estadisticas enable row level security;
drop policy if exists estadisticas_select on public.estadisticas;
create policy estadisticas_select on public.estadisticas for select to authenticated using (true);
drop policy if exists estadisticas_write on public.estadisticas;
create policy estadisticas_write on public.estadisticas for all to authenticated
  using (public.es_staff()) with check (public.es_staff());
