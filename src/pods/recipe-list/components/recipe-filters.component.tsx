import Link from "next/link";
import type {
  ChangeEventHandler,
  CompositionEventHandler,
  FormEventHandler,
  MouseEventHandler,
  RefObject,
} from "react";
import { RECIPE_ROUTES } from "@/core/recipes/recipe.routes";
import { FAVORITES_ON, RECIPE_LIST_PARAMS, SEARCH_MAX_LENGTH } from "../recipe-list.url";
import type { RecipeFiltersVm } from "../recipe-list.vm";
import styles from "./recipe-filters.module.css";

interface Props {
  filters: RecipeFiltersVm;
  formRef: RefObject<HTMLFormElement | null>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onSearchChange: ChangeEventHandler<HTMLInputElement>;
  onSearchCompositionEnd: CompositionEventHandler<HTMLInputElement>;
  onFilterChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  onClear: MouseEventHandler<HTMLAnchorElement>;
}

/**
 * Search and filters of the list: a GET form to /recetas (D-21: without JavaScript «Buscar» submits it
 * and the server answers the filtered list). The controls start with the values of the URL.
 * `autoComplete="off"` also stops the browser from restoring stale values when going back.
 */
export function RecipeFiltersComponent({
  filters,
  formRef,
  onSubmit,
  onSearchChange,
  onSearchCompositionEnd,
  onFilterChange,
  onClear,
}: Props) {
  return (
    <search className={styles.search}>
      <form
        ref={formRef}
        method="get"
        action={RECIPE_ROUTES.list}
        aria-label="Buscar y filtrar recetas"
        autoComplete="off"
        className={styles.form}
        onSubmit={onSubmit}
      >
        <div className={`${styles.field} ${styles.searchField}`}>
          <label htmlFor="recipe-search" className={styles.label}>
            Buscar por título o ingrediente
          </label>
          <input
            id="recipe-search"
            name={RECIPE_LIST_PARAMS.search}
            type="search"
            defaultValue={filters.q}
            maxLength={SEARCH_MAX_LENGTH}
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={styles.control}
            onChange={onSearchChange}
            onCompositionEnd={onSearchCompositionEnd}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="recipe-category" className={styles.label}>
            Categoría
          </label>
          <select
            id="recipe-category"
            name={RECIPE_LIST_PARAMS.category}
            defaultValue={filters.category}
            className={styles.control}
            onChange={onFilterChange}
          >
            <option value="">Todas</option>
            {filters.categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.check}>
          <input
            id="recipe-favorites"
            name={RECIPE_LIST_PARAMS.favorites}
            type="checkbox"
            value={FAVORITES_ON}
            defaultChecked={filters.favoritesOnly}
            className={styles.checkbox}
            onChange={onFilterChange}
          />
          <label htmlFor="recipe-favorites">Solo favoritas</label>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.submit}>
            Buscar
          </button>
          {filters.clearHref ? (
            <Link href={filters.clearHref} className={styles.clear} onClick={onClear}>
              Quitar filtros
            </Link>
          ) : null}
        </div>
      </form>
    </search>
  );
}
