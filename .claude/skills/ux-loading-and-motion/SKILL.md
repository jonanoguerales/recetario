---
name: ux-loading-and-motion
description: Reglas de estados de carga (skeletons, Suspense), estabilidad visual (sin saltos / CLS), avisos y animaciones o view transitions. Úsala antes de crear o tocar cualquier pantalla, estado de carga, aviso de error o animación en src/.
---

# Carga sin saltos y movimiento con sentido

Objetivo: que la página **no salte** mientras llegan los datos (CLS ≈ 0) y que el movimiento
ayude a seguir lo que pasa, nunca al revés. Para APIs concretas, consulta además la skill
`modern-web-guidance` (guías `motion`, `group-element-transitions`, `same-document-transitions`, `spinner`).

## 1. Skeletons, no textos de «Cargando…»
- Cada pod que carga datos exporta un **skeleton con la misma estructura y medidas** que su
  contenido real (mismas clases de layout, mismos `min-block-size`). Si el contenido cambia de
  altura al llegar, el skeleton está mal.
- El skeleton del pod se usa **dos veces**: como `fallback` del `<Suspense>` de la página (servidor)
  y como estado inicial del container (cliente). Así no hay un segundo cambio de forma.
- Accesibilidad: el contenedor del skeleton lleva `role="status"` y un texto `.visually-hidden`
  («Cargando…»); los bloques grises van con `aria-hidden="true"`. Nada de `aria-busy` en `div` genéricos.
- Brillo del skeleton solo con `@media (prefers-reduced-motion: no-preference)`; si no, bloque estático.
- Spinner solo para esperas cortas sin forma conocida (un botón enviando). Para una región con
  forma conocida, siempre skeleton.

## 2. Reservar espacio
- Lo que aparece más tarde (resumen, barra de progreso, contadores) **ocupa su hueco desde el
  principio** con un marcador del mismo tamaño, no se inserta empujando lo de debajo.
- Avisos y errores que llegan en cualquier momento: **toast fijo** (`position: fixed`), no un bloque
  en el flujo que desplaza la página. Con `role="alert"` o `role="status"` según la urgencia.
- Medios e iframes con tamaño fijo (`block-size` / `aspect-ratio`).
- Listas en contenedores con scroll propio (`overflow: auto`, `overscroll-behavior: contain`) para que
  los elementos nuevos no muevan el resto de la página.

## 3. Transiciones
- **View Transitions** para cambios de estado que el usuario sigue con la vista (una tarea que pasa
  de una columna a otra): `view-transition-name` único por elemento + `view-transition-class` común,
  y `document.startViewTransition()` con `flushSync` de React dentro del callback.
- Solo cuando cambia algo que merezca la pena (p. ej. el estado de una tarea), **no en cada polling**.
- Desactivar la transición `root` (`:root { view-transition-name: none }`) y `::view-transition { pointer-events: none }`
  para no congelar la página entera.
- Sin soporte (o pestaña oculta) → actualizar sin animación (mejora progresiva).

## 4. Movimiento accesible
- Animar `opacity` y `transform` / `translate`; no `top`, `left`, `width`…
- **Prohibido** el reset global `* { animation-duration: 0.01ms }`: ajustar cada animación junto a su regla.
  - Sin animación en reducido → declararla dentro de `@media (prefers-reduced-motion: no-preference)`.
  - Más suave en reducido → `@media (prefers-reduced-motion: reduce)` solo con los parámetros que cambian.
- Las animaciones de pulso o brillo infinitas son decorativas: solo con `no-preference`.

## Checklist antes de terminar
- [ ] En el navegador, con red lenta, la página no salta al cargar (mide CLS con `PerformanceObserver`, objetivo < 0.05).
- [ ] El skeleton y el contenido real tienen la misma altura.
- [ ] Con `prefers-reduced-motion: reduce` no hay movimiento espacial y nada queda oculto.
