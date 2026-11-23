import { Suspense } from "react";
import { getCurrentUser } from "@/core/auth";
import { logoutAction } from "./auth.actions";
import { mapSessionUserToNavVm } from "./auth.mappers";
import { SessionNavComponent, SessionNavSkeleton } from "./components/session-nav.component";

async function SessionNavContent() {
  const user = await getCurrentUser();
  return <SessionNavComponent session={mapSessionUserToNavVm(user)} logoutAction={logoutAction} />;
}

/**
 * Header navigation that depends on the session. The session is read at request time, so it
 * streams in behind <Suspense> with a skeleton of the same size (D-22).
 */
export function SessionNavContainer() {
  return (
    <Suspense fallback={<SessionNavSkeleton />}>
      <SessionNavContent />
    </Suspense>
  );
}
