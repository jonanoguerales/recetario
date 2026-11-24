import { AppLayout } from "@/layouts";
import { PublicNavComponent } from "@/pods/auth";

/** Public pages: static header with fixed links (no session read). */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return <AppLayout nav={<PublicNavComponent />}>{children}</AppLayout>;
}
