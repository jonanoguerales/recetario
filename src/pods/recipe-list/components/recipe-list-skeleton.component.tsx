import { SkeletonBlock } from "@/common/components/skeleton";
import listStyles from "../recipe-list.module.css";
import cardStyles from "./recipe-card.module.css";
import styles from "./recipe-list-skeleton.module.css";

/** Title widths that vary from card to card, so the placeholder reads like a list of titles. */
const TITLE_WIDTHS = ["70%", "55%", "80%", "62%"];

/**
 * Placeholder of the card list while, with JavaScript, a new list arrives after changing a filter.
 * It uses the same grid and card classes as the real list (same columns, paddings and line heights),
 * with as many cards as the list it replaces, so nothing jumps.
 * It is not a live region: the whole placeholder is `aria-hidden` (an interstitial «Cargando…» only adds
 * noise); what is announced is the result, in the single `role="status"` of the page (the summary).
 */
export function RecipeListSkeleton({ count }: { count: number }) {
  return (
    <div aria-hidden="true" data-testid="recipe-list-skeleton" className={listStyles.list}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={cardStyles.card}>
          <div className={cardStyles.header}>
            <div className={cardStyles.title}>
              <span className={cardStyles.link}>
                <SkeletonBlock
                  className={styles.line}
                  style={{ inlineSize: TITLE_WIDTHS[index % TITLE_WIDTHS.length] }}
                />
              </span>
            </div>
          </div>
          <div className={cardStyles.meta}>
            <SkeletonBlock className={`${styles.line} ${styles.meta}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
