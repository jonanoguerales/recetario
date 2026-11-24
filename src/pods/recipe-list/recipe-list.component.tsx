import { RecipeCardComponent } from "./components/recipe-card.component";
import { RecipeListEmpty } from "./components/recipe-list-empty.component";
import { RecipeListPagination } from "./components/recipe-list-pagination.component";
import { RecipeListShellContainer } from "./components/recipe-list-shell.container";
import styles from "./recipe-list.module.css";
import type { RecipeListVm } from "./recipe-list.vm";

/**
 * The list of /recetas. The cards (or the empty state) are rendered on the server and arrive complete
 * in the HTML; the island around them only adds the JavaScript behaviour of the filters.
 */
export function RecipeListComponent({ list }: { list: RecipeListVm }) {
  return (
    <RecipeListShellContainer
      filters={list.filters}
      summary={list.summary}
      summaryVisible={list.cards.length > 0}
      pendingCardCount={Math.max(1, list.cards.length)}
    >
      {list.emptyState ? (
        <RecipeListEmpty
          state={list.emptyState}
          allRecipesHref={list.allRecipesHref}
          firstPageHref={list.firstPageHref}
        />
      ) : (
        <>
          {/* role="list": Safari drops the list semantics of a <ul> with list-style: none. */}
          <ul role="list" className={styles.list}>
            {list.cards.map((card) => (
              <li key={card.id} className={styles.item}>
                <RecipeCardComponent card={card} />
              </li>
            ))}
          </ul>
          {list.pagination ? <RecipeListPagination pagination={list.pagination} /> : null}
        </>
      )}
    </RecipeListShellContainer>
  );
}
