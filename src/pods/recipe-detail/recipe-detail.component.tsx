import Link from "next/link";
import { PageLayout } from "@/layouts";
import styles from "./recipe-detail.module.css";
import type { RecipeDetailVm } from "./recipe-detail.vm";

/** Provisional detail: the recipe title as the page h1 and a link to edit it (T-06 completes it). */
export function RecipeDetailComponent({ recipe }: { recipe: RecipeDetailVm }) {
  return (
    <PageLayout
      title={recipe.title}
      actions={
        <Link href={recipe.editHref} className={styles.edit}>
          Editar
        </Link>
      }
    >
      <p className={styles.note}>Pronto verás aquí los ingredientes y los pasos de la receta.</p>
    </PageLayout>
  );
}
