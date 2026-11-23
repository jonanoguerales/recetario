import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./auth-panel.module.css";

interface Props {
  title: string;
  intro: string;
  switchText: string;
  switchLinkText: string;
  switchHref: string;
  children: ReactNode;
}

/** Card that frames the sign-in and sign-up pages: heading, form and link to the other page. */
export function AuthPanelComponent({
  title,
  intro,
  switchText,
  switchLinkText,
  switchHref,
  children,
}: Props) {
  return (
    <section className={styles.panel} aria-labelledby="auth-title">
      <header className={styles.header}>
        <h1 id="auth-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.intro}>{intro}</p>
      </header>
      {children}
      <p className={styles.switch}>
        {switchText}{" "}
        <Link href={switchHref} className={styles.switchLink}>
          {switchLinkText}
        </Link>
      </p>
    </section>
  );
}
