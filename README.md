# Low Team

App para gestionar un equipo de futbol (plantel, formaciones, entrenamientos,
partidos, estadisticas, asistencias y pagos).

## Stack
- React + TypeScript + Vite
- PWA instalable (mobile-first)
- Supabase (base de datos + auth + storage)
- Deploy en Vercel

## Configuracion local
1. `npm install`
2. Copiar `.env.example` como `.env.local` y completar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. `npm run dev`

## Verificacion antes de commitear
- `npx tsc --noEmit`
- `npm run build`

## Variables de entorno en Vercel
Cargar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el panel de Vercel
(Project Settings -> Environment Variables).

## Roles
- Cuerpo Tecnico: gestion deportiva.
- Administracion: pagos, datos y gestion de usuarios/roles.
- Jugador: solo consulta.
