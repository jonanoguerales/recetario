import type { ReactNode } from "react";
import styles from "./page.layout.module.css";

interface Props {
  /** The page's only h1. */
  title: string;
  children: ReactNode;
}

/** Frame of a content page: its h1 followed by the content, with consistent spacing. */
export function PageLayout({ title, children }: Props) {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      {children}
    </div>
  );
}
