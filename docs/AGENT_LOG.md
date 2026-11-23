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
| T-05 | Pod `recipe-list`: listado, búsqueda, filtros en la URL, estado vacío, skeleton | 001 · AC-8, AC-9, AC-12 |
| T-06 | Pod `recipe-detail`: detalle, favorita y borrar con confirmación | 001 · AC-7, AC-10, AC-11 |
| T-07 | Portada pública y usuario de prueba con recetas de ejemplo | 001 · R7, R8 |

## Tareas

## T-01 · Base técnica
- Spec: specs/001-recetario.md (infraestructura, sin AC-n propios)
- Vuelta 1 · Develop: scripts (typecheck, test, db:migrate), Vitest, tokens light-dark/oklch, AppLayout, `env.ts` con errores claros, clientes Supabase (servidor/navegador), `proxy.ts` de sesión y migrador SQL con `max_pipeline: 1` · Testing: **PASS** (build verificado sin `.env.local`; observaciones: añadir `server-only` y tener en cuenta `cacheComponents` con `<Suspense>`)
- Commit: 6774cd2

## T-02 · Esquema de recetas con RLS
- Spec: specs/001-recetario.md (AC-6, AC-9, AC-10)
- Vuelta 1 · Develop: migración `0001_recipes.sql` (límites de R2 como `check`, trigger `updated_at`, RLS con 4 políticas y `revoke` a `anon`, `search_text` sin tildes con índice trigram, índices por consulta), modelo de dominio y `npm run db:check-rls` (12/12 con rollback) · Testing: **PASS** (verificado contra la BD real; observaciones: revocar TRUNCATE/REFERENCES/TRIGGER a `authenticated` y EXECUTE de las funciones auxiliares a `anon`; T-04 debe usar `RECIPE_LIMITS` y T-05 `normalizeSearchTerm`)
