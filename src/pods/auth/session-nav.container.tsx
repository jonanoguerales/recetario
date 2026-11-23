import { getCurrentUser } from "@/core/auth";
import { logoutAction } from "./auth.actions";
import { mapSessionUserToNavVm } from "./auth.mappers";
import { SessionNavComponent } from "./components/session-nav.component";

/**
 * Header navigation that depends on the session. It is rendered without <Suspense> so it arrives
 * complete in the server HTML: it works without JavaScript (logout form included) and the header
 * never swaps a placeholder for the real links. getCurrentUser() is memoised per request.
 */
export async function SessionNavContainer() {
  const user = await getCurrentUser();
  return <SessionNavComponent session={mapSessionUserToNavVm(user)} logoutAction={logoutAction} />;
}
