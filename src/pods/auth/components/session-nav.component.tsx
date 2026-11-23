import Link from "next/link";
import { ROUTES } from "@/core/auth";
import type { SessionNavVm } from "../auth.vm";
import styles from "./session-nav.module.css";

interface Props {
  session: SessionNavVm;
  logoutAction: () => Promise<void>;
}

/** Header links: «Entrar» / «Crear cuenta» without a session; «Mis recetas», email and «Cerrar sesión» with one. */
export function SessionNavComponent({ session, logoutAction }: Props) {
  if (session.status === "guest") {
    return (
      <ul className={styles.list}>
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

  return (
    <ul className={styles.list}>
      <li>
        <Link href={ROUTES.recipes} className={styles.link}>
          Mis recetas
        </Link>
      </li>
      <li className={styles.email} title={session.email}>
        <span className="visually-hidden">Sesión iniciada como </span>
        {session.email}
      </li>
      <li>
        <form action={logoutAction}>
          <button type="submit" className={styles.secondary}>
            Cerrar sesión
          </button>
        </form>
      </li>
    </ul>
  );
}

