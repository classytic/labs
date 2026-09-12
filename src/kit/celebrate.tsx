'use client';

/**
 * Celebration feedback, the "dopamine layer" a correct answer deserves.
 *
 * A solve used to produce a static "✓ Correct" pill; students read it as a
 * form validator, not a win. `<Celebrate>` fires a small confetti burst (plus
 * a pop on the pill via `.lab-pop`) on the RISING edge of `play`, then cleans
 * itself up. It is wired into the shared success paths (`Feedback`,
 * `ChallengeCard`, `AskBox`), so every lab that uses the pedagogy kit gets it
 * with zero per-lab work; export it for custom moments too.
 *
 * Zero-dep + cheap on purpose: a one-shot CSS keyframe animation on ~14
 * absolutely-positioned spans (GPU-composited transforms, no rAF loop, no
 * React re-renders while flying). Honors prefers-reduced-motion via CSS
 * (`.lab-confetti` is display:none under reduce), so no JS media query is
 * needed and SSR stays deterministic.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StatusPill } from './controls.js';

const COUNT = 14;
const COLORS = ['var(--lab-accent)', 'var(--lab-good)', 'var(--lab-warn)', 'var(--lab-danger)'];

/** One confetti burst per rising edge of `play`. Render it INSIDE a
 *  position:relative wrapper (`.lab-celebrate` provides one). */
export function Celebrate({ play }: { play: boolean }): ReactNode {
  const [burst, setBurst] = useState(0);
  // Starts false (not `play`) so mounting already-solved (e.g. the success pill
  // that only mounts once solved) still fires exactly one burst.
  const prev = useRef(false);

  useEffect(() => {
    if (play && !prev.current) setBurst((b) => b + 1);
    prev.current = play;
  }, [play]);

  // Remove the particles after the animation completes (they're opacity:0 by
  // then; unmounting returns the nodes).
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(0), 900);
    return () => clearTimeout(t);
  }, [burst]);

  if (!burst) return null;
  return (
    <span className="lab-confetti" aria-hidden key={burst}>
      {Array.from({ length: COUNT }, (_, i) => {
        // Deterministic spread: angle by index, distance/rotation by a small
        // integer hash, so the burst looks organic without Math.random().
        const angle = (i / COUNT) * Math.PI * 2 + ((i * 7) % 3) * 0.19;
        const dist = 38 + ((i * 13) % 5) * 9;
        const dx = Math.round(Math.cos(angle) * dist);
        const dy = Math.round(Math.sin(angle) * dist * 0.85) - 14;
        const rot = 120 + ((i * 47) % 240);
        const style = {
          '--dx': `${dx}px`,
          '--dy': `${dy}px`,
          '--rot': `${rot}deg`,
          '--c': COLORS[i % COLORS.length],
          animationDelay: `${(i % 4) * 24}ms`,
        } as React.CSSProperties;
        return <span key={i} style={style} />;
      })}
    </span>
  );
}

/** Success badge plus a single accessible celebration burst. */
export function SolvedPill({ children = '✓ Correct' }: { children?: ReactNode }): ReactNode {
  return (
    <span className="lab-celebrate">
      <StatusPill ok className="lab-pop" role="status">
        {children}
      </StatusPill>
      <Celebrate play />
    </span>
  );
}
