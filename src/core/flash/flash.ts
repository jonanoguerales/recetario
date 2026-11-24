import { z } from "zod";
import { RECIPE_LIMITS } from "@/core/recipes/recipe.model";

/*
 * One-time notice («flash») shown on the page an action redirects to, e.g. «Se ha borrado la receta…»
 * on /recetas after deleting one (AC-7). It has to work without JavaScript and must not come back
 * when the page is reloaded, so it travels in a short-lived cookie that is read only once:
 *
 * 1. The Server Action stores it in the FLASH_COOKIE cookie (scoped to FLASH_PATH) and redirects.
 * 2. src/proxy.ts sees the cookie on the GET of FLASH_PATH, removes it from the request, passes its
 *    value to the page in the FLASH_HEADER request header and deletes the cookie in the response.
 * 3. The page reads the header. A reload no longer has the cookie, so the notice is gone.
 *
 * With JavaScript the action's redirect is rendered by Next.js in the same response (it requests the
 * destination internally with the cookies the action set, through the proxy), and the Set-Cookie of
 * that internal response is not passed on to the browser: the proxy could not delete the cookie. So
 * in that case the action sets it with Max-Age=0 (`setFlash(…, { sameResponse: true })`): the
 * page of this response still receives it, and the browser discards it at once.
 *
 * A query parameter (`/recetas?borrada=1`) would also work without JavaScript, but it stays in the
 * URL: a reload, «atrás» or a shared link would show the notice again.
 * This module is pure (no Next.js APIs), so the proxy, the server and the tests can import it.
 */

export const FLASH_COOKIE = "recetario-aviso";

/** Request header with the consumed notice (set only by the proxy; any incoming one is dropped). */
export const FLASH_HEADER = "x-recetario-aviso";

/** The page that shows the notices (and the path of the cookie). */
export const FLASH_PATH = "/recetas";

/** Safety net: a notice that is never read expires on its own. */
export const FLASH_MAX_AGE_SECONDS = 60;

/** Every notice there is. Validated with Zod on read: the cookie comes from the browser. */
export const flashSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("recipe-deleted"),
    title: z.string().trim().min(1).max(RECIPE_LIMITS.title.max),
  }),
]);

export type Flash = z.infer<typeof flashSchema>;

/**
 * Cookie/header value of a notice. Percent-encoded so it is plain ASCII: header values cannot
 * hold «ñ», tildes or «».
 */
export function serializeFlash(flash: Flash): string {
  return encodeURIComponent(JSON.stringify(flash));
}

/** The notice in a cookie/header value, or null if there is none or it is not a valid notice. */
export function parseFlash(value: string | null | undefined): Flash | null {
  if (!value) return null;
  try {
    const parsed = flashSchema.safeParse(JSON.parse(decodeURIComponent(value)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
