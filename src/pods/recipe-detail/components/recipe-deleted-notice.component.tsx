import type { RecipeDeletedNoticeVm } from "../recipe-detail.vm";
import styles from "./recipe-deleted-notice.module.css";

/**
 * «Se ha borrado la receta «…».» on /recetas (AC-7). Not a live region: it arrives with the new page
 * (the list already has the page's single role="status"), and the change of page is announced
 * through the document title, which starts with «Receta borrada».
 */
export function RecipeDeletedNotice({ notice }: { notice: RecipeDeletedNoticeVm }) {
  return (
    <p className={styles.notice}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.icon}>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{notice.message}</span>
    </p>
  );
}
