-- ============================================================
-- LOW TEAM - Paso 8: Pagos (cuotas programadas)
-- (Requiere 01..07 corridos antes)
-- Correr TODO en Supabase -> SQL Editor -> Run
-- ============================================================

-- 1) CUOTAS: pago programado, igual para todos los jugadores
create table if not exists public.cuotas (
  id uuid primary key default gen_random_uuid(),
  concepto text not null,
  fecha_vencimiento date not null,
  monto numeric,
  created_at timestamptz default now()
);

-- 2) PAGOS: estado de pago de cada jugador para cada cuota
create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  cuota_id uuid not null references public.cuotas(id) on delete cascade,
  jugador_id uuid not null references public.jugadores(id) on delete cascade,
  pagado boolean default false,
  fecha_pago date,
  created_at timestamptz default now(),
  unique (cuota_id, jugador_id)
);

-- 3) es_finanzas(): quienes gestionan pagos = Administrador o Administracion
create or replace function public.es_finanzas()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol in ('administrador','administracion')
  );
$$;

-- 4) RLS
-- Cuotas: todos las leen (el calendario es igual para todos); escribe finanzas
alter table public.cuotas enable row level security;
drop policy if exists cuotas_select on public.cuotas;
create policy cuotas_select on public.cuotas for select to authenticated using (true);
drop policy if exists cuotas_write on public.cuotas;
create policy cuotas_write on public.cuotas for all to authenticated
  using (public.es_finanzas()) with check (public.es_finanzas());

-- Pagos: finanzas ve TODO; cada jugador ve SOLO lo suyo; escribe finanzas
alter table public.pagos enable row level security;
drop policy if exists pagos_select on public.pagos;
create policy pagos_select on public.pagos for select to authenticated using (
  public.es_finanzas()
  or jugador_id = (select jugador_id from public.perfiles where id = auth.uid())
);
drop policy if exists pagos_write on public.pagos;
create policy pagos_write on public.pagos for all to authenticated
  using (public.es_finanzas()) with check (public.es_finanzas());
