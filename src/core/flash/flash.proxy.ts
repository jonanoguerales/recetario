import type { NextRequest, NextResponse } from "next/server";
import { FLASH_COOKIE, FLASH_HEADER, FLASH_PATH } from "./flash";

/**
 * Step 2 of flash.ts, in src/proxy.ts. Always drops an incoming FLASH_HEADER (only the proxy sets
 * it). On a page request of FLASH_PATH that carries the cookie, moves its value to FLASH_HEADER and
 * removes the cookie from the request. Router prefetches are skipped: they must not use up a
 * notice nobody sees. Returns true when the cookie has to be deleted in the response.
 */
export function takeFlash(request: NextRequest): boolean {
  request.headers.delete(FLASH_HEADER);

  const isPageRequest = request.method === "GET" && !request.headers.has("next-router-prefetch");
  if (!isPageRequest || request.nextUrl.pathname !== FLASH_PATH) return false;

  const value = request.cookies.get(FLASH_COOKIE)?.value;
  if (!value) return false;

  request.cookies.delete(FLASH_COOKIE);
  request.headers.set(FLASH_HEADER, value);
  return true;
}

/** Deletes the notice cookie in the browser, so a reload does not show the notice again. */
export function clearFlashCookie(response: NextResponse): NextResponse {
  response.cookies.delete({ name: FLASH_COOKIE, path: FLASH_PATH });
  return response;
}
