"use client";

import { useFormStatus } from "react-dom";
import { RECIPE_ACTION_FIELDS } from "../recipe-detail.schema";
import styles from "./actions.module.css";

/** Star: outline when not a favourite, filled when it is (a change of shape, not only of colour). */
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.star}>
      <path
        d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Client island of «Favorita» (allowed by nextjs-rendering-strategy: «favorita optimista»).
 *
 * It lives inside the server-rendered <form> whose action is the Server Action itself, so without
 * JavaScript the browser posts the form and the server redirects back to the detail with the new
 * state. With JavaScript the button changes at once: while the submission is pending, the state
 * shown is the one being submitted (`useFormStatus().data`, the documented React way to show the
 * data a form is sending), and when the server answers the page brings the stored state. This is
 * the optimistic update without `useOptimistic`, which needs an action written on the client and
 * would lose the form's progressive enhancement.
 *
 * Toggle button (aria-pressed) with a constant name, «Favorita»: the state is not repeated in the
 * name (it is announced as «pulsado»/«no pulsado») and visually the star is filled or outlined.
 */
export function FavoriteButton({ isFavorite }: { isFavorite: boolean }) {
  const { pending, data } = useFormStatus();
  const submitted = pending ? data?.get(RECIPE_ACTION_FIELDS.isFavorite) : null;
  const shown = submitted === "true" || submitted === "false" ? submitted === "true" : isFavorite;

  return (
    <>
      {/* The state to save: the opposite of what is shown, so a second click while the first one
          is still saving undoes it. */}
      <input type="hidden" name={RECIPE_ACTION_FIELDS.isFavorite} value={String(!shown)} />
      <button type="submit" aria-pressed={shown} className={`${styles.action} ${styles.favorite}`}>
        <StarIcon filled={shown} />
        Favorita
      </button>
    </>
  );
}
