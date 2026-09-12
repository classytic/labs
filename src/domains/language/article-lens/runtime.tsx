'use client';

/** Article-lens runtime — adapter: coerce the items array (may round-trip as a JSON string). */
import type { ReactNode } from 'react';
import { ArticleLensLab } from '../../../language/article-lens/index.js';
import { coerceArray, DEMO_ARTICLES, type ArticleItem } from '../shared.js';

export default function ArticleLens(a: Record<string, unknown>): ReactNode {
  return (
    <ArticleLensLab
      items={coerceArray<ArticleItem>(a.items, DEMO_ARTICLES)}
      objectives={a.objectives as string[] | undefined}
      hints={a.hints as string[] | undefined}
      lang={a.lang as string | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
