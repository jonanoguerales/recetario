import Link from "next/link";
import type { RecipePaginationVm } from "../recipe-list.vm";
import styles from "./recipe-list-pagination.module.css";

/** Previous / next page links (plain links with the filters in the URL: they work without JavaScript). */
export function RecipeListPagination({ pagination }: { pagination: RecipePaginationVm }) {
  return (
    <nav aria-label="Páginas de recetas" className={styles.pagination}>
      {pagination.previousHref ? (
        <Link href={pagination.previousHref} className={styles.link} rel="prev">
          <span aria-hidden="true">←</span> Página anterior
        </Link>
      ) : (
        <span />
      )}
      <p className={styles.current}>{pagination.label}</p>
      {pagination.nextHref ? (
        <Link href={pagination.nextHref} className={styles.link} rel="next">
          Página siguiente <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
