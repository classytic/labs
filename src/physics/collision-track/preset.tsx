'use client';

/**
 * CollisionTrackLab — "Sticky or Bouncy?", momentum always survives, KE doesn't.
 *
 * Two carts collide on a frictionless track. ONE elasticity slider morphs
 * continuously from perfectly inelastic (e=0, stick + KE drops) to perfectly
 * elastic (e=1, bounce, KE held). A momentum bar stays FULL through the collision
 * while the KE bar visibly leaks when e<1, and a constant-velocity centre-of-mass
 * marker sails dead-straight through the impact — the single-image proof that
 * momentum is conserved no matter what. Kills the "momentum is lost" misconception.
 *
 * Tokenized SVG; time-dependent so the integrator lives here; honours reduced-motion.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Dot, Vector, Label, useInView } from '@classytic/stage';
import { Slider, CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, MeterBar, LiveRegion } from '../../kit/frame.js';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { useCheckpoint } from '../../kit/pedagogy.js';

export interface CollisionTrackProps {
  m1?: number;
  m2?: number;
  u1?: number;
  u2?: number;
  elasticity?: number;
  showCenterOfMass?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const CART_W = 1.8, CART_H = 1.2, X0 = -9, X1 = 9;

export function CollisionTrackLab({
  m1 = 1, m2 = 1, u1 = 4, u2 = -2, elasticity = 1, showCenterOfMass = true,
  title = 'Sticky or Bouncy? — momentum always survives',
  prompt = 'Set the elasticity, launch, and watch: the momentum bar stays full; the KE bar leaks when sticky.',
  objectives,
}: CollisionTrackProps): ReactNode {
  const [ma, setMa] = useState(m1);
  const [mb, setMb] = useState(m2);
  const [ua, setUa] = useState(u1);
  const [ub, setUb] = useState(u2);
  const [e, setE] = useState(elasticity);
  const [running, setRunning] = useState(false);
  const [collided, setCollided] = useState(false);
  const [stopped, setStopped] = useState(false);

  const xa = useRef(-6), xb = useRef(2);
  const phase = useRef<'approach' | 'after'>('approach');
  const startedRef = useRef(false);
  const reduce = useReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  useCheckpoint({ solved: stopped, activity: 'collision-track' });

  const M = ma + mb;
  // 1-D collision with coefficient of restitution e
  const va = (ma * ua + mb * ub + mb * e * (ub - ua)) / M;
  const vb = (ma * ua + mb * ub + ma * e * (ua - ub)) / M;
  const vcom = (ma * ua + mb * ub) / M;
  const pInit = ma * ua + mb * ub;
  const keInit = 0.5 * ma * ua * ua + 0.5 * mb * ub * ub;

  const after = collided;
  const v1 = after ? va : ua, v2 = after ? vb : ub;
  const pNow = ma * v1 + mb * v2;
  const keNow = 0.5 * ma * v1 * v1 + 0.5 * mb * v2 * v2;
  const keFrac = keInit > 1e-9 ? keNow / keInit : 1;

  useFrameTick(running && inView, (f) => {
    const dt = Math.min(0.05, f.dtMs / 1000);
    if (phase.current === 'approach') {
      xa.current += ua * dt; xb.current += ub * dt;
      if (xb.current - xa.current <= CART_W) {
        // snap to contact, switch to post-collision velocities
        const overlap = CART_W - (xb.current - xa.current);
        xa.current -= overlap / 2; xb.current += overlap / 2;
        phase.current = 'after'; setCollided(true);
      }
    } else {
      xa.current += va * dt; xb.current += vb * dt;
      if (e < 0.02) { const mid = (xa.current + xb.current) / 2; xa.current = mid - CART_W / 2; xb.current = mid + CART_W / 2; }
    }
    // stop when a cart runs off the track
    if (xa.current <= X0 + CART_W / 2 || xb.current >= X1 - CART_W / 2 || (phase.current === 'after' && Math.abs(va) < 1e-3 && Math.abs(vb) < 1e-3)) {
      setRunning(false);
      setStopped(true);
    }
  });

  const reset = (): void => { xa.current = -6; xb.current = 2; phase.current = 'approach'; setCollided(false); setStopped(false); };
  const launch = (): void => {
    reset();
    if (reduce) { phase.current = 'after'; setCollided(true); return; }
    startedRef.current = true; setRunning(true);
  };
  const onParam = (set: (n: number) => void) => (n: number): void => { set(n); setRunning(false); reset(); };

  const xcom = (ma * xa.current + mb * xb.current) / M;
  const view = { xMin: X0, xMax: X1, yMin: -2, yMax: 5 };

  const Cart = (x: number, w: number, vel: number, tint: string, name: string): ReactNode => {
    const hw = CART_W / 2;
    return (
      <>
        <Polygon points={[{ x: x - hw, y: 0.15 }, { x: x + hw, y: 0.15 }, { x: x + hw, y: 0.15 + CART_H }, { x: x - hw, y: 0.15 + CART_H }]} color={`color-mix(in oklab, ${tint} 60%, black)`} fill={tint} fillOpacity={0.85} weight={1.5} />
        <Dot x={x - hw * 0.55} y={0.15} r={4} color="var(--stage-metal)" />
        <Dot x={x + hw * 0.55} y={0.15} r={4} color="var(--stage-metal)" />
        <Label x={x} y={0.15 + CART_H / 2} text={`${w}kg`} color="var(--stage-bg)" size={12} />
        {Math.abs(vel) > 0.05 && <Vector tail={{ x, y: 0.15 + CART_H + 0.6 }} tip={{ x: x + vel * 0.5, y: 0.15 + CART_H + 0.6 }} color={tint} weight={3} />}
      </>
    );
  };

  const figure = (
    <div ref={viewRef} className="lab-playwrap" style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <Stage view={view} height={210} preserveAspect={false} ariaLabel={`Two carts colliding, elasticity ${e.toFixed(2)}`}>
          {/* track */}
          <Segment from={{ x: X0, y: 0 }} to={{ x: X1, y: 0 }} color="var(--stage-fg)" opacity={0.5} weight={2} />
          {[-8, -4, 0, 4, 8].map((mk) => <Segment key={mk} from={{ x: mk, y: -0.2 }} to={{ x: mk, y: 0 }} color="var(--stage-fg)" opacity={0.3} weight={1} />)}
          {Cart(xa.current, ma, v1, 'var(--stage-accent)', 'A')}
          {Cart(xb.current, mb, v2, 'var(--stage-accent-2)', 'B')}
          {/* centre-of-mass marker — glides dead-straight at constant velocity through the impact */}
          {showCenterOfMass && (
            <>
              <Segment from={{ x: xcom, y: -1.4 }} to={{ x: xcom, y: 4.4 }} color="var(--stage-good)" weight={1.5} dashed opacity={0.8} />
              <Dot x={xcom} y={4.4} r={5} color="var(--stage-good)" />
              <Label x={xcom} y={4.4} text="COM" color="var(--stage-good)" size={10} dy={-10} />
            </>
          )}
      </Stage>
    </div>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <MeterBar label="momentum p" frac={pInit !== 0 ? pNow / pInit : (Math.abs(pNow) < 1e-6 ? 1 : 0)} color="var(--stage-good)" value={`${pNow.toFixed(1)} kg·m/s`} />
      <MeterBar label="kinetic energy" frac={keFrac} color={keFrac > 0.99 ? 'var(--stage-good)' : 'var(--stage-warn)'} value={`${keNow.toFixed(1)} J${after && keFrac < 0.99 ? ` · ${Math.round((1 - keFrac) * 100)}% → heat 🔥` : ''}`} />
      <LiveRegion>{`Elasticity ${e.toFixed(2)}. Momentum ${pNow.toFixed(1)} conserved; kinetic energy ${after ? `${Math.round(keFrac * 100)} percent remaining` : 'full before impact'}.`}</LiveRegion>
    </div>
  );

  const controls = (
    <ControlBar>
      <CheckButton onClick={launch}>▶ Launch</CheckButton>
      <StatusPill ok={e > 0.98}>{e > 0.98 ? 'elastic · KE conserved' : e < 0.02 ? 'perfectly inelastic · stick' : 'inelastic · KE lost'}</StatusPill>
      <Field label="elasticity e" value={e.toFixed(2)}><Slider value={e} min={0} max={1} step={0.05} onChange={onParam(setE)} ariaLabel="coefficient of restitution" /></Field>
      <Field label="m₁" value={`${ma}kg`}><Slider value={ma} min={1} max={6} step={0.5} onChange={onParam(setMa)} ariaLabel="mass of cart A (kg)" /></Field>
      <Field label="u₁" value={`${ua}m/s`}><Slider value={ua} min={0} max={8} step={0.5} onChange={onParam(setUa)} ariaLabel="initial velocity of cart A (m/s)" /></Field>
      <Field label="m₂" value={`${mb}kg`}><Slider value={mb} min={1} max={6} step={0.5} onChange={onParam(setMb)} ariaLabel="mass of cart B (kg)" /></Field>
      <Field label="u₂" value={`${ub}m/s`}><Slider value={ub} min={-8} max={0} step={0.5} onChange={onParam(setUb)} ariaLabel="initial velocity of cart B (m/s)" /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls}>{figure}</LabFrame>;
}
