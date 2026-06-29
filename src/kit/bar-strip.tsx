'use client';

/**
 * BarStrip, the shared part-whole bar primitive. A fixed-length `span` (in stage
 * x-units) is cut into `cells` equal parts with the first `shaded` filled. The
 * length is INDEPENDENT of the part count — so a 4-cell strip and an 8-cell strip
 * drawn with the SAME `span` line up exactly, which is the whole point of
 * "equivalent fractions = the same length, re-cut".
 *
 * This is the canonical home of that invariant: drawing strips in raw 0..cells
 * coordinates (length == cell count) is what let an 8-part compare strip overflow
 * a 4-part view. Always render through BarStrip so a strip can't mismatch another
 * strip's length or run past its Stage view. Render it INSIDE a <Stage>.
 */

import type { ReactNode } from 'react';
import { Segment } from '@classytic/stage';

export interface BarStripProps {
  /** Total length of the strip in stage x-units (INDEPENDENT of the cell count). */
  span: number;
  /** Number of equal parts the whole is cut into. */
  cells: number;
  /** How many leading cells are filled. */
  shaded: number;
  /** y position (stage units). */
  y: number;
  /** Fill colour for the shaded cells. */
  color: string;
  /** Bar thickness, px. Default 32. */
  weight?: number;
  /** Track (unfilled) colour. Default --stage-grid. */
  trackColor?: string;
}

export function BarStrip({ span, cells, shaded, y, color, weight = 32, trackColor = 'var(--stage-grid)' }: BarStripProps): ReactNode {
  const cw = span / cells;
  const lines: ReactNode[] = [];
  for (let i = 1; i < cells; i++) lines.push(<Segment key={i} from={{ x: i * cw, y: y - 0.5 }} to={{ x: i * cw, y: y + 0.5 }} color="var(--stage-bg)" weight={2} />);
  return (
    <>
      <Segment from={{ x: 0, y }} to={{ x: span, y }} color={trackColor} weight={weight} opacity={0.55} />
      {shaded > 0 && <Segment from={{ x: 0, y }} to={{ x: shaded * cw, y }} color={color} weight={weight} />}
      {lines}
    </>
  );
}
