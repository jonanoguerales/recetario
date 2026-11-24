import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};

/**
 * True once React has hydrated the page in the browser; false on the server and during hydration,
 * so the server HTML (what works without JavaScript) and the first client render are the same.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}
