/**
 * Normalizes a search term the same way as `public.normalize_search_text` in the database
 * (lowercase, no accents) and escapes the ILIKE wildcards, so it can be used as
 * `.ilike("search_text", `%${normalizeSearchTerm(q)}%`)`.
 */
export function normalizeSearchTerm(term: string): string {
  return term
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\\%_]/g, (char) => `\\${char}`);
}
