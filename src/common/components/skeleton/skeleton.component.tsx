import type { CSSProperties } from "react";
import styles from "./skeleton.module.css";

interface SkeletonBlockProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A grey placeholder block; give it the size of the real content through `className`. Skeletons are not
 * live regions: wrap them in an `aria-hidden="true"` container and announce the result instead.
 */
export function SkeletonBlock({ className, style }: SkeletonBlockProps) {
  return (
    <span
      aria-hidden="true"
      className={className ? `${styles.block} ${className}` : styles.block}
      style={style}
    />
  );
}
