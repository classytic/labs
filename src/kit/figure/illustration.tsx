/**
 * Illustration, the slot for real artwork where HTML/CSS cannot draw the subject (a cell
 * cutaway, a reactor, a rendered apparatus). The package ships NO images: the host supplies
 * light (and optionally dark) assets under its own public dir and passes their URLs. See
 * docs/ILLUSTRATIONS.md for the render pipeline (Blender headless / pre-rendered 3D scenes).
 *
 * The aspect box is reserved up front so the lab never reflows when the image arrives.
 */

import type { ReactNode } from 'react';

export interface IllustrationProps {
  /** Light-theme asset URL (the host's `public/…`). */
  src: string;
  /** Dark-theme asset URL; falls back to `src`. */
  srcDark?: string;
  /** The text alternative; say what the picture shows, not that it is a picture. */
  alt: string;
  /** width / height, reserves space before load (default 16/9). */
  ratio?: number;
  caption?: ReactNode;
  /** `eager` for the hero above the fold. */
  loading?: 'lazy' | 'eager';
  className?: string;
}

export function Illustration({
  src,
  srcDark,
  alt,
  ratio = 16 / 9,
  caption,
  loading = 'lazy',
  className,
}: IllustrationProps): ReactNode {
  return (
    <figure className={['lab-illustration', className].filter(Boolean).join(' ')}>
      <img
        src={src}
        alt={alt}
        data-scheme="light"
        loading={loading}
        decoding="async"
        style={{ aspectRatio: String(ratio) }}
      />
      {srcDark && (
        <img
          src={srcDark}
          alt=""
          aria-hidden="true"
          data-scheme="dark"
          loading={loading}
          decoding="async"
          style={{ aspectRatio: String(ratio) }}
        />
      )}
      {caption != null && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
