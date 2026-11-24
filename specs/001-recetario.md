# 001 — Recetario
Estado: Aprobada

## Contexto
App web para guardar, buscar y organizar recetas propias. Cada persona inicia sesión y solo ve y edita
sus recetas. Tema libre de la prueba técnica: lo importante es una app completa, segura y bien construida
por el equipo de agentes (Orquestador, Develop y Testing).

## Requisitos
- **R1 Autenticación** con email y contraseña (Supabase Auth): registro, inicio y cierre de sesión.
- **R2 Recetas** con: título (3–120 caracteres), descripción opcional (≤ 500), categoría
  (`desayuno`, `entrante`, `principal`, `postre`, `bebida`, `otro`), tiempo en minutos (1–1440),
  raciones (1–50), ingredientes (lista de 1–50 elementos de ≤ 120 caracteres), pasos (lista de 1–30
  elementos de ≤ 600 caracteres) y favorita (sí/no).
- **R3 Crear, ver, editar y borrar** recetas propias. Borrar pide confirmación.
- **R4 Listado** de mis recetas, de la más reciente a la más antigua, con **búsqueda** por título o
  ingrediente y **filtros** por categoría y por favoritas. Los filtros se reflejan en la URL (se pueden compartir
  y funcionan con «atrás»).
- **R5 Marcar y desmarcar favorita** desde el detalle.
- **R6 Privacidad**: nadie puede leer ni modificar recetas de otra persona, ni siquiera llamando a la API de
  Supabase directamente (RLS).
- **R7 Usuario de prueba** con recetas de ejemplo para que el evaluador vea la app con datos.
- **R8 Portada pública** que explica la app e invita a entrar o registrarse.

## Criterios de aceptación
- **AC-1** Sin sesión, ir a `/recetas` (o cualquier ruta privada) redirige a `/login`.
- **AC-2** Con credenciales correctas se entra y se llega a `/recetas`; con incorrectas se ve un error claro
  sin revelar si el email existe.
- **AC-3** El registro valida email y contraseña (mínimo 8 caracteres) y muestra los errores junto al campo.
- **AC-4** Cerrar sesión lleva a la portada y las rutas privadas vuelven a pedir login.
- **AC-5** Crear una receta válida la guarda y lleva a su detalle; una inválida muestra los errores por campo
  y conserva lo escrito.
- **AC-6** Las reglas de R2 se validan en el servidor (Zod) y en la base de datos (`check`).
- **AC-7** Editar una receta guarda los cambios; borrarla pide confirmación y vuelve al listado.
- **AC-8** El listado muestra solo mis recetas, ordenadas por fecha, con un estado vacío que invita a crear la primera.
- **AC-9** La búsqueda encuentra por título y por ingrediente (sin distinguir mayúsculas ni tildes) y se combina
  con los filtros de categoría y favoritas; todo queda en la URL.
- **AC-10** Un usuario no puede ver ni editar la receta de otro (404) aunque conozca su id, y RLS lo impide
  también desde la API de Supabase.
- **AC-11** Marcar favorita se refleja en el detalle y en el filtro de favoritas.
- **AC-12** Ninguna pantalla salta al cargar (el contenido llega completo en el HTML; cuando con JavaScript una
  parte se recarga, se muestra un skeleton de la misma forma) y todo se usa bien en móvil (375 px) y con teclado.
- **AC-14** La página «no encontrada» (URL inexistente o receta ajena/inexistente) responde 404 **y se ve
  completa también sin JavaScript** (título, explicación y enlace a «Mis recetas»). Nota: en Next 16.4 `notFound()`
  durante el render devuelve el cuerpo vacío sin JS; Testing comprobó que reescribir a una ruta inexistente desde
  `proxy.ts` con estado 404 sí da la página completa (la página sigue comprobando en servidor, D-13).
- **AC-13** Cada sección usa el renderizado que mejor le conviene (skill `nextjs-rendering-strategy`): la portada
  y la página 404 son **estáticas**; la zona privada es **SSR dinámico** con streaming; el JavaScript de cliente
  se limita a islas justificadas (estado pendiente, confirmar borrado, favorita optimista).

## Contratos
- Tabla `public.recipes` (ver migraciones en `supabase/migrations/`), RLS por `user_id = auth.uid()`.
- Rutas: `/` (pública) · `/login` · `/registro` · `/recetas` · `/recetas/nueva` · `/recetas/[id]` · `/recetas/[id]/editar`.

## Fuera de alcance
Imágenes de recetas, compartir recetas entre usuarios, recuperación de contraseña por email.
