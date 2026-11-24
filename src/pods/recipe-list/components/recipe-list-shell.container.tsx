"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useTransition,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import listStyles from "../recipe-list.module.css";
import { buildRecipeListHref, readRecipeListForm, RECIPE_LIST_PARAMS } from "../recipe-list.url";
import type { RecipeFiltersVm } from "../recipe-list.vm";
import { RecipeFiltersComponent } from "./recipe-filters.component";
import { RecipeListSkeleton } from "./recipe-list-skeleton.component";

/**
 * Pause after the last change of the search text or the category before applying them, so each letter
 * (or each option reached with the arrow keys of a <select>) does not trigger a navigation.
 */
const APPLY_DELAY_MS = 400;

/** Puts the given filters into the (uncontrolled) controls of the form. */
function setControls(
  form: HTMLFormElement | null,
  values: Pick<RecipeFiltersVm, "q" | "category" | "favoritesOnly">,
) {
  if (!form) return;
  const search = form.elements.namedItem(RECIPE_LIST_PARAMS.search);
  const category = form.elements.namedItem(RECIPE_LIST_PARAMS.category);
  const favorites = form.elements.namedItem(RECIPE_LIST_PARAMS.favorites);
  if (search instanceof HTMLInputElement) search.value = values.q;
  if (category instanceof HTMLSelectElement) category.value = values.category;
  if (favorites instanceof HTMLInputElement) favorites.checked = values.favoritesOnly;
}

interface Props {
  /** null when there is nothing to filter yet (no recipes). */
  filters: RecipeFiltersVm | null;
  summary: string;
  /** The summary is visible only next to cards; otherwise the empty state already says it. */
  summaryVisible: boolean;
  /** Cards of the skeleton: as many as the list it replaces (at least one). */
  pendingCardCount: number;
  /** The list (or its empty state), rendered on the server. */
  children: ReactNode;
}

/**
 * Client island of /recetas (allowed by nextjs-rendering-strategy: «estado pendiente»). Without
 * JavaScript the GET form and the server-rendered list do everything. With JavaScript it only adds:
 * - applying «Solo favoritas» as soon as it changes, and the search and the category after a short
 *   pause (one navigation per pause, not per keystroke or per option); «Buscar» applies everything at once;
 * - a client navigation (router.push inside a transition) to the same URL the form would open, so the
 *   URL keeps the filters and «atrás» restores them;
 * - while the new list arrives, a skeleton with the shape of the list (isPending of the transition).
 * It never fetches data: the list always comes from the server (D-28).
 */
export function RecipeListShellContainer({
  filters,
  summary,
  summaryVisible,
  pendingCardCount,
  children,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const applyTimer = useRef<number | undefined>(undefined);
  /** Last URL this island asked for: tells its own results apart from «atrás» or a link. */
  const requestedHref = useRef<string | null>(null);
  const currentHref = filters?.currentHref ?? null;

  function cancelPendingApply() {
    window.clearTimeout(applyTimer.current);
    applyTimer.current = undefined;
  }

  function navigate(href: string) {
    cancelPendingApply();
    requestedHref.current = href;
    if (href === currentHref) return;
    // scroll: false — the person keeps their place next to the filters while the list changes.
    startTransition(() => router.push(href, { scroll: false }));
  }

  function applyForm() {
    const form = formRef.current;
    if (form) navigate(buildRecipeListHref(readRecipeListForm(new FormData(form))));
  }

  function scheduleApply() {
    cancelPendingApply();
    applyTimer.current = window.setTimeout(applyForm, APPLY_DELAY_MS);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyForm();
  }

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    // While an IME is composing a word, wait for compositionend (ime-safe input).
    if ((event.nativeEvent as InputEvent).isComposing) return;
    scheduleApply();
  }

  function handleClear(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setControls(formRef.current, { q: "", category: "", favoritesOnly: false });
    navigate(event.currentTarget.getAttribute("href") ?? buildRecipeListHref({}));
  }

  // When the URL changes from outside the form («atrás», «adelante», a link of the list), the
  // controls show its filters again. The island's own results are left alone, so whatever the
  // person typed after the request is not overwritten.
  useEffect(() => {
    const isOwnResult = filters?.currentHref === requestedHref.current;
    // Forget the request once a result has arrived: going «adelante» to that same URL later must
    // sync the controls again.
    requestedHref.current = null;
    if (filters && !isOwnResult) setControls(formRef.current, filters);
  }, [filters]);

  useEffect(() => cancelPendingApply, []);

  return (
    <div className={listStyles.root}>
      {filters ? (
        <RecipeFiltersComponent
          filters={filters}
          formRef={formRef}
          onSubmit={handleSubmit}
          onSearchChange={handleSearchChange}
          onSearchCompositionEnd={scheduleApply}
          onCategoryChange={scheduleApply}
          onFavoritesChange={applyForm}
          onClear={handleClear}
        />
      ) : null}
      {/* Polite live region: with JavaScript, the new result («3 recetas») is announced. */}
      <p role="status" className={summaryVisible ? listStyles.summary : "visually-hidden"}>
        {summary}
      </p>
      {isPending ? <RecipeListSkeleton count={pendingCardCount} /> : children}
    </div>
  );
}
