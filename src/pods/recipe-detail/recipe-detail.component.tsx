import Link from "next/link";
import { PageLayout } from "@/layouts";
import actionStyles from "./components/actions.module.css";
import { DeleteRecipeControl } from "./components/delete-recipe-control.container";
import { DeleteRecipeForm } from "./components/delete-recipe-form.component";
import { FavoriteToggle } from "./components/favorite-toggle.component";
import styles from "./recipe-detail.module.css";
import type { RecipeDeleteVm, RecipeDetailVm } from "./recipe-detail.vm";

interface Props {
  recipe: RecipeDetailVm;
  confirmation: RecipeDeleteVm;
}

/**
 * Detail of a recipe (R2, R3, R5). Rendered on the server and complete in the HTML; the only client
 * code is the «Favorita» button (optimistic) and the «Borrar» dialog, both working without JavaScript.
 */
export function RecipeDetailComponent({ recipe, confirmation }: Props) {
  return (
    <div className={styles.root}>
      <p>
        <Link href={recipe.listHref} className={styles.back}>
          <span aria-hidden="true">←</span>
          Volver a mis recetas
        </Link>
      </p>

      <PageLayout
        title={recipe.title}
        actions={
          <>
            <Link href={recipe.editHref} className={actionStyles.action}>
              Editar
            </Link>
            <FavoriteToggle recipeId={recipe.id} isFavorite={recipe.isFavorite} />
            <DeleteRecipeControl confirmation={confirmation} deleteHref={recipe.deleteHref}>
              <DeleteRecipeForm recipeId={recipe.id} />
            </DeleteRecipeControl>
          </>
        }
      >
        <div className={styles.content}>
          {recipe.description ? <p className={styles.description}>{recipe.description}</p> : null}

          <dl className={styles.facts}>
            {recipe.facts.map((fact) => (
              <div key={fact.term} className={styles.fact}>
                <dt className={styles.factTerm}>{fact.term}</dt>
                <dd className={styles.factValue}>{fact.description}</dd>
              </div>
            ))}
          </dl>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Ingredientes</h2>
            <ul className={styles.ingredients}>
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Pasos</h2>
            <ol className={styles.steps}>
              {recipe.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </section>
        </div>
      </PageLayout>
    </div>
  );
}
