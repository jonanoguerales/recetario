-- 0002_harden_grants.sql — Endurecimiento de permisos pedido por Testing en T-02 (principio de mínimo privilegio).
-- Spec: specs/001-recetario.md (R6, AC-10).

-- `authenticated` solo necesita select/insert/update/delete (con RLS). Supabase concede por defecto también
-- truncate, references y trigger, que no aplican RLS (truncate vaciaría la tabla de todos): se retiran.
revoke truncate, references, trigger on table public.recipes from authenticated;

-- Funciones auxiliares de 0001: Postgres concede EXECUTE a PUBLIC por defecto y Supabase además a anon.
-- anon no tiene acceso a recipes, así que no las necesita. authenticated SÍ las necesita (las usan los
-- check, la columna generada search_text y el trigger de updated_at al escribir), así que se le conceden
-- de forma explícita antes de retirar el permiso a PUBLIC.
grant execute on function public.text_array_items_valid(text[], integer) to authenticated;
grant execute on function public.normalize_search_text(text) to authenticated;
grant execute on function public.recipe_search_text(text, text[]) to authenticated;
grant execute on function public.set_updated_at() to authenticated;

revoke execute on function public.text_array_items_valid(text[], integer) from public, anon;
revoke execute on function public.normalize_search_text(text) from public, anon;
revoke execute on function public.recipe_search_text(text, text[]) from public, anon;
revoke execute on function public.set_updated_at() from public, anon;
