'use client';

/**
 * KeplerLab — "Equal areas, equal time", the shape and rhythm of orbits.
 *
 * A planet on a true ellipse with the star at one FOCUS (Kepler 1). It moves by
 * solving Kepler's equation M = E − e·sinE, so it genuinely speeds up at
 * perihelion and dawdles at aphelion — and the wedges swept in equal time slices
 * (shaded alternately) come out EQUAL in area (Kepler 2): fat-and-short near the
 * star, thin-and-long far away. The period follows T² ∝ a³ (Kepler 3), so a wider
 * orbit takes disproportionately longer.
 *
 * Drag eccentricity from a circle to a stretched ellipse; drag the semi-major
 * axis and watch the period balloon. Ambient PlayWrap. Tokenized SVG.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Polyline, Polygon, Dot, Segment, Label, type Vec2 } from '@classytic/stage';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { SunGlyph, EarthGlyph } from '../../kit/space.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, Control, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { clamp } from '../../core/util.js';

export interface KeplerProps {
  /** Semi-major axis (drawn units). */
  semiMajor?: number;
  eccentricity?: number;
  /** Show the equal-time / equal-area wedges. */
  wedges?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ hide: ['equal-area wedges'] }`. */
  controlConfig?: ControlConfig;
}

const N_WEDGE = 12;             // equal-time slices

/** Solve Kepler's equation M = E − e·sinE for the eccentric anomaly E. */
function solveE(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 6; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

export function KeplerLab({
  semiMajor = 4, eccentricity = 0.5, wedges = true,
  title = 'Kepler — equal areas in equal time',
  prompt = 'The planet rides a true ellipse with the star at a focus. It speeds up near the star and slows far away, yet the wedge it sweeps in each equal time-slice has the SAME area (Kepler’s 2nd law). Stretch the orbit, and the period grows as T² ∝ a³.',
  objectives,
  controlConfig,
}: KeplerProps): ReactNode {
  const [a, setA] = useState(semiMajor);
  const [e, setE] = useState(eccentricity);
  const [showWedge, setShowWedge] = useState(wedges);
  const gate = usePlayGate();

  const tRef = useRef(0);

  const c = a * e;                              // focus offset (star at origin)
  const b = a * Math.sqrt(1 - e * e);
  const T = Math.pow(a, 1.5) * 1.6;            // Kepler 3 (drawn time units)

  useFrameTick(gate.running, (f) => {
    tRef.current += Math.min(0.05, f.dtMs / 1000);
  });

  // position from eccentric anomaly (star/focus at origin)
  const pos = (M: number): Vec2 => { const E = solveE(M, e); return { x: -c + a * Math.cos(E), y: b * Math.sin(E) }; };

  const M0 = (2 * Math.PI * (tRef.current / T)) % (2 * Math.PI);
  const planet = pos(M0);

  // full ellipse outline
  const outline: Vec2[] = [];
  for (let i = 0; i <= 96; i++) { const E = (i / 96) * 2 * Math.PI; outline.push({ x: -c + a * Math.cos(E), y: b * Math.sin(E) }); }

  // equal-time wedges (equal Δ mean-anomaly ⇒ equal area)
  const wedgePts: Vec2[] = [];
  for (let i = 0; i <= N_WEDGE; i++) wedgePts.push(pos((2 * Math.PI * i) / N_WEDGE));

  const peri = a * (1 - e), apo = a * (1 + e);
  const view = { xMin: -(a + c) - 1, xMax: (a - c) + 1, yMin: -b - 1, yMax: b + 1 };

  const figure = (
    <PlayWrap gate={gate}>
      <div>
        <Stage view={view} height={300} preserveAspect ariaLabel={`Elliptical orbit, eccentricity ${e.toFixed(2)}, star at a focus`}>
          {/* equal-time wedges from the focus */}
          {showWedge && wedgePts.slice(0, N_WEDGE).map((p, i) => (
            <Polygon key={i} points={[{ x: 0, y: 0 }, p, wedgePts[i + 1]!]} color="none" fill={i % 2 === 0 ? 'var(--stage-accent)' : 'var(--stage-accent-2)'} fillOpacity={0.22} weight={0} />
          ))}
          {/* orbit path */}
          <Polyline points={outline} color="var(--stage-fg)" opacity={0.45} weight={1.5} />
          {/* major axis + foci */}
          <Segment from={{ x: -(a + c), y: 0 }} to={{ x: a - c, y: 0 }} color="var(--stage-fg)" opacity={0.25} weight={1} dashed />
          <Dot x={-2 * c} y={0} r={3} color="var(--stage-muted)" />
          {/* star at the focus */}
          <SunGlyph center={{ x: 0, y: 0 }} r={0.5} />
          {/* perihelion / aphelion ticks */}
          <Label x={a - c} y={0} text="perihelion" color="var(--stage-muted)" size={9} dy={-6} anchor="end" />
          <Label x={-(a + c)} y={0} text="aphelion" color="var(--stage-muted)" size={9} dy={-6} anchor="start" />
          {/* the planet + sweep line to the star */}
          <Segment from={{ x: 0, y: 0 }} to={planet} color="var(--stage-accent)" opacity={0.7} weight={1.2} />
          <EarthGlyph center={planet} r={0.34} atmosphere={false} />
        </Stage>
      </div>
    </PlayWrap>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
          <span>eccentricity e = <strong>{e.toFixed(2)}</strong> {e < 0.02 ? '(circle)' : ''}</span>
          <span>perihelion {peri.toFixed(1)} · aphelion {apo.toFixed(1)}</span>
          <span>period T ∝ a^1.5 = <strong>{T.toFixed(1)}</strong> · T²/a³ = <strong>{((T * T) / (a * a * a)).toFixed(2)}</strong></span>
        </span>
      </Callout>
      <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>
        Each shaded wedge is one equal time-slice — they look different but enclose the <strong>same area</strong>
        (Kepler’s 2nd law), so the planet must move fastest at perihelion. T²/a³ stays constant as you widen the
        orbit (Kepler’s 3rd law).
      </p>
      <LiveRegion>{`Eccentricity ${e.toFixed(2)}, period ${T.toFixed(1)}. Equal-time wedges have equal area.`}</LiveRegion>
    </div>
  );

  const controls = (
    <ControlBar>
      <Control name="equal-area wedges"><Chip selected={showWedge} onClick={() => setShowWedge((w) => !w)}>equal-area wedges</Chip></Control>
      <Field label="eccentricity" value={e.toFixed(2)}><Slider value={e} min={0} max={0.7} step={0.05} onChange={setE} ariaLabel="eccentricity" /></Field>
      <Field label="semi-major a" value={a.toFixed(1)}><Slider value={a} min={2.5} max={5} step={0.5} onChange={(n) => setA(clamp(n, 2.5, 5))} ariaLabel="semi-major axis" /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} controlConfig={controlConfig}>{figure}</LabFrame>;
}
