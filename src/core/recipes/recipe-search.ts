/**
 * Normalizes a search term the same way as `public.normalize_search_text` in the database
 * (lowercase, no accents) and escapes the ILIKE wildcards, so it can be used as
 * `.ilike("search_text", `%${normalizeSearchTerm(q)}%`)`.
 *
 * `*` cannot be escaped: PostgREST turns every `*` of a like/ilike value into `%` before the query
 * (it is its URL-friendly alias of `%`), even after a backslash. Left as is, «a*b» would match «a» and
 * «b» with anything in between. It becomes `_` (exactly one character) instead: the text with the
 * literal `*` is still found, and at most texts differing in that single position are also found.
 * Removing it would not work: «a*b» would look for «ab» and miss the recipe that contains «a*b».
 */
export function normalizeSearchTerm(term: string): string {
  return term
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\\%_]/g, (char) => `\\${char}`)
    .replaceAll("*", "_");
}
