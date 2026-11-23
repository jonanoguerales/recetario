import { SkeletonBlock, SkeletonStatus } from "./skeleton.component";
import styles from "./skeleton.module.css";

interface Props {
  /** Number of text lines of the real content. */
  lines?: number;
  label?: string;
}

/** Placeholder for a paragraph: one block per line, each exactly one line-height tall. */
export function SkeletonText({ lines = 1, label }: Props) {
  return (
    <SkeletonStatus label={label} className={styles.text}>
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonBlock key={index} className={styles.line} />
      ))}
    </SkeletonStatus>
  );
}
