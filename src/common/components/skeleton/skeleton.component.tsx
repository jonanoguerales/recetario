import type { CSSProperties, ReactNode } from "react";
import styles from "./skeleton.module.css";

interface SkeletonStatusProps {
  /** Text announced to assistive technology while the region loads. */
  label?: string;
  /** Layout classes of the real content, so the skeleton takes exactly its shape. */
  className?: string;
  children: ReactNode;
}

/**
 * Wraps a skeleton: `role="status"` with a visually hidden text; the grey blocks inside are
 * `aria-hidden`. Pass the layout classes of the real content through `className`.
 */
export function SkeletonStatus({ label = "Cargando…", className, children }: SkeletonStatusProps) {
  return (
    <div role="status" className={className}>
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}

interface SkeletonBlockProps {
  className?: string;
  style?: CSSProperties;
}

/** A grey placeholder block; give it the size of the real content through `className`. */
export function SkeletonBlock({ className, style }: SkeletonBlockProps) {
  return (
    <span
      aria-hidden="true"
      className={className ? `${styles.block} ${className}` : styles.block}
      style={style}
    />
  );
}
