'use client';

/**
 * Tex — render a LaTeX string with KaTeX AT RENDER TIME, so the markup is
 * identical on the server and client: SSR/static exports show real maths (not raw
 * `\cdot`/`\dfrac`), there's no raw-then-hydrate flash, and hydration matches.
 *
 * `katex` is a static import kept in this OWN module — stage/labs `neverBundle`
 * leave it external, so only `<Tex>` importers pull it (the consumer resolves the
 * optional peer; non-Tex consumers never bundle it). If `renderToString` throws on
 * a malformed string we fall back to the raw LaTeX in a `<code>`. Pair with
 * `toLatex(ast)` from the expr engine to show equations/derivatives beautifully.
 *
 * The consumer must import KaTeX's stylesheet once for correct glyphs:
 *   import 'katex/dist/katex.min.css';
 */

import katex from 'katex';
import { useMemo, type ReactNode } from 'react';

export function Tex({ tex, block = false, className }: { tex: string; block?: boolean; className?: string }): ReactNode {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { displayMode: block, throwOnError: false });
    } catch {
      return null;
    }
  }, [tex, block]);

  if (html == null) return <code className={className}>{tex}</code>;
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
