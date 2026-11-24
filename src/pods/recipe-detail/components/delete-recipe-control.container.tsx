"use client";

import Link from "next/link";
import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { useIsHydrated } from "../recipe-detail.hooks";
import type { RecipeDeleteVm } from "../recipe-detail.vm";
import styles from "./actions.module.css";
import dialogStyles from "./delete-dialog.module.css";

/** The browser has a modal <dialog> (everything since 2022; older ones keep the confirmation page). */
function supportsModalDialog(): boolean {
  return typeof HTMLDialogElement === "function" && "showModal" in HTMLDialogElement.prototype;
}

/** Pointer outside the dialog's box (its padding and the gaps between its children are inside). */
function isOutside(event: PointerEvent, dialog: HTMLDialogElement): boolean {
  const box = dialog.getBoundingClientRect();
  return (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  );
}

/**
 * Light dismiss where `closedby` is missing (Safari): close when both the press and the release
 * happen on the backdrop, so a text selection that ends outside does not close it.
 */
function addLightDismissFallback(dialog: HTMLDialogElement): () => void {
  if ("closedBy" in HTMLDialogElement.prototype) return () => {};
  let pressedOutside = false;
  const onPointerDown = (event: PointerEvent) => {
    pressedOutside = isOutside(event, dialog);
  };
  const onPointerUp = (event: PointerEvent) => {
    if (pressedOutside && isOutside(event, dialog)) dialog.close();
  };
  dialog.addEventListener("pointerdown", onPointerDown);
  dialog.addEventListener("pointerup", onPointerUp);
  return () => {
    dialog.removeEventListener("pointerdown", onPointerDown);
    dialog.removeEventListener("pointerup", onPointerUp);
  };
}

interface Props {
  confirmation: RecipeDeleteVm;
  /** Link of «Borrar» without JavaScript: the confirmation page. */
  deleteHref: string;
  /** The «Sí, borrar» form, rendered on the server. */
  children: ReactNode;
}

/**
 * «Borrar» with confirmation (AC-7). Client island allowed by nextjs-rendering-strategy («confirmar
 * borrado»):
 * - without JavaScript (and until hydration) it is a link to /recetas/[id]/borrar, a page that asks;
 * - with JavaScript it is a <button> that opens a native modal <dialog> with the same question and
 *   the same two actions, without leaving the page.
 * The dialog is only in the DOM while open (its h1 never competes with the page's one). The browser
 * gives the modal its inert page, Esc / back gesture, top layer and the return of focus to «Borrar»;
 * `closedby="any"` adds closing by clicking outside (with a fallback where it is not supported).
 * The initial focus goes to «Cancelar», the safe action.
 */
export function DeleteRecipeControl({ confirmation, deleteHref, children }: Props) {
  // Until hydrated (and without JavaScript) the HTML has the plain link to the confirmation page.
  const canUseDialog = useIsHydrated() && supportsModalDialog();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Opens the dialog as soon as it is mounted; the cleanup removes the light-dismiss fallback.
  const showAsModal = useCallback((dialog: HTMLDialogElement | null) => {
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    cancelRef.current?.focus();
    return addLightDismissFallback(dialog);
  }, []);

  if (!canUseDialog) {
    return (
      <Link href={deleteHref} className={`${styles.action} ${styles.danger}`}>
        Borrar
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${styles.action} ${styles.danger}`}>
        Borrar
      </button>
      {open ? (
        <dialog
          ref={showAsModal}
          closedby="any"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onClose={() => setOpen(false)}
          className={dialogStyles.dialog}
        >
          <div className={dialogStyles.body}>
            {/* A modal dialog is a separate window: its title is its h1 (Modern Web Guidance, dialog). */}
            <h1 id={titleId} className={dialogStyles.title}>
              {confirmation.question}
            </h1>
            <p id={descriptionId} className={dialogStyles.explanation}>
              {confirmation.explanation}
            </p>
            <div className={styles.row}>
              {children}
              <form method="dialog">
                <button ref={cancelRef} type="submit" value="cancel" className={styles.action}>
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
