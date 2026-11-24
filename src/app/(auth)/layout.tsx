import { AppLayout } from "@/layouts";
import { PublicNavComponent } from "@/pods/auth";

/** /login and /registro: static header; the redirect with a session is done by proxy.ts. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <AppLayout nav={<PublicNavComponent />}>{children}</AppLayout>;
}
