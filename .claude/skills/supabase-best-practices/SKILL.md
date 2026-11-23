---
name: supabase-best-practices
description: Reglas para la base de datos y la autenticación con Supabase (Postgres, RLS, Auth con @supabase/ssr en Next.js 16). Úsala antes de crear o cambiar tablas, políticas, migraciones, consultas, el login o el proxy de sesión.
---

# Supabase: base de datos y autenticación

Consulta siempre la documentación actual (skill `context7-docs` y `node_modules/@supabase/ssr/`).

## 1. Esquema y migraciones
- Todo cambio de esquema en un fichero nuevo `supabase/migrations/NNNN_descripcion.sql`. Nunca edites una
  migración ya aplicada; `npm run db:migrate` aplica las pendientes y las registra.
- Nombres en `snake_case` y plural. PK `uuid default gen_random_uuid()`. Fechas `timestamptz default now()`.
- Columna `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade` en toda tabla
  con datos de usuario.
- Restricciones en la base de datos, no solo en la app: `not null`, `check` (longitudes, rangos), enums o `check in (...)`.
- Listas ordenadas pequeñas que se leen enteras (ingredientes, pasos) pueden ir en `jsonb` o `text[]`; si hay que
  filtrar o buscar por ellas, a columna o tabla propia.

## 2. Row Level Security (obligatorio)
- `alter table … enable row level security;` en **todas** las tablas expuestas.
- Una política por operación, limitada al dueño:
  ```sql
  create policy "recipes_select_own" on public.recipes for select to authenticated using (user_id = (select auth.uid()));
  create policy "recipes_insert_own" on public.recipes for insert to authenticated with check (user_id = (select auth.uid()));
  create policy "recipes_update_own" on public.recipes for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  create policy "recipes_delete_own" on public.recipes for delete to authenticated using (user_id = (select auth.uid()));
  ```
- `(select auth.uid())` en vez de `auth.uid()` a secas: Postgres lo evalúa una vez por consulta (rendimiento).
- Índice en `user_id` (toda política filtra por él).
- La **service role key** salta RLS: nunca en la app ni en el navegador.

## 3. Índices y consultas
- Diseña cada índice desde la consulta real: igualdad primero, luego orden. Ej.: listado del usuario ordenado
  por fecha → `(user_id, created_at desc)`.
- Búsqueda por texto en español: columna generada `tsvector` con `to_tsvector('spanish', …)` + índice GIN, o
  `ilike` con índice `pg_trgm` si son pocos datos. Documenta la elección.
- Selecciona solo las columnas necesarias; pagina con `range()` o por cursor.

## 4. Autenticación en Next.js 16
- `@supabase/ssr`: un cliente de **servidor** (cookies de `next/headers`) y, solo si hace falta, uno de navegador.
- `src/proxy.ts` (el antiguo middleware) refresca la sesión en cada petición.
- **Proteger en el servidor:** en las páginas y Server Actions privadas, `supabase.auth.getUser()` (valida el JWT
  contra Supabase) y `redirect('/login')` si no hay usuario. No confíes en `getSession()` para autorizar.
- Login y registro con Server Actions + Zod; mensajes de error claros y en español, sin revelar si un email existe.

## 5. Variables de entorno
- Públicas (navegador): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Solo servidor / scripts: `DATABASE_URL` (pooler en modo transaction, puerto 6543) para las migraciones.
  Con `postgres-js`: `prepare: false` y `max_pipeline: 1` (el pooler deja colgadas las consultas encadenadas).

## Checklist
- [ ] RLS activado y 4 políticas por tabla, probadas con dos usuarios distintos.
- [ ] Migración nueva, aplicada, e índices justificados por consultas.
- [ ] Páginas privadas comprobadas con `getUser()` en el servidor.
