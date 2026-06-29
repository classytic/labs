import { CSSProperties, ReactNode } from "react";

//#region src/language/icon.d.ts
interface IconRef {
  kind: 'emoji' | 'svg' | 'image';
  /** emoji character (kind:'emoji') OR a registered svg id (kind:'svg'). */
  id?: string;
  /** image URL (kind:'image'); also accepted as the emoji char if `id` is unset. */
  src?: string;
  /** accessible label; '' marks the icon purely decorative. */
  alt: string;
}
/** A plain string is shorthand for an emoji (or a scene backdrop key). */
type IconValue = string | IconRef;
/** Register an inline-SVG icon so `{ kind:'svg', id }` resolves to it. */
declare function registerLabIcon(id: string, render: (p: {
  size: number;
  title?: string;
}) => ReactNode): void;
/** Normalise any accepted value to an `IconRef` (or null when empty). */
declare function normalizeIcon(v: IconValue | undefined | null): IconRef | null;
interface IconProps {
  icon?: IconValue;
  /** px size for image/svg (emoji is sized by CSS when `className` is set). */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Decorative → aria-hidden (a parent already labels it). */
  decorative?: boolean;
}
/** Render an `IconValue`: emoji span, inline SVG (registry), or <img>. */
declare function Icon({
  icon,
  size,
  className,
  style,
  decorative
}: IconProps): ReactNode;
//#endregion
export { Icon, IconRef, IconValue, normalizeIcon, registerLabIcon };