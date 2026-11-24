import Link from "next/link";
import { RECIPE_ROUTES } from "@/core/recipes/recipe.routes";
import type { RecipeListEmptyState } from "../recipe-list.vm";
import styles from "./recipe-list-empty.module.css";

interface Props {
  state: RecipeListEmptyState;
  /** The list without filters («Quitar filtros»). */
  allRecipesHref: string;
  /** Same filters, page 1. */
  firstPageHref: string;
}

/** What to do when the list is empty (D-22): each case says why and offers the next step. */
export function RecipeListEmpty({ state, allRecipesHref, firstPageHref }: Props) {
  const content = {
    "no-recipes": {
      title: "Todavía no tienes recetas",
      text: "Guarda aquí tus recetas y las tendrás siempre a mano para buscarlas y organizarlas.",
      href: RECIPE_ROUTES.new,
      action: "Crear mi primera receta",
    },
    "no-matches": {
      title: "No hay recetas que coincidan",
      text: "Prueba con otras palabras, elige otra categoría o quita los filtros para ver todas tus recetas.",
      href: allRecipesHref,
      action: "Quitar filtros",
    },
    "page-out-of-range": {
      title: "No hay más recetas",
      text: "Esta página está vacía: tus recetas empiezan en la primera página.",
      href: firstPageHref,
      action: "Ir a la primera página",
    },
  }[state];

  return (
    <div className={styles.empty}>
      <h2 className={styles.title}>{content.title}</h2>
      <p className={styles.text}>{content.text}</p>
      <Link href={content.href} className={styles.action}>
        {content.action}
      </Link>
    </div>
  );
}
