import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import {
  FLASH_COOKIE,
  FLASH_HEADER,
  FLASH_MAX_AGE_SECONDS,
  FLASH_PATH,
  parseFlash,
  serializeFlash,
  type Flash,
} from "./flash";

interface SetFlashOptions {
  /**
   * True when the action was called with JavaScript, so its redirect is rendered in this same
   * response: the notice is only for that render and the browser must not keep it (see flash.ts).
   */
  sameResponse: boolean;
}

/** From a Server Action that redirects to FLASH_PATH: leaves the notice for that page (see flash.ts). */
export async function setFlash(flash: Flash, { sameResponse }: SetFlashOptions): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(FLASH_COOKIE, serializeFlash(flash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: FLASH_PATH,
    maxAge: sameResponse ? 0 : FLASH_MAX_AGE_SECONDS,
  });
}

/**
 * From a Server Component of FLASH_PATH: the notice the proxy took out of the cookie for this
 * request, or null. Memoised per request (the page and its metadata both read it).
 */
export const readFlash = cache(async (): Promise<Flash | null> => {
  const headerStore = await headers();
  return parseFlash(headerStore.get(FLASH_HEADER));
});
