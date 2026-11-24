# Recetario

App web para **guardar, buscar y organizar tus recetas**. Cada persona inicia sesión y solo ve y edita las suyas.
Construida por un **equipo de 3 agentes de Claude Code** (Orquestador, Develop y Testing) para la prueba técnica de
Speed Paradigm.

- **App en producción:** https://recetario-black.vercel.app
- **Repositorio:** https://github.com/jonanoguerales/recetario

## Acceso de prueba

| Usuario | Contraseña |
|---|---|
| `admin@recetario.app` | `Admin` |

La cuenta trae **8 recetas de ejemplo**. También puedes crear tu propia cuenta en «Crear cuenta» (entra al momento,
sin confirmar el email). Si alguien borra o cambia las recetas de ejemplo, se restauran con `npm run db:seed-demo`.

## Cómo se ha usado Claude Code

👉 **[`docs/CLAUDE_CODE.md`](docs/CLAUDE_CODE.md)**: cómo se montó y se usó el equipo de agentes (Orquestador, Develop y
Testing), el flujo de cada tarea, ejemplos reales de fallos que encontró Testing, las skills, el MCP Context7 y
Modern Web Guidance, y qué decidió el humano.

👉 **[`docs/AGENT_LOG.md`](docs/AGENT_LOG.md)**: el registro tarea a tarea, con cada vuelta Develop ⇄ Testing y su commit.

## El equipo de agentes

| Agente | Fichero | Qué hace |
|---|---|---|
| **Orquestador** | [`CLAUDE.md`](CLAUDE.md) | Agente principal. Escribe la spec, divide el trabajo en tareas, se las encarga a Develop, manda revisar a Testing y cierra cada tarea (registro, commit y push). No programa. |
| **Develop** | [`.claude/agents/develop.md`](.claude/agents/develop.md) | Subagente que programa siguiendo sus normas: arquitectura por pods, Supabase con RLS, Server Actions + Zod, Modern Web Guidance, tests Vitest y Playwright. |
| **Testing** | [`.claude/agents/testing.md`](.claude/agents/testing.md) | Subagente revisor con las **DIRECTRICES** (D-01…D-34). Ejecuta lint, tipos, tests, build y e2e, revisa el diff y devuelve `PASS` o `FAIL` con cada fallo. Solo lectura. |

Flujo de cada tarea: **spec → Develop → Testing → (si FAIL, los fallos vuelven literales a Develop, máx. 3 vueltas)
→ registro en `AGENT_LOG.md` → commit `Develop ⇄ Testing: N vuelta(s)` → push**.

## Funcionalidades

- Registro, inicio y cierre de sesión (Supabase Auth).
- Crear, ver, editar y borrar recetas (con confirmación), con validación por campo en servidor y en la base de datos.
- Listado con búsqueda por título o ingrediente (sin distinguir mayúsculas ni tildes) y filtros por categoría y
  favoritas, todo en la URL.
- Favoritas con respuesta instantánea.
- Privacidad garantizada por **RLS** en Postgres: nadie lee ni toca recetas ajenas, ni llamando a la API directamente.
- Funciona **sin JavaScript**, a **375 px** y con teclado; modo claro y oscuro.

## Stack

Next.js 16 (App Router, React 19) · TypeScript · Supabase (Postgres + Auth + RLS, `@supabase/ssr`) · Zod ·
CSS Modules · Vitest · Playwright · Vercel (plan gratuito) · Supabase (plan gratuito).

**Renderizado por sección** (skill [`nextjs-rendering-strategy`](.claude/skills/nextjs-rendering-strategy/SKILL.md)):
portada, login, registro y 404 **estáticas**; la zona privada **SSR dinámico** con el contenido completo en el HTML;
JavaScript de cliente solo en islas (estado pendiente, confirmar borrado, favorita).

## Estructura del proyecto

Arquitectura **por pods** (skill [`pods-architecture`](.claude/skills/pods-architecture/SKILL.md)): las rutas solo
componen y cada funcionalidad vive en su carpeta, con una única puerta de entrada (`index.ts`).

```
recetario/
├── CLAUDE.md                     Orquestador: flujo obligatorio y reglas del equipo
├── AGENTS.md                     Aviso de Next.js 16 (leer la doc incluida en node_modules)
├── .claude/
│   ├── agents/
│   │   ├── develop.md            Develop: cómo se programa en este proyecto
│   │   └── testing.md            Testing: DIRECTRICES D-01…D-34 y formato del veredicto
│   └── skills/                   Skills propias y oficiales (Google Chrome, Next.js)
├── .mcp.json                     MCP Context7 (documentación actual de librerías)
├── skills-lock.json              Versiones fijadas de las skills externas
├── specs/
│   └── 001-recetario.md          Spec (SDD): requisitos R1–R8 y criterios AC-1…AC-14
├── docs/
│   ├── CLAUDE_CODE.md            Cómo se ha usado Claude Code
│   └── AGENT_LOG.md              Registro de cada tarea y sus vueltas
├── src/
│   ├── app/                      Rutas finas (App Router), en grupos que no cambian la URL
│   │   ├── (public)/             Portada estática  →  /
│   │   ├── (auth)/               Login y registro estáticos  →  /login, /registro
│   │   ├── (app)/                Zona privada SSR (layout con requireUser)  →  /recetas/…
│   │   ├── layout.tsx            Layout raíz (no lee la sesión)
│   │   └── not-found.tsx         Página 404
│   ├── pods/                     Una carpeta por funcionalidad
│   │   ├── auth/                 Login, registro, logout y navegación de sesión
│   │   ├── home/                 Portada
│   │   ├── recipe-form/          Crear y editar recetas
│   │   ├── recipe-list/          Listado, búsqueda y filtros
│   │   └── recipe-detail/        Detalle, favorita y borrar
│   │       ├── api/              Acceso a datos (Supabase)
│   │       ├── components/       Componentes de presentación
│   │       ├── *.container.tsx   Lee datos y compone
│   │       ├── *.component.tsx   Pinta el ViewModel
│   │       ├── *.actions.ts      Server Actions (validan con Zod)
│   │       ├── *.mappers.ts      Fila de BD → ViewModel (*.vm.ts)
│   │       └── index.ts          Barrel: lo único que se importa desde fuera
│   ├── core/                     supabase (clientes y proxy), auth (sesión), recipes (dominio), flash
│   ├── common/                   Componentes compartidos (skeleton)
│   ├── layouts/                  Layouts de la app
│   └── proxy.ts                  Proxy de Next 16: sesión, redirecciones y 404 sin JavaScript
├── supabase/migrations/          SQL versionado: tabla recipes, RLS, índices y permisos
├── scripts/                      db:migrate, db:check-rls y db:seed-demo
├── e2e/                          Tests Playwright (escritorio, sin JavaScript y 375 px)
└── .env.example                  Variables necesarias, sin valores
```

## Puesta en marcha

```bash
cp .env.example .env.local   # rellena las claves de tu proyecto Supabase
npm install
npm run db:migrate           # aplica supabase/migrations en DATABASE_URL
npm run db:seed-demo         # crea el usuario de prueba (contraseña en DEMO_PASSWORD)
npm run dev
```

Comprobaciones: `npm run lint` · `npm run typecheck` · `npm test` · `npm run build` · `npm run test:e2e` ·
`npm run db:check-rls`.

## Tests

```bash
npm test            # Vitest: lógica pura (validaciones Zod, mappers, utilidades) en src/ y scripts/
npm run test:e2e    # Playwright: flujos completos en el navegador (carpeta e2e/)
```

- La primera vez instala el navegador: `npx playwright install chromium`.
- `npm run test:e2e` hace `next build` y arranca `next start` en el puerto 3310 (si ya hay un servidor ahí y no
  es CI, lo reutiliza). Necesita `.env.local` con las claves de Supabase y `DATABASE_URL`.
- Proyectos: `desktop` (Chromium con JavaScript), `no-js` (sin JavaScript, para los formularios) y `mobile-375`
  (375 × 812, para el diseño). Cada test nombra el criterio `AC-n` que cubre.
- Usuarios de prueba: `e2e/global-setup.ts` los crea por SQL (`e2e-<id>-*@example.net`) y
  `e2e/global-teardown.ts` los borra al terminar, también si fallan tests.

## Seguridad

- Ninguna clave en el repositorio: `.env.local` está en `.gitignore` y `.env.example` va sin valores.
- La app solo usa la clave publicable de Supabase; la seguridad la pone RLS, no el cliente.
