-- ============================================================
-- LOW TEAM - Paso 7: Biblioteca de ejercicios + planificacion
-- (Requiere 01..06 corridos antes)
-- Correr TODO en Supabase -> SQL Editor -> Run
-- ============================================================

-- 1) Biblioteca de ejercicios (reutilizables)
create table if not exists public.ejercicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  created_at timestamptz default now()
);

-- 2) Ejercicios asignados a un entrenamiento (con duracion y orden)
create table if not exists public.entrenamiento_ejercicios (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  ejercicio_id uuid not null references public.ejercicios(id) on delete cascade,
  duracion_min int,
  orden int default 0,
  created_at timestamptz default now()
);

-- 3) RLS OPCION B: todos leen, solo staff escribe
alter table public.ejercicios enable row level security;
drop policy if exists ejercicios_select on public.ejercicios;
create policy ejercicios_select on public.ejercicios for select to authenticated using (true);
drop policy if exists ejercicios_write on public.ejercicios;
create policy ejercicios_write on public.ejercicios for all to authenticated
  using (public.es_staff()) with check (public.es_staff());

alter table public.entrenamiento_ejercicios enable row level security;
drop policy if exists ent_ej_select on public.entrenamiento_ejercicios;
create policy ent_ej_select on public.entrenamiento_ejercicios for select to authenticated using (true);
drop policy if exists ent_ej_write on public.entrenamiento_ejercicios;
create policy ent_ej_write on public.entrenamiento_ejercicios for all to authenticated
  using (public.es_staff()) with check (public.es_staff());
