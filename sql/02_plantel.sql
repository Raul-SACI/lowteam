-- ============================================================
-- LOW TEAM - Paso 2: Plantel (2da posicion + fotos)
-- Correr TODO en Supabase -> SQL Editor -> Run
-- ============================================================

-- 1) Segunda posicion (hasta 2 posiciones por jugador)
alter table public.jugadores
  add column if not exists posicion_secundaria text;

-- 2) Bucket publico para las fotos
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

-- 3) Permisos del Storage:
--    - cualquiera puede VER las fotos (bucket publico)
--    - solo el staff puede SUBIR/EDITAR/BORRAR
drop policy if exists fotos_lectura on storage.objects;
create policy fotos_lectura on storage.objects
  for select using (bucket_id = 'fotos');

drop policy if exists fotos_escritura_staff on storage.objects;
create policy fotos_escritura_staff on storage.objects
  for all to authenticated
  using (bucket_id = 'fotos' and public.es_staff())
  with check (bucket_id = 'fotos' and public.es_staff());
