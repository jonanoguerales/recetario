import Link from "next/link";
import { PageLayout } from "@/layouts";
import actionStyles from "./components/actions.module.css";
import { DeleteRecipeForm } from "./components/delete-recipe-form.component";
import styles from "./recipe-detail.module.css";
import type { RecipeDeleteVm } from "./recipe-detail.vm";

/** /recetas/[id]/borrar: the confirmation of «Borrar» as a page (AC-7, without JavaScript). */
export function RecipeDeleteComponent({ confirmation }: { confirmation: RecipeDeleteVm }) {
  return (
    <PageLayout title={confirmation.question}>
      <div className={styles.content}>
        <p className={styles.description}>{confirmation.explanation}</p>
        <div className={actionStyles.row}>
          <DeleteRecipeForm recipeId={confirmation.id} />
          <Link href={confirmation.cancelHref} className={actionStyles.action}>
            Cancelar
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
