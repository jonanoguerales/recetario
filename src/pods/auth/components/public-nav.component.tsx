import Link from "next/link";
import { ROUTES } from "@/core/auth";
import styles from "./session-nav.module.css";

/**
 * Header links of the public pages (portada, login, registro, 404). It does not read the session, so
 * those pages stay static: without a session, «Mis recetas» leads to /login (proxy.ts), and with one,
 * «Entrar» and «Crear cuenta» lead to /recetas.
 */
export function PublicNavComponent() {
  return (
    <ul className={styles.list}>
      <li>
        <Link href={ROUTES.recipes} className={styles.link}>
          Mis recetas
        </Link>
      </li>
      <li>
        <Link href={ROUTES.login} className={styles.link}>
          Entrar
        </Link>
      </li>
      <li>
        <Link href={ROUTES.register} className={styles.primary}>
          Crear cuenta
        </Link>
      </li>
    </ul>
  );
}
