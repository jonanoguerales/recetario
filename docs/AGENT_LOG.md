# Registro del equipo de agentes

Cada tarea la planifica el **Orquestador** (`CLAUDE.md`), la programa **Develop**
(`.claude/agents/develop.md`) y la revisa **Testing** (`.claude/agents/testing.md`) contra sus DIRECTRICES,
en bucle hasta que pasa. Aquí queda constancia de cada vuelta.

## Plan (Orquestador)

| Tarea | Qué | Spec |
|---|---|---|
| T-01 | Base técnica: scripts, Vitest, tokens y layout, clientes Supabase, `proxy.ts`, script de migraciones | 001 |
| T-02 | Esquema `recipes` con RLS, `check` e índices (migración SQL) | 001 · AC-6, AC-10 |
| T-03 | Autenticación: registro, login, logout y protección de rutas | 001 · AC-1…AC-4 |
| T-04 | Pod `recipe-form`: crear y editar con Server Actions + Zod | 001 · AC-5…AC-7 |
| T-04b | Tests end-to-end con Playwright (Chromium en el proyecto) para AC-1…AC-7, con y sin JavaScript y a 375 px | 001 · D-34 |
| T-05 | Pod `recipe-list`: listado, búsqueda, filtros en la URL, estado vacío, skeleton | 001 · AC-8, AC-9, AC-12 |
| T-06 | Pod `recipe-detail`: detalle, favorita y borrar con confirmación | 001 · AC-7, AC-10, AC-11 |
| T-07 | Portada pública y usuario de prueba con recetas de ejemplo | 001 · R7, R8 |
| T-08 | Renderizado por sección (grupos de rutas, portada estática), 404 completa sin JavaScript y revisión de lo ya hecho con Modern Web Guidance | 001 · AC-12, AC-13, AC-14 |

## Tareas

## T-01 · Base técnica
- Spec: specs/001-recetario.md (infraestructura, sin AC-n propios)
- Vuelta 1 · Develop: scripts (typecheck, test, db:migrate), Vitest, tokens light-dark/oklch, AppLayout, `env.ts` con errores claros, clientes Supabase (servidor/navegador), `proxy.ts` de sesión y migrador SQL con `max_pipeline: 1` · Testing: **PASS** (build verificado sin `.env.local`; observaciones: añadir `server-only` y tener en cuenta `cacheComponents` con `<Suspense>`)
- Commit: 6774cd2

## T-02 · Esquema de recetas con RLS
- Spec: specs/001-recetario.md (AC-6, AC-9, AC-10)
- Vuelta 1 · Develop: migración `0001_recipes.sql` (límites de R2 como `check`, trigger `updated_at`, RLS con 4 políticas y `revoke` a `anon`, `search_text` sin tildes con índice trigram, índices por consulta), modelo de dominio y `npm run db:check-rls` (12/12 con rollback) · Testing: **PASS** (verificado contra la BD real; observaciones: revocar TRUNCATE/REFERENCES/TRIGGER a `authenticated` y EXECUTE de las funciones auxiliares a `anon`; T-04 debe usar `RECIPE_LIMITS` y T-05 `normalizeSearchTerm`)
- Commit: b49b139

## T-03 · Autenticación y protección de rutas
- Spec: specs/001-recetario.md (AC-1, AC-2, AC-3, AC-4)
- Vuelta 1 · Develop: pod `auth` (login y registro con Server Actions + Zod, errores por campo accesibles, `useActionState`), `requireUser()` con `getUser()` en servidor, redirección optimista en `proxy.ts`, logout, nav de sesión con skeleton, migración `0002_harden_grants.sql` · Testing: **FAIL** (D-21: con `cacheComponents` activo, sin JavaScript un envío con error devolvía una página en blanco; propuso y comprobó quitar `cacheComponents`/`partialPrefetching`)
- (Humano) Se desactiva «Confirm email» en Supabase; el registro pasa a entrar directamente.
- Vuelta 2 · Develop: `next.config.ts` sin `cacheComponents` ni `partialPrefetching` (rutas dinámicas), tests reetiquetados · Testing: **PASS** (errores visibles sin JS en login y registro, registro de punta a punta, AC-1…AC-4 en vivo; recomienda sacar el nav de sesión del `<Suspense>` para que funcione sin JS)
- Commit: 588ec9f

## T-03b · Navegación de sesión visible sin JavaScript
- Origen: recomendación de Testing al cerrar T-03 (D-21/D-22)
- Vuelta 1 · Develop: `SessionNavContainer` async sin `<Suspense>` en el layout raíz; borrado el skeleton que ya no se usaba · Testing: **PASS** (sin JS: cabecera completa con y sin sesión, logout 303 a `/`, error de login con página completa; observaciones: comentarios desactualizados en `auth.scenes.tsx` y `guards.container.tsx`)
- Commit: ec2c782

## T-04 · Crear y editar recetas
- Spec: specs/001-recetario.md (AC-5, AC-6, AC-7, AC-10, AC-12)
- (Incidencia) La primera ejecución de Develop se cortó al cerrarse la sesión; se retomó revisando lo que había dejado.
- Vuelta 1 · Develop: pod `recipe-form` (un formulario para crear y editar, ingredientes y pasos «uno por línea», Zod desde `RECIPE_LIMITS`, errores accesibles, `useActionState`), detalle provisional, rutas privadas, comentarios de T-03b corregidos; documentación en Context7 (Next 16.4.5, Zod 4, Supabase) y 5 guías de Modern Web Guidance · Testing: **FAIL** (D-24/D-26: bordes de los campos con contraste 1,44:1, se exige 3:1; observación: la 404 sin JavaScript sale en blanco por cómo funciona Next 16.4 → nuevo AC-14, planificado en T-08)
- Vuelta 2 · Develop: token `--color-border-strong` (4,1–5,2:1 en claro y oscuro), id validado con `z.uuid()`, región `role="alert"` siempre montada · Testing: **PASS** (contraste recalculado, pasada en vivo sin JS; observaciones para T-08: Zod podría acabar en el JS del navegador y la región de error vacía usa `display: none`)
- Commit: b434f6d

## T-04b · Tests end-to-end con Playwright
- Spec: D-34 (AC-1…AC-7, AC-10 y AC-12 de las pantallas existentes)
- Vuelta 1 · Develop: Playwright 1.65 con Chromium en el proyecto, proyectos `desktop` / `mobile-375` / `no-js` + `setup` (sesiones guardadas para no pasar el límite de Supabase Auth), usuarios de prueba por SQL creados y borrados en cada ejecución, 50 tests nombrados por AC; documentación en Context7 (`/microsoft/playwright`) · Testing: **PASS** (50/50 dos veces sin intermitencias; rompió el código 3 veces a propósito y los tests lo detectaron; limpieza verificada por SQL; observación: el e2e de AC-5 debería comprobar más campos del detalle → T-06)
