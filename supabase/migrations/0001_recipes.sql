-- 0001_recipes.sql — Tabla de recetas con RLS, restricciones de R2 (AC-6), búsqueda (AC-9) e índices.
-- Spec: specs/001-recetario.md (R2, R4, R6, AC-6, AC-9, AC-10).

-- ---------------------------------------------------------------------------
-- Extensiones (en el esquema `extensions`, como recomienda Supabase)
-- ---------------------------------------------------------------------------
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Funciones auxiliares inmutables
-- ---------------------------------------------------------------------------

-- Valida cada elemento de un text[]: sin nulos, sin elementos en blanco y de 1..max_length caracteres.
-- Un `check` no admite subconsultas, así que la comprobación por elemento vive en una función inmutable.
create or replace function public.text_array_items_valid(items text[], max_length integer)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(
    bool_and(
      item is not null
      and char_length(btrim(item)) >= 1
      and char_length(item) <= max_length
    ),
    false
  )
  from unnest(items) as item;
$$;

-- Normaliza texto para buscar: minúsculas y sin tildes ("Café" -> "cafe").
-- `unaccent(text)` es solo STABLE (depende de search_path para encontrar el diccionario), por eso no se puede
-- usar en una columna generada ni en un índice. La variante con el diccionario cualificado por esquema es
-- determinista, y esta envoltura se declara IMMUTABLE con search_path vacío.
create or replace function public.normalize_search_text(value text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, value));
$$;

-- Texto de búsqueda de una receta: título + ingredientes, normalizado.
create or replace function public.recipe_search_text(title text, ingredients text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select public.normalize_search_text(
    coalesce(title, '') || ' ' || coalesce(array_to_string(ingredients, ' '), '')
  );
$$;

-- Mantiene updated_at al día en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tabla
-- ---------------------------------------------------------------------------
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  prep_minutes integer not null,
  servings integer not null,
  ingredients text[] not null,
  steps text[] not null,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- BÚSQUEDA (AC-9). Enfoque elegido: columna generada normalizada + índice GIN pg_trgm, filtrada con ILIKE.
  -- · Se busca por subcadena ("pollo" en "pollo al curry", "har" mientras se escribe) sobre título e
  --   ingredientes. Un tsvector('spanish') trabaja por lexemas completos (no encuentra subcadenas, y el
  --   stemming da sorpresas con nombres de ingredientes), así que encaja peor con un buscador de recetas.
  -- · pg_trgm acelera `ILIKE '%término%'` con un índice GIN, y la columna ya va sin tildes y en minúsculas,
  --   así que mayúsculas y tildes no importan.
  -- · Desde supabase-js (T-05): `.ilike('search_text', '%' + normalizeSearchTerm(q) + '%')`, normalizando el
  --   término igual que aquí (minúsculas + sin tildes) y escapando % y _ (ver src/core/recipes/recipe-search.ts).
  search_text text generated always as (public.recipe_search_text(title, ingredients)) stored,

  -- Reglas de R2 (AC-6)
  constraint recipes_title_length check (char_length(title) between 3 and 120 and char_length(btrim(title)) >= 3),
  constraint recipes_description_length check (description is null or char_length(description) <= 500),
  constraint recipes_category_valid check (
    category in ('desayuno', 'entrante', 'principal', 'postre', 'bebida', 'otro')
  ),
  constraint recipes_prep_minutes_range check (prep_minutes between 1 and 1440),
  constraint recipes_servings_range check (servings between 1 and 50),
  constraint recipes_ingredients_count check (cardinality(ingredients) between 1 and 50),
  constraint recipes_ingredients_items check (public.text_array_items_valid(ingredients, 120)),
  constraint recipes_steps_count check (cardinality(steps) between 1 and 30),
  constraint recipes_steps_items check (public.text_array_items_valid(steps, 600))
);

comment on table public.recipes is 'Recetas de cada usuario. RLS: cada usuario solo accede a las suyas.';
comment on column public.recipes.search_text is
  'Título + ingredientes en minúsculas y sin tildes; filtrar con ILIKE (índice pg_trgm).';

create trigger recipes_set_updated_at
before update on public.recipes
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Índices (diseñados desde las consultas de R4; todas filtran por user_id por RLS)
-- ---------------------------------------------------------------------------

-- Listado "mis recetas, de la más reciente a la más antigua": where user_id = ? order by created_at desc.
-- También sirve de índice por user_id para las políticas RLS y la FK (on delete cascade).
create index recipes_user_created_idx on public.recipes (user_id, created_at desc);

-- Filtro por categoría: where user_id = ? and category = ? order by created_at desc.
create index recipes_user_category_created_idx on public.recipes (user_id, category, created_at desc);

-- Filtro de favoritas: where user_id = ? and is_favorite order by created_at desc.
-- Índice parcial: solo contiene las favoritas, pequeño y exacto para esa consulta.
create index recipes_user_favorites_created_idx on public.recipes (user_id, created_at desc)
  where is_favorite;

-- Búsqueda: search_text ilike '%término%' (trigramas; útil a partir de 3 caracteres).
create index recipes_search_text_trgm_idx on public.recipes
  using gin (search_text extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Row Level Security (R6, AC-10)
-- ---------------------------------------------------------------------------
alter table public.recipes enable row level security;

-- Sin ningún acceso para anon (además de no tener políticas): defensa en profundidad.
revoke all on table public.recipes from anon;
grant select, insert, update, delete on table public.recipes to authenticated;

-- (select auth.uid()) se evalúa una vez por consulta en vez de por fila.
create policy "recipes_select_own" on public.recipes
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "recipes_insert_own" on public.recipes
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "recipes_update_own" on public.recipes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "recipes_delete_own" on public.recipes
  for delete to authenticated
  using (user_id = (select auth.uid()));
