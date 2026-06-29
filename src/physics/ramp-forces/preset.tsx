'use client';

/**
 * RampForcesLab, "Tilt the Ramp", where gravity gets a share (F = ma) AND you
 * can push/pull the crate.
 *
 * Tilt the incline and the weight SPLITS into a down-slope share (mg sinθ) and a
 * press-in share (mg cosθ = the normal N, which visibly shrinks as you tilt, the
 * headline misconception). Add an applied force (push up-slope / pull down) and
 * watch the SUM of forces: static friction holds it (adjusting up to μs·N) until
 * the drive exceeds that grip, then kinetic friction (μk·N, weaker) takes over
 * and it accelerates, a = net/m. A force-ledger bar shows every along-slope
 * force adding to the net, so "the forces add up" is visual, not just stated.
 *
 * Up-slope is the POSITIVE axis throughout. Tokenized SVG; reuses the diagram kit;
 * honours prefers-reduced-motion.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Vector, Label, useFrameLoop, useInView, type Vec2 } from '@classytic/stage';
import { toRad } from '../../core/util.js';
import { useReducedMotion } from '../../kit/anim.js';
import { AngleArc, RightAngleMark } from '../../kit/diagram.js';
import { Slider, Chip, CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Control, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';

export interface RampForcesProps {
  angleDeg?: number;
  mass?: number;
  /** Static coefficient μs (the grip that must be broken to start moving). */
  friction?: number;
  /** Kinetic coefficient μk (while sliding; clamped ≤ μs). */
  frictionKinetic?: number;
  /** Applied force along the slope, N. Positive = push up-slope, negative = pull/push down. */
  appliedN?: number;
  g?: number;
  showComponents?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Creator's per-knob hide/lock policy. Names: angle, push, mass, frictionStatic, frictionKinetic, components, release. */
  controlConfig?: ControlConfig;
}

const L = 4.2;        // slope length (metres)
const HS = 0.52;      // crate half-size (metres)
const WLEN = 2.4;     // weight-arrow length in metres (mg maps here; others scale off it)
const LANE = 0.17;    // perpendicular gap so the along-slope arrows sit in separate lanes

const C_MG = 'var(--stage-fg)';
const C_N = 'var(--stage-accent-2)';
const C_FRIC = 'var(--stage-warn)';
const C_GRAV = 'color-mix(in oklab, var(--stage-fg) 50%, transparent)';
const C_APPLIED = 'var(--stage-accent)';
const C_NET = 'var(--stage-good)';

/** One signed force bar on the along-slope ledger (left = down-slope, right = up). */
function LedgerBar({ label, v, max, color, bold }: { label: string; v: number; max: number; color: string; bold?: boolean }): ReactNode {
  const pct = Math.min(50, (Math.abs(v) / (max || 1)) * 50);
  const up = v >= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ width: 78, color: 'var(--stage-muted)', fontWeight: bold ? 700 : 500 }}>{label}</span>
      <div style={{ position: 'relative', flex: 1, height: bold ? 16 : 12 }}>
        <div style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: 'var(--stage-grid)' }} />
        <div style={{ position: 'absolute', top: 1, bottom: 1, [up ? 'left' : 'right']: '50%', width: `${pct}%`, background: color, borderRadius: 3, opacity: bold ? 1 : 0.85 }} />
      </div>
      <span style={{ width: 60, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: bold ? 700 : 600 }}>
        {Math.abs(v) < 0.5 ? '0' : Math.abs(v).toFixed(0)}N{Math.abs(v) < 0.5 ? '' : up ? ' ↑' : ' ↓'}
      </span>
    </div>
  );
}

export function RampForcesLab({
  angleDeg = 25, mass = 2, friction = 0.4, frictionKinetic = 0.3, appliedN = 0, g = 9.8, showComponents = false,
  title = 'Tilt the Ramp: split the weight, add a push, sum the forces',
  prompt = 'Tilt it, then push or pull: static friction holds until the forces win, then it slides at a = net/m.',
  objectives, controlConfig,
}: RampForcesProps): ReactNode {
  const [deg, setDeg] = useState(angleDeg);
  const [mus, setMus] = useState(friction);
  const [mukRaw, setMuk] = useState(frictionKinetic);
  const [m, setM] = useState(mass);
  const [applied, setApplied] = useState(appliedN);
  const [comps, setComps] = useState(showComponents);
  const [p, setP] = useState(0.55);          // crate position along the slope (0 bottom → 1 top)
  const [sliding, setSliding] = useState(false);
  const [landed, setLanded] = useState(false);
  const startRef = useRef<number | null>(null);
  const p0 = useRef(0.55);
  const reduce = useReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  useCheckpoint({ solved: landed, activity: 'ramp-forces' });

  const th = toRad(deg);
  const cos = Math.cos(th), sin = Math.sin(th);
  const muk = Math.min(mukRaw, mus);                 // kinetic ≤ static (physical)

  // ── forces along the slope, UP = positive ───────────────────────────────────
  const W = m * g, N = m * g * cos;                   // no vertical applied force → N = mg cosθ
  const gravAlong = m * g * sin;                      // down-slope pull (magnitude)
  const drive = applied - gravAlong;                  // applied (up) vs gravity (down)
  const fsMax = mus * N;                              // max static grip
  const held = Math.abs(drive) <= fsMax + 1e-9;       // friction can cancel the drive
  const fk = muk * N;
  const frictionUp = held ? -drive : (drive > 0 ? -fk : fk);   // opposes the drive/motion
  const net = drive + frictionUp;                    // signed, up = +
  const aSigned = net / m;
  const a = Math.abs(aSigned);
  const slidesUp = net > 0;
  const ledgerMax = Math.max(gravAlong, Math.abs(applied), Math.abs(frictionUp), Math.abs(net), 1);

  // geometry (metres): wedge apex at origin, slope length L at angle θ
  const Ctop: Vec2 = { x: L * cos, y: L * sin };
  const baseCorner: Vec2 = { x: L * cos, y: 0 };
  const u: Vec2 = { x: cos, y: sin };                 // up-slope unit
  const nrm: Vec2 = { x: -sin, y: cos };              // out-of-surface unit
  const dn: Vec2 = { x: -cos, y: -sin };             // down-slope unit
  const surf: Vec2 = { x: p * Ctop.x, y: p * Ctop.y };
  const O: Vec2 = { x: surf.x + nrm.x * HS, y: surf.y + nrm.y * HS };

  const sc = WLEN / (W || 1);                         // newtons → metres
  const arrow = (dir: Vec2, mag: number): Vec2 => ({ x: dir.x * mag * sc, y: dir.y * mag * sc });
  const add = (p1: Vec2, p2: Vec2): Vec2 => ({ x: p1.x + p2.x, y: p1.y + p2.y });
  const lane = (k: number): Vec2 => ({ x: O.x + nrm.x * LANE * k, y: O.y + nrm.y * LANE * k });
  const beyond = (tip: Vec2, dir: Vec2, off = 15): { x: number; y: number; dx: number; dy: number } => {
    const d = Math.hypot(dir.x, dir.y) || 1;
    return { x: tip.x, y: tip.y, dx: (dir.x / d) * off, dy: (-dir.y / d) * off };
  };

  const crate = [
    { x: O.x - HS * u.x - HS * nrm.x, y: O.y - HS * u.y - HS * nrm.y },
    { x: O.x + HS * u.x - HS * nrm.x, y: O.y + HS * u.y - HS * nrm.y },
    { x: O.x + HS * u.x + HS * nrm.x, y: O.y + HS * u.y + HS * nrm.y },
    { x: O.x - HS * u.x + HS * nrm.x, y: O.y - HS * u.y + HS * nrm.y },
  ];

  // along-slope arrows live in separate perpendicular LANES so they never overlap
  const mgTip: Vec2 = { x: O.x, y: O.y - WLEN };
  const nTip = add(surf, arrow(nrm, N));
  const appDir = applied >= 0 ? u : dn;
  const appTail = lane(1);                            // above the box
  const appTip = add(appTail, arrow(appDir, Math.abs(applied)));
  const fricDir = frictionUp >= 0 ? u : dn;
  const fricTail = lane(-1);                          // below the box
  const fricTip = add(fricTail, arrow(fricDir, Math.abs(frictionUp)));
  const gravTip = add(O, arrow(dn, gravAlong));       // mg sinθ (centre lane)

  useFrameLoop((f) => {
    if (startRef.current === null) startRef.current = f.timeMs;
    const t = (f.timeMs - startRef.current) / 1000;
    const np = p0.current + (0.5 * aSigned * t * t) / L;   // signed: up or down
    if (np <= 0 || np >= 1) {
      setP(Math.max(0, Math.min(1, np)));
      setSliding(false);
      setLanded(true);
    } else setP(np);
  }, { running: sliding && inView });

  const release = (): void => {
    if (held) return;
    p0.current = p; startRef.current = null;
    if (reduce) { setP(slidesUp ? 1 : 0); setLanded(true); return; }
    setSliding(true);
  };
  const reset = (set: (n: number) => void) => (n: number): void => { set(n); setSliding(false); setP(0.55); p0.current = 0.55; setLanded(false); };

  const view = { xMin: -2.0, xMax: L + 3.9, yMin: -3.2, yMax: L + 1 };

  const figure = (
    <div ref={viewRef} className="lab-playwrap" style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <Stage view={view} height={300} preserveAspect ariaLabel={`Ramp at ${deg} degrees, applied force ${applied} newtons; ${held ? 'held by friction' : `sliding ${slidesUp ? 'up' : 'down'} at ${a.toFixed(1)} metres per second squared`}`}>
          <Segment from={{ x: -3, y: 0 }} to={{ x: L + 1, y: 0 }} color="var(--stage-fg)" opacity={0.5} weight={2} />
          <Polygon points={[{ x: 0, y: 0 }, baseCorner, Ctop]} color="var(--stage-metal)" fill="var(--stage-metal)" fillOpacity={0.16} weight={2} />
          <AngleArc at={{ x: 0, y: 0 }} from={{ x: 1, y: 0 }} to={u} rPx={30} label={`${deg}°`} color="var(--stage-fg)" />
          <Polygon points={crate} color="color-mix(in oklab, var(--stage-accent-2) 60%, black)" fill="var(--stage-accent-2)" fillOpacity={0.9} weight={1.5} />

          {/* weight mg (down) + normal N (out), non-collinear with the slope */}
          <Vector tail={O} tip={mgTip} color={C_MG} weight={2.5} />
          <Label {...beyond(mgTip, { x: 0, y: -1 })} text={`mg ${W.toFixed(0)}N`} color={C_MG} size={11} />
          <Vector tail={surf} tip={nTip} color={C_N} weight={2.5} />
          <Label {...beyond(nTip, nrm)} text={comps ? `N = mg cosθ ${N.toFixed(0)}N` : `N ${N.toFixed(0)}N`} color={C_N} size={11} />

          {/* gravity's down-slope share (components mode), centre lane */}
          {comps && gravAlong > 0.5 && (
            <>
              <Vector tail={O} tip={gravTip} color={C_GRAV} weight={2.5} />
              <Label {...beyond(gravTip, dn)} text={`mg sinθ ${gravAlong.toFixed(0)}N`} color={C_GRAV} size={11} />
              <RightAngleMark at={surf} u={u} v={nrm} />
            </>
          )}

          {/* friction, its own lane below the box (direction = whichever way it resists) */}
          {Math.abs(frictionUp) > 0.5 && (
            <>
              <Vector tail={fricTail} tip={fricTip} color={C_FRIC} weight={2.5} />
              <Label {...beyond(fricTip, fricDir)} text={`${held ? 'fₛ' : 'fₖ'} ${Math.abs(frictionUp).toFixed(0)}N`} color={C_FRIC} size={11} />
            </>
          )}

          {/* applied push/pull, its own lane above the box */}
          {Math.abs(applied) > 0.5 && (
            <>
              <Vector tail={appTail} tip={appTip} color={C_APPLIED} weight={3} />
              <Label {...beyond(appTip, appDir)} text={`push ${Math.abs(applied).toFixed(0)}N`} color={C_APPLIED} size={11} />
            </>
          )}
      </Stage>
    </div>
  );

  const aside = (
    <>
      {/* ── force ledger: every along-slope force, summing to the net ── */}
      <div style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--stage-grid)', background: 'color-mix(in oklab, var(--stage-fg) 3%, transparent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--stage-muted)', marginBottom: 6 }}>
          <span>← down-slope</span><span>sum of forces along the ramp</span><span>up-slope →</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <LedgerBar label="gravity" v={-gravAlong} max={ledgerMax} color={C_GRAV} />
          <LedgerBar label="applied" v={applied} max={ledgerMax} color={C_APPLIED} />
          <LedgerBar label={held ? 'friction (static)' : 'friction (kinetic)'} v={frictionUp} max={ledgerMax} color={C_FRIC} />
          <LedgerBar label="= net" v={held ? 0 : net} max={ledgerMax} color={held ? 'var(--stage-good)' : C_NET} bold />
        </div>
      </div>
      <LiveRegion>{`At ${deg} degrees with ${applied} newtons applied: net ${held ? 0 : net.toFixed(0)} newtons, ${held ? 'held by friction' : `slides ${slidesUp ? 'up' : 'down'} at ${a.toFixed(1)} metres per second squared`}.`}</LiveRegion>
    </>
  );

  const controls = (
    <>
      <ControlBar>
        <Control name="release"><CheckButton onClick={release} disabled={held}>▶ Release</CheckButton></Control>
        <Control name="components"><Chip selected={comps} onClick={() => setComps((c) => !c)}>components</Chip></Control>
        <StatusPill ok={!held}>{held ? 'balanced, friction holds it' : `slides ${slidesUp ? 'up' : 'down'} · a = ${a.toFixed(1)} m/s²`}</StatusPill>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 14, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          <span style={{ color: C_N }}>N {N.toFixed(0)}</span>
          <span style={{ color: C_FRIC }}>fₛ max {fsMax.toFixed(0)}</span>
        </span>
      </ControlBar>
      <ControlBar>
        <Field label="angle" name="angle" value={`${deg}°`}><Slider value={deg} min={0} max={75} step={1} onChange={reset(setDeg)} ariaLabel="incline angle (degrees)" /></Field>
        <Field label="push" name="push" value={applied === 0 ? '0' : `${Math.abs(applied)}N ${applied > 0 ? '↑' : '↓'}`}><Slider value={applied} min={-30} max={30} step={1} onChange={reset(setApplied)} ariaLabel="applied force along the slope (newtons; positive up)" /></Field>
        <Field label="mass" name="mass" value={`${m} kg`}><Slider value={m} min={1} max={10} step={0.5} onChange={reset(setM)} ariaLabel="crate mass (kg)" /></Field>
      </ControlBar>
      <ControlBar>
        <Field label="μₛ static" name="frictionStatic" value={mus.toFixed(2)}><Slider value={mus} min={0} max={1} step={0.05} onChange={reset(setMus)} ariaLabel="static friction coefficient" /></Field>
        <Field label="μₖ kinetic" name="frictionKinetic" value={muk.toFixed(2)}><Slider value={mukRaw} min={0} max={1} step={0.05} onChange={reset(setMuk)} ariaLabel="kinetic friction coefficient" /></Field>
      </ControlBar>
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} controlConfig={controlConfig}>{figure}</LabFrame>;
}
