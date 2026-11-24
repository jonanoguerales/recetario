import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isGuestOnlyPath, isPrivatePath, ROUTES } from "@/core/auth/routes";
import { getSupabaseEnvOrNull } from "@/core/env";
import { clearFlashCookie, takeFlash } from "@/core/flash/flash.proxy";
import { isRecipeId } from "@/core/recipes/recipe.model";
import { recipeIdFromPagePath } from "@/core/recipes/recipe.routes";

/** A path no route matches: rewriting to it renders the static not-found page (AC-14). */
const NOT_FOUND_PATH = "/_no-encontrada";

/**
 * Refreshes the Supabase session cookies for the incoming request and applies the optimistic
 * route redirects (private route without session → /login; /login or /registro with session →
 * /recetas). This is only a fast path that answers with a real 307: pages and Server Actions
 * still check the user on the server with `requireUser()` (D-13).
 * Recipe pages (`/recetas/<id>`, `/editar`, `/borrar`) of a recipe the user cannot see answer here
 * with the static not-found page and a 404 (AC-14): `notFound()` during the render leaves the body
 * empty without JavaScript in Next 16.4. The pages still check on the server (D-13).
 * It also hands a one-time notice to the page that shows it (src/core/flash/flash.ts).
 * If Supabase is not configured yet, the request passes through untouched.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Before the first NextResponse.next(): the page must receive the request without the cookie
  // and with the notice header.
  const flashTaken = takeFlash(request);
  const finish = (result: NextResponse) => (flashTaken ? clearFlashCookie(result) : result);

  let response = NextResponse.next({ request });

  const env = getSupabaseEnvOrNull();
  if (!env) return finish(response);

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Do not run code between createServerClient and getClaims():
  // getClaims() validates the JWT and triggers the refresh when it has expired.
  const { data } = await supabase.auth.getClaims();
  const hasSession = Boolean(data?.claims?.sub);

  // Only page navigations (GET/HEAD) are redirected here; a Server Action POST must reach its
  // action, which checks the user itself.
  const isNavigation = request.method === "GET" || request.method === "HEAD";
  if (!isNavigation) return finish(response);

  const { pathname } = request.nextUrl;
  if (!hasSession && isPrivatePath(pathname)) return finish(redirectTo(request, response, ROUTES.login));
  if (hasSession && isGuestOnlyPath(pathname)) return finish(redirectTo(request, response, ROUTES.recipes));

  // Prefetches skip the check: the page answers them itself, and the real navigation is checked.
  const recipeId = hasSession && !request.headers.has("next-router-prefetch") ? recipeIdFromPagePath(pathname) : null;
  if (recipeId !== null && !(await canSeeRecipe(supabase, recipeId))) {
    return finish(rewriteToNotFound(request, response));
  }

  return finish(response);
}

/**
 * Whether the signed-in user can see this recipe: one query by primary key, filtered by RLS
 * (someone else's recipe returns no row). On a database error the page decides (it checks again).
 */
async function canSeeRecipe(supabase: ProxySupabaseClient, id: string): Promise<boolean> {
  if (!isRecipeId(id)) return false;
  const { data, error } = await supabase.from("recipes").select("id").eq("id", id).maybeSingle();
  return Boolean(data) || Boolean(error);
}

/** Static not-found page with a real 404 status, keeping any refreshed session cookies. */
function rewriteToNotFound(request: NextRequest, response: NextResponse): NextResponse {
  const rewrite = NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url), { status: 404 });
  response.cookies.getAll().forEach((cookie) => rewrite.cookies.set(cookie));
  return rewrite;
}

type ProxySupabaseClient = ReturnType<typeof createServerClient>;

/** Redirect that keeps any refreshed session cookies set on `response`. */
function redirectTo(request: NextRequest, response: NextResponse, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
