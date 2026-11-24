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
| T-07 | Portada estática, grupos de rutas, 404 completa sin JavaScript y usuario de prueba con recetas (une las antiguas T-07 y T-08 a petición del humano) | 001 · R7, R8, AC-13, AC-14 |
| T-08 | Flecha del desplegable con el mismo margen que el texto (pedido por el humano con una captura) | 001 · AC-12 |

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
- Commit: 838de10

## T-05 · Listado de mis recetas con búsqueda y filtros
- Spec: specs/001-recetario.md (AC-8, AC-9, AC-12, AC-13)
- (Incidencia) La ejecución de Develop se cortó por el límite de uso de la API y se retomó desde donde estaba.
- Vuelta 1 · Develop: pod `recipe-list` (lista completa en el HTML, `<search>` + `<form method="get">`, búsqueda sin tildes con `normalizeSearchTerm`, filtros en la URL validados con Zod, paginación por URL, tarjetas accesibles, 3 estados vacíos, isla de cliente con filtros automáticos y skeleton de la misma forma); un e2e destapó un fallo real («Quitar filtros» con JS no vaciaba los controles) y lo corrigió · Testing: **PASS** (96 Vitest, 82 e2e, limpieza por SQL; observaciones: la skill `ux-loading-and-motion` contradice la guía de accesibilidad al poner `role="status"` en el skeleton; el auto-envío del `<select>` lanza una navegación por cada flecha del teclado; `*` actúa como comodín)
- Commit: c687d3e

## T-05b · Ajustes de accesibilidad del listado
- Origen: observaciones de Testing en T-05 (el Orquestador corrigió antes la skill `ux-loading-and-motion` en 93a9d23 y decidió el comportamiento de los filtros)
- Vuelta 1 · Develop: skeleton con `aria-hidden` y una sola región `status` con el resultado; «Favoritas» al momento y categoría con la misma pausa de 400 ms que la búsqueda (una sola navegación aunque se recorran opciones); `*` → `_` en la búsqueda; foco de la tarjeta con `:has()` dentro de `@supports` · Testing: **PASS** (97 Vitest, 85 e2e; observaciones menores para T-08: e2e con `*` literal, `toBeFocused` en el select, esperas fijas en tests de tiempos)
- Commit: 525d852

## T-06 · Detalle de receta, favorita y borrar
- Spec: specs/001-recetario.md (AC-5, AC-7, AC-10, AC-11, AC-12)
- Vuelta 1 · Develop: detalle completo, «Favorita» con `aria-pressed` y cambio instantáneo (`useFormStatus`), borrar con `<dialog>` nativo (con JS) o página `/recetas/[id]/borrar` (sin JS), aviso de borrado de un solo uso con cookie flash consumida en el proxy · Testing: **PASS** (112 Vitest, 104 e2e; revisó la seguridad del aviso contra el código de Next; observaciones: e2e para la cabecera inyectada y vigilar el truco `withJs` al actualizar Next)
- (Humano) Pide acelerar: a partir de aquí revisiones de Testing más ligeras y T-07/T-08 unidas en una sola tarea.
- Commit: dca59ce

## T-07 · Portada estática, grupos de rutas, 404 sin JavaScript y usuario de prueba
- Spec: specs/001-recetario.md (R7, R8, AC-13, AC-14)
- Vuelta 1 · Develop: grupos `(public)`/`(auth)`/`(app)` sin cambiar URLs, layout raíz sin sesión (○ `/`, `/_not-found`, `/login`, `/registro`; ƒ zona privada), portada `home`, 404 completa sin JS reescribiendo desde `proxy.ts` a `/_no-encontrada` tras consultar la receta con RLS (las páginas siguen comprobando en servidor), `npm run db:seed-demo` idempotente con `admin@recetario.app` y 8 recetas (contraseña solo en `.env.local`) · Testing (revisión rápida): **PASS** (116 Vitest, 117 e2e, limpieza por SQL; observaciones: enlace a la portada en la 404, coste de la consulta del proxy, nombre reservado `/_no-encontrada`)
- Commit: ca8a611

## T-08 · Flecha del desplegable separada del borde
- Origen: captura del humano (la flecha nativa del `<select>` quedaba pegada al borde derecho)
- Vuelta 1 · Develop: una regla compartida en `globals.css` para `select:not([multiple], [size])` con `appearance: none` y chevron en `currentColor` a la misma distancia del borde que el texto; MWG `branded-select-styling` (descarta `appearance: base-select` porque quita el selector nativo del móvil y no está en Firefox) · Testing (revisión rápida): **PASS** (116 Vitest, build sin cambios de renderizado, ningún `background` abreviado anula el chevron; observaciones: solo LTR, revisar `forced-colors` en una pasada futura)
