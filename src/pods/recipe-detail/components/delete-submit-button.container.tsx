"use client";

import { useFormStatus } from "react-dom";
import { useIsHydrated } from "../recipe-detail.hooks";
import { RECIPE_ACTION_FIELDS, WITH_JS } from "../recipe-detail.schema";
import styles from "./actions.module.css";

/**
 * «Sí, borrar» (client island: pending state of the form). Disabled only while the deletion is
 * being sent, with the text «Borrando…», so it cannot be posted twice. Once hydrated it also sends
 * `withJs=1`: the form is then submitted by React and the notice of /recetas is rendered in the same
 * response (see src/core/flash/flash.ts).
 */
export function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  const hydrated = useIsHydrated();
  return (
    <>
      {hydrated ? <input type="hidden" name={RECIPE_ACTION_FIELDS.withJs} value={WITH_JS} /> : null}
      <button type="submit" disabled={pending} className={`${styles.action} ${styles.dangerSolid}`}>
        {pending ? "Borrando…" : "Sí, borrar"}
      </button>
    </>
  );
}
