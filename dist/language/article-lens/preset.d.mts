import { ReactNode } from "react";

//#region src/language/article-lens/preset.d.ts
type Article = 'a' | 'an' | 'the' | ', ';
interface ArticleItem {
  /** Text before the blank. */
  before: string;
  /** The noun (shown after the blank). */
  noun: string;
  /** Text after the noun. */
  after?: string;
  answer: Article;
  /** One-line reason shown after a correct pick. */
  why?: string;
}
interface ArticleLensProps {
  items: ArticleItem[];
  objectives?: string[];
  hints?: string[];
  title?: string;
  prompt?: string;
}
declare function ArticleLensLab({
  items,
  objectives,
  hints: hintList,
  title,
  prompt
}: ArticleLensProps): ReactNode;
//#endregion
export { Article, ArticleItem, ArticleLensLab, ArticleLensProps };