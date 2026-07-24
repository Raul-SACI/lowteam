-- ============================================================
-- LOW TEAM - Paso 3: Selfie al registrarse
-- (Requiere haber corrido 01 y 02 antes)
-- Correr TODO en Supabase -> SQL Editor -> Run
-- ============================================================

-- 1) Funcion controlada: cada usuario setea SOLO su propia foto.
--    No puede tocar ningun otro dato ni la ficha de otro jugador.
create or replace function public.guardar_mi_foto(url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.jugadores
  set foto_url = url
  where id = (select jugador_id from public.perfiles where id = auth.uid());
end;
$$;

-- 2) Permiso de Storage: un usuario puede subir/actualizar UNICAMENTE
--    el archivo de su propia ficha (jugadores/<su jugador_id>).
drop policy if exists fotos_selfie_propia on storage.objects;
create policy fotos_selfie_propia on storage.objects
  for all to authenticated
  using (
    bucket_id = 'fotos'
    and name = 'jugadores/' || (
      select jugador_id::text from public.perfiles where id = auth.uid()
    )
  )
  with check (
    bucket_id = 'fotos'
    and name = 'jugadores/' || (
      select jugador_id::text from public.perfiles where id = auth.uid()
    )
  );
