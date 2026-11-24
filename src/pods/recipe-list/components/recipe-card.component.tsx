import Link from "next/link";
import type { RecipeCardVm } from "../recipe-list.vm";
import styles from "./recipe-card.module.css";

/** Decorative star: the visible text «Favorita» next to it carries the meaning (not only colour or icon). */
function StarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.star}>
      <path
        fill="currentColor"
        d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z"
      />
    </svg>
  );
}

/**
 * Recipe card: an <article> whose heading links to the detail; the link's hit area is stretched over
 * the whole card (`::after`), so the card is clickable without wrapping all its text in the link.
 */
export function RecipeCardComponent({ card }: { card: RecipeCardVm }) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          <Link href={card.href} className={styles.link}>
            {card.title}
          </Link>
        </h2>
        {card.isFavorite ? (
          <p className={styles.favorite}>
            <StarIcon />
            Favorita
          </p>
        ) : null}
      </header>
      <dl className={styles.meta}>
        <div className={styles.metaItem}>
          <dt className="visually-hidden">Categoría</dt>
          <dd className={styles.category}>{card.categoryLabel}</dd>
        </div>
        <div className={styles.metaItem}>
          <dt className="visually-hidden">Tiempo</dt>
          <dd>{card.prepTimeLabel}</dd>
        </div>
        <div className={styles.metaItem}>
          <dt className="visually-hidden">Raciones</dt>
          <dd>{card.servingsLabel}</dd>
        </div>
      </dl>
    </article>
  );
}
