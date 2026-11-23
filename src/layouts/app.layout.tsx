import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./app.layout.module.css";

interface Props {
  children: ReactNode;
  /** Header navigation slot (session links from the auth pod). */
  nav?: ReactNode;
}

export function AppLayout({ children, nav }: Props) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            Recetario
          </Link>
          {nav ? (
            <nav aria-label="Principal" className={styles.nav}>
              {nav}
            </nav>
          ) : null}
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
