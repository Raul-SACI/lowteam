-- ============================================================
-- LOW TEAM - Paso 12: Gastos (egresos)
-- (Requiere 01..11 corridos antes)
-- Correr TODO en Supabase -> SQL Editor -> Run
-- ============================================================

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  concepto text not null,
  monto numeric not null,
  fecha date not null,
  created_at timestamptz default now()
);

-- Solo finanzas (Administrador/Administracion) ve y edita los gastos
alter table public.gastos enable row level security;
drop policy if exists gastos_select on public.gastos;
create policy gastos_select on public.gastos for select to authenticated
  using (public.es_finanzas());
drop policy if exists gastos_write on public.gastos;
create policy gastos_write on public.gastos for all to authenticated
  using (public.es_finanzas()) with check (public.es_finanzas());
