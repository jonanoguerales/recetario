import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isGuestOnlyPath, isPrivatePath, ROUTES } from "@/core/auth/routes";
import { getSupabaseEnvOrNull } from "@/core/env";

/**
 * Refreshes the Supabase session cookies for the incoming request and applies the optimistic
 * route redirects (private route without session → /login; /login or /registro with session →
 * /recetas). This is only a fast path that answers with a real 307: pages and Server Actions
 * still check the user on the server with `requireUser()` (D-13).
 * If Supabase is not configured yet, the request passes through untouched.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const env = getSupabaseEnvOrNull();
  if (!env) return response;

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
  if (!isNavigation) return response;

  const { pathname } = request.nextUrl;
  if (!hasSession && isPrivatePath(pathname)) return redirectTo(request, response, ROUTES.login);
  if (hasSession && isGuestOnlyPath(pathname)) return redirectTo(request, response, ROUTES.recipes);

  return response;
}

/** Redirect that keeps any refreshed session cookies set on `response`. */
function redirectTo(request: NextRequest, response: NextResponse, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
