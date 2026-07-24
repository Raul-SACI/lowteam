-- ============================================================
-- LOW TEAM - Paso 6: 4 roles y permisos
-- (Requiere 01..05 corridos antes)
-- Correr TODO en Supabase -> SQL Editor -> Run
-- ============================================================

-- 1) Nuevo set de roles (agrega 'administrador')
alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add constraint perfiles_rol_check
  check (rol in ('administrador','administracion','cuerpo_tecnico','jugador'));

-- 2) es_admin(): SOLO el Administrador (acceso total, asigna roles)
create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'administrador'
  );
$$;

-- 3) es_staff(): quienes pueden ESCRIBIR lo deportivo
--    (plantel, partidos, entrenamientos, estadisticas)
--    = Administrador o Cuerpo Tecnico
create or replace function public.es_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol in ('administrador','cuerpo_tecnico')
  );
$$;

-- 4) Perfiles: SOLO el Administrador puede cambiar roles
drop policy if exists perfiles_write on public.perfiles;
create policy perfiles_write on public.perfiles for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- ============================================================
-- Convertite en Administrador (cambia el email si hace falta):
--
-- update public.perfiles set rol = 'administrador'
-- where id = (select id from auth.users where email = 'raulemilianodc@gmail.com');
-- ============================================================
