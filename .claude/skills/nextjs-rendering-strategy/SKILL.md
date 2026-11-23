---
name: nextjs-rendering-strategy
description: Decide y comprueba cómo se renderiza cada sección del Recetario en Next.js 16 (estática, SSR dinámico con streaming o isla de cliente). Úsala antes de crear o tocar una ruta, un layout, un Server/Client Component o cualquier lectura de cookies(), headers() o searchParams.
---

# Estrategia de renderizado (Next.js 16, sin Cache Components)

Fuente: documentación del paquete instalado (`node_modules/next/dist/docs/01-app/02-guides/`:
`rendering-philosophy.md`, `public-static-pages.md`, `caching-without-cache-components.md`, `streaming.md`)
y Context7 (`/vercel/next.js/v16.4.5`). Si dudas de una API, consulta Context7 antes de escribir código.

## Por qué sin Cache Components
`cacheComponents` (y `partialPrefetching`) están **desactivados a propósito** (T-03): con ellos activos, un
formulario enviado sin JavaScript que devolvía un error del servidor respondía sin `<html>` y la persona veía
una página en blanco (incumple D-21). Sin Cache Components el límite estático/dinámico es **por ruta**:
- Una ruta es **estática** (○ en `next build`) si no lee datos de la petición.
- Leer `cookies()`, `headers()` o `searchParams` hace **dinámica** (ƒ) toda la ruta.
- **Si un layout lee la cookie de sesión, todas las rutas que cuelgan de él son dinámicas.** Por eso la sesión
  no se lee en el layout raíz: se lee solo en los layouts de las secciones que la necesitan.

## Regla de decisión
1. ¿El contenido es **igual para todo el mundo**? → **Estático**. Sin `cookies()` ni `getUser()` en esa ruta
   ni en sus layouts. Se sirve desde la CDN de Vercel.
2. ¿Depende de **quién eres** o de la **URL** (sesión, recetas propias, filtros)? → **SSR dinámico** en Server
   Components, con `<Suspense>` + skeleton de la misma forma (skill `ux-loading-and-motion`) alrededor de lo que
   tarda, para que la cabecera y el resto lleguen al instante (streaming).
3. ¿Hace falta **interactividad en el navegador** (estado pendiente, confirmar, optimista)? → una **isla de
   cliente** pequeña (`'use client'`) dentro de una página de servidor. Nunca una página entera de cliente.
4. **Nunca** se piden datos desde el navegador con `useEffect`/`fetch` para pintar la página: los datos se leen
   en Server Components y las escrituras van por Server Actions.
5. Todo debe seguir funcionando sin JavaScript (D-21): JS solo mejora (pendiente, optimista, confirmar).

## Decisión por sección

| Sección | Ruta(s) | Renderizado | Motivo |
|---|---|---|---|
| Portada pública | `/` | **Estática** (○) | Igual para todos. Cabecera pública con enlaces fijos («Entrar», «Crear cuenta», «Mis recetas»); si no hay sesión, `/recetas` ya redirige a `/login`. |
| Página no encontrada | `not-found` | **Estática** | No depende de la petición. |
| Login y registro | `/login`, `/registro` | **Estática** si se puede; si no, SSR justificado | El formulario es igual para todos. La redirección «con sesión → /recetas» la hace `proxy.ts`. Las Server Actions funcionan desde una página estática; comprobar el caso de error sin JS. |
| Mis recetas (listado) | `/recetas?q=&categoria=&favoritas=` | **SSR dinámico + streaming** | Datos del usuario y filtros en la URL. Cabecera y filtros al instante; la lista dentro de `<Suspense>` con skeleton. |
| Detalle, nueva, editar | `/recetas/[id]`, `/recetas/nueva`, `/recetas/[id]/editar` | **SSR dinámico** | Sesión y datos propios (RLS); `notFound()` si no es del usuario. |
| Navegación con sesión | layout de las secciones privadas | **SSR** (en el layout privado, no en el raíz) | Email y «Cerrar sesión» llegan en el HTML: funcionan sin JS. |

Islas de cliente permitidas: estado pendiente de formularios (`useActionState`), confirmación de borrado
(`<dialog>`), marcar favorita con respuesta inmediata (`useOptimistic`). Cualquier otra necesita justificación.

## Cómo se organiza
- **Grupos de rutas** para separar layouts sin cambiar las URLs: `src/app/(public)/` (portada, layout estático),
  `src/app/(auth)/` (login y registro), `src/app/(app)/` (zona privada: layout con `requireUser()` y nav de sesión).
- El layout raíz (`src/app/layout.tsx`) solo pone `<html>`, metadatos, viewport y estilos: **no lee la sesión**.

## Cómo se comprueba (Testing, D-28)
- `npm run build` y revisar la tabla de rutas: `/` y `not-found` deben salir **○ (Static)**; las privadas **ƒ**.
  Si una ruta que debería ser estática sale ƒ, es FAIL: encuentra qué lee la petición.
- Buscar `'use client'` en el diff: cada uno debe ser una de las islas permitidas o estar justificado.
- Buscar `useEffect` con `fetch`: no debe haber carga de datos desde el cliente.
- Para el tamaño del JavaScript del navegador, la skill `next-bundle-optimizer` (modo auditoría).
