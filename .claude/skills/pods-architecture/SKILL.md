---
name: pods-architecture
description: Reglas de la arquitectura por pods del proyecto (scenes, pods, core, common, layouts, barrels, container/component, viewModel/mappers). Úsala antes de crear o mover cualquier fichero en src/.
---

# Arquitectura por pods

```
src/
  app/        → "scenes": rutas de Next.js. Finas: solo componen layouts + pods.
  layouts/    → marcos de página (cabecera, centrado…).
  pods/       → una carpeta por funcionalidad, autocontenida.
  core/       → infraestructura compartida: db, llm, agents, auth.
  common/     → piezas reutilizables sin dominio: components, hooks, helpers.
```

## Anatomía de un pod (`src/pods/<nombre>/`)
| Fichero | Responsabilidad |
|---|---|
| `api/` | Llamadas HTTP y modelos de la API (`*.api-model.ts`). Único sitio que hace `fetch`. |
| `<pod>.container.tsx` | `'use client'`. Enlaza con la fuente de datos (api, hooks), maneja efectos. |
| `<pod>.component.tsx` | Presentación pura: recibe el viewModel por props y pinta. Sin `fetch`. |
| `<pod>.vm.ts` | ViewModel: tipos que necesita la UI (no los de la API). |
| `<pod>.mappers.ts` | Funciones puras API-model → VM. Fáciles de testear. |
| `<pod>.hooks.ts` | Hooks propios del pod (opcional). |
| `components/` | Subcomponentes privados del pod. |
| `index.ts` | **Barrel**: exporta solo lo público (normalmente el container). |

## Reglas
1. Fuera de un pod se importa **solo** desde su barrel: `import { RunMonitorContainer } from '@/pods/run-monitor'`.
2. Un pod no importa de otro pod. Lo compartido sube a `common/` (UI) o `core/` (dominio/infra).
3. Las páginas de `app/` no contienen lógica: obtienen parámetros y renderizan un container.
4. Los route handlers (`app/api/**/route.ts`) son finos: validan con Zod y delegan en `core/`.
5. `core/` no importa de `pods/` ni de `app/`. Código de servidor marcado con `import 'server-only'`.
6. Mapper y VM antes que el componente: la UI nunca depende del shape de la API.
7. Estilos con CSS Modules junto al componente (`*.module.css`) y tokens en `app/globals.css`.
