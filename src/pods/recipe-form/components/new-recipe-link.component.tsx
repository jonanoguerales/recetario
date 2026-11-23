import Link from "next/link";
import { RECIPE_ROUTES } from "@/core/recipes/recipe.routes";
import styles from "./new-recipe-link.module.css";

/** Main call to action of the recipe pages: opens the empty form. */
export function NewRecipeLink() {
  return (
    <Link href={RECIPE_ROUTES.new} className={styles.link}>
      <span aria-hidden="true" className={styles.icon}>
        +
      </span>
      Nueva receta
    </Link>
  );
}
