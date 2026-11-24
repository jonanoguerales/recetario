# Cómo se ha usado Claude Code en este proyecto

Este documento explica cómo se montó y se usó el equipo de agentes que ha construido el Recetario. La evidencia
de cada tarea (vueltas, fallos y commits) está en [`AGENT_LOG.md`](AGENT_LOG.md).

## 1. Tres agentes con papeles separados

| Pieza de Claude Code | Fichero | Para qué |
|---|---|---|
| Memoria del proyecto (agente principal) | `CLAUDE.md` (+ `AGENTS.md` de Next.js) | Convierte la sesión principal en el **Orquestador**: flujo obligatorio, reglas y formato del registro. |
| Subagente | `.claude/agents/develop.md` | **Develop**: herramientas de lectura/escritura + Context7. Su `.md` dice *cómo se programa aquí*. |
| Subagente | `.claude/agents/testing.md` | **Testing**: solo lectura + Bash para ejecutar verificaciones + Context7. Su `.md` contiene las **DIRECTRICES** D-01…D-34. |

La separación es deliberada:
- **Develop no puede darse el visto bueno a sí mismo**: lo revisa otro agente con un contexto limpio, que mira
  el `git diff` real y ejecuta los comandos en vez de fiarse del resumen.
- **Testing no puede arreglar el código** (no tiene `Write`/`Edit`): solo describe el fallo con su directriz,
  fichero y línea, y cómo arreglarlo.
- **El Orquestador no programa ni rebaja directrices**: si Testing dice FAIL, pasa los fallos *literalmente* a
  Develop. Máximo 3 vueltas; si no, decide el humano.

## 2. Flujo de una tarea

1. **Spec (SDD).** El Orquestador escribe o completa `specs/001-recetario.md` con criterios `AC-n` verificables.
2. **Brief a Develop**: objetivo, `AC-n`, ficheros/pods afectados, qué queda fuera, y el recordatorio de
   D-26 (Modern Web Guidance), D-27 (Context7) y D-28 (renderizado).
3. **Develop** implementa con TDD (Vitest para la lógica, Playwright para cada AC con interfaz) y devuelve un
   informe fijo: RESUMEN, FICHEROS, VERIFICACIÓN, DIRECTRICES, DOCUMENTACIÓN, MODERN WEB GUIDANCE, RENDERIZADO.
4. **Testing** ejecuta `lint`, `typecheck`, `test`, `build` y `test:e2e`, revisa el diff y responde
   `VEREDICTO: PASS | FAIL` con `[D-xx] fichero:línea — qué — cómo`.
5. **Cierre**: entrada en `AGENT_LOG.md`, commit `tipo(ámbito): …` con `Develop ⇄ Testing: N vuelta(s)` y push.

## 3. Ejemplos reales del bucle Develop ⇄ Testing

- **T-03 (D-21).** Con `cacheComponents` activado, un formulario enviado *sin JavaScript* que devolvía un error
  mostraba una página en blanco. Testing lo detectó, lo reprodujo y propuso quitar la opción; vuelta 2: PASS.
- **T-04 (D-24/D-26).** Los bordes de los campos tenían un contraste de 1,44:1 (se exige 3:1). Develop creó el
  token `--color-border-strong` (4,1–5,2:1 en claro y oscuro); vuelta 2: PASS.
- **AC-14.** Testing descubrió que en Next 16.4 `notFound()` deja el cuerpo vacío sin JS. El Orquestador lo
  convirtió en un criterio nuevo y Develop lo resolvió en T-07 reescribiendo a la 404 desde `proxy.ts`.
- **Observaciones que se convierten en tareas**: T-03b y T-05b nacen de observaciones no bloqueantes de Testing.

## 4. Skills del proyecto (`.claude/skills/`)

Las skills son instrucciones que los agentes cargan cuando la tarea lo pide:

| Skill | Origen | Qué aporta |
|---|---|---|
| `pods-architecture` | propia | Estructura por pods, barrels, container/component, mappers → ViewModel. |
| `spec-driven-development` | propia | Spec → tests → código; cada test nombra su `AC-n`. |
| `supabase-best-practices` | propia | RLS con `(select auth.uid())`, migraciones, `@supabase/ssr`, pooler. |
| `ux-loading-and-motion` | propia | Skeletons de la misma forma, sin saltos, `prefers-reduced-motion`. |
| `nextjs-rendering-strategy` | propia | Estático / SSR / isla de cliente por sección y cómo comprobarlo en `next build`. |
| `context7-docs` | propia | Cómo consultar la documentación actual con el MCP Context7. |
| `modern-web-guidance` | Google Chrome (oficial) | Buenas prácticas actuales de HTML/CSS/JS; obligatoria (D-26). |
| `next-bundle-optimizer`, `next-dev-loop`, `next-cache-components-*` | `vercel/next.js` (oficiales) | Auditoría del JS del navegador, verificación en ejecución y Cache Components. |

Las externas se instalaron con `npx skills add … --copy` y su versión queda fijada en `skills-lock.json`.
Las propias se corrigieron cuando la realidad las contradijo (p. ej. el skeleton no debe ser región viva).

## 5. MCP Context7

Declarado en `.mcp.json` y añadido al `tools:` de Develop y Testing. Antes de usar la API de una librería
(Next.js 16, Supabase SSR, Zod 4, Playwright) se consulta su documentación actual (D-27). Como Next.js 16 cambia
mucho (p. ej. `middleware` → `proxy.ts`), además se lee la documentación incluida en `node_modules/next/dist/docs/`.

## 6. Qué decidió el humano

El tema, el uso de Supabase y Vercel, desactivar «Confirm email» en Supabase, el usuario de prueba, acelerar las
revisiones al final y unir las dos últimas tareas. Las decisiones de producto quedan en el humano; las técnicas,
en la spec y en las directrices.

## 7. Resultado

- 8 tareas principales + 2 de ajuste, todas cerradas con PASS de Testing.
- 116 tests de Vitest y 117 tests end-to-end de Playwright (escritorio, sin JavaScript y 375 px).
- RLS comprobado con `npm run db:check-rls`.
- Desplegado en Vercel: https://recetario-black.vercel.app
