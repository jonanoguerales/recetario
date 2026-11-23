import type { ReactNode } from "react";
import styles from "./page.layout.module.css";

/** id of the page h1, so a form can take it as its accessible name (aria-labelledby). */
export const PAGE_TITLE_ID = "page-title";

interface Props {
  /** The page's only h1. */
  title: string;
  /** Main actions of the page (e.g. «Nueva receta»), shown next to the title. */
  actions?: ReactNode;
  children: ReactNode;
}

/** Frame of a content page: its h1 (and its actions) followed by the content, with consistent spacing. */
export function PageLayout({ title, actions, children }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 id={PAGE_TITLE_ID} className={styles.title}>{title}</h1>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
