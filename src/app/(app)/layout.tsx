import { requireUser } from "@/core/auth";
import { AppLayout } from "@/layouts";
import { SessionNavContainer } from "@/pods/auth";

/**
 * Private area (SSR per request): no user → /login (AC-1, D-13). Pages and actions check the user
 * again, since a layout is not re-rendered on client navigations.
 */
export default async function PrivateLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  return <AppLayout nav={<SessionNavContainer />}>{children}</AppLayout>;
}
