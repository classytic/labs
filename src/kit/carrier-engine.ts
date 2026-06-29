'use client';

/**
 * Carrier engine, a small DETERMINISTIC charged-particle core shared by every
 * semiconductor / conduction lab. Carriers (electrons e⁻, holes h⁺) are real
 * entities with a position and a confinement box; each tick they drift under a
 * field (electrons and holes move opposite ways), jitter thermally, and reflect
 * off their region walls so nothing ever floats out of the device. Pairs that
 * meet recombine. Everything is seeded by an integer PRNG advanced by a global
 * step counter, so the simulation is bit-identical on the server and client
 * (no hydration drift) and fully replayable.
 *
 * The engine owns the PHYSICS OF MOTION. Each lab owns the SETUP, where the
 * regions are, which way the field points, how carriers are born and die.
 */

import { useEffect, useRef, useState } from 'react';
import { useFrameLoop } from '@classytic/stage';
import { useReducedMotion } from './anim.js';

export type CType = 'e' | 'h'; // electron / hole

export interface Carrier {
  id: number;
  t: CType;
  x: number;
  y: number;
  /** velocity (px/tick). Persists between frames so motion is smooth, not jittery. */
  vx?: number;
  vy?: number;
  /** home site (px). If set, the carrier jiggles thermally AROUND it (a weak spring) instead
   *  of free-wandering — keeps resident carriers spread on their sites, never clumping. */
  hx?: number;
  hy?: number;
  /** current opacity 0..1 (tweened) so carriers FADE in/out instead of popping. */
  o?: number;
  /** slot index for population control: a carrier is "active" when slot < target. Carriers
   *  with no slot are always active. Lets the pool stay a FIXED size while the visible count
   *  changes (fade), so sliders never rebuild and jump the layout. */
  slot?: number;
  /** immobile (a bound bond electron, a fixed dopant ion, a trapped carrier). */
  fixed?: boolean;
  /** optional per-carrier confinement box (else the world bounds are used). */
  box?: Box;
}

export interface Box { x: number; y: number; w: number; h: number }

/** integer-only PRNG (no Math.sin/Math.random) → identical on server + client. */
export const rand = (a: number, b: number): number => {
  let x = (Math.imul(a + 1, 73856093) ^ Math.imul(b + 1, 19349663)) >>> 0;
  x ^= x >>> 13; x = Math.imul(x, 1274126177) >>> 0; x ^= x >>> 16;
  return (x % 100000) / 100000;
};

/** A deterministic, EVENLY-spread point inside a box from a seed. Uses the R2 low-
 *  discrepancy sequence (plastic constant) so consecutive seeds (0,1,2,…) scatter across
 *  the whole box instead of clumping — a plain hash clusters consecutive seeds. */
export const inBox = (b: Box, seed: number, pad = 8): { x: number; y: number } => {
  const fx = (0.5 + 0.7548776662466927 * seed) % 1;
  const fy = (0.5 + 0.5698402909980532 * seed) % 1;
  return { x: b.x + pad + fx * Math.max(1, b.w - 2 * pad), y: b.y + pad + fy * Math.max(1, b.h - 2 * pad) };
};

export interface DriftCfg {
  /** target drift velocity per tick (px). Electrons relax toward it, holes the OPPOSITE way. */
  drift?: { x: number; y: number };
  /** thermal random-walk magnitude (px/tick) added as small velocity kicks. */
  jitter?: number;
  /** global speed multiplier. */
  speed?: number;
  /** velocity retention 0..1 (momentum). Higher = smoother, more gliding motion. Default 0.86. */
  damp?: number;
  /** spring strength pulling a carrier toward its home (if it has one). Keeps resident
   *  carriers jiggling on their sites instead of wandering off and clumping. Default 0. */
  spring?: number;
  /** when false, ALL carriers drift the same way regardless of type (a directed stream,
   *  e.g. a channel or emitter→collector flow, where the motion is the current itself).
   *  Default true (electrons and holes drift oppositely under a field). */
  signed?: boolean;
}

/**
 * Advance carriers one tick with MOMENTUM: velocity persists and relaxes toward the drift
 * target while taking small random thermal kicks, then position integrates from velocity.
 * The persistent velocity is what makes carriers glide and wander smoothly instead of
 * vibrating in place. Walls bounce (velocity flips); everything stays inside its box. Pure.
 */
export function stepCarriers(cs: Carrier[], step: number, bounds: Box, f: DriftCfg): Carrier[] {
  const sp = f.speed ?? 1, jit = f.jitter ?? 0;
  const dx = f.drift?.x ?? 0, dy = f.drift?.y ?? 0;
  const signed = f.signed ?? true;
  const damp = f.damp ?? 0.86;
  const spring = f.spring ?? 0;
  return cs.map((c) => {
    if (c.fixed) return c;
    const dir = !signed ? 1 : c.t === 'e' ? 1 : -1;
    // velocity = momentum + pull toward the drift target + a small random kick, plus a
    // weak spring back toward the home site (if any) so resident carriers don't drift away.
    let vx = (c.vx ?? 0) * damp + (1 - damp) * dx * dir + (rand(c.id, step) - 0.5) * jit;
    let vy = (c.vy ?? 0) * damp + (1 - damp) * dy * dir + (rand(c.id, step * 2 + 7) - 0.5) * jit;
    if (spring && c.hx !== undefined) vx += (c.hx - c.x) * spring;
    if (spring && c.hy !== undefined) vy += (c.hy - c.y) * spring;
    let x = c.x + vx * sp, y = c.y + vy * sp;
    const b = c.box ?? bounds;
    // bounce: mirror the overshoot back INSIDE (not clamp to the wall, which pins slow
    // carriers and turns corners into traps) and flip velocity so it heads inward.
    if (x < b.x) { x = 2 * b.x - x; vx = Math.abs(vx); }
    else if (x > b.x + b.w) { x = 2 * (b.x + b.w) - x; vx = -Math.abs(vx); }
    if (y < b.y) { y = 2 * b.y - y; vy = Math.abs(vy); }
    else if (y > b.y + b.h) { y = 2 * (b.y + b.h) - y; vy = -Math.abs(vy); }
    // safety clamp only for a pathological overshoot larger than the box
    x = Math.max(b.x, Math.min(b.x + b.w, x));
    y = Math.max(b.y, Math.min(b.y + b.h, y));
    return { ...c, x, y, vx, vy };
  });
}

/** Tween every carrier's opacity toward active(1)/inactive(0) so the visible population
 *  changes by FADING, not by rebuilding the pool. A carrier is active when it has no slot
 *  or its slot < `target`. Call inside advance after stepCarriers. */
export function tweenOpacity(cs: Carrier[], target: number, rate = 0.1): Carrier[] {
  return cs.map((c) => {
    const want = c.slot === undefined || c.slot < target ? 1 : 0;
    return { ...c, o: (c.o ?? want) + (want - (c.o ?? want)) * rate };
  });
}

/** Recombine free e⁻/h⁺ pairs within `r` px. With `respawn`, each partner is reborn at a
 *  fresh site (steady population, e.g. thermal generation⇄recombination); without it the
 *  pair is removed. */
export function recombine(cs: Carrier[], r: number, step: number, respawn?: (c: Carrier, step: number) => Partial<Carrier>): Carrier[] {
  if (!r) return cs;
  const r2 = r * r;
  const hit = new Set<number>();
  const es = cs.filter((c) => c.t === 'e' && !c.fixed);
  const hs = cs.filter((c) => c.t === 'h' && !c.fixed);
  for (const e of es) for (const h of hs) {
    if (hit.has(e.id) || hit.has(h.id)) continue;
    if ((e.x - h.x) ** 2 + (e.y - h.y) ** 2 < r2) { hit.add(e.id); hit.add(h.id); }
  }
  if (!hit.size) return cs;
  if (!respawn) return cs.filter((c) => !hit.has(c.id));
  return cs.map((c) => (hit.has(c.id) ? { ...c, ...respawn(c, step) } : c));
}

/**
 * Drive a carrier simulation: holds the pool, advances it each frame via `advance`, and
 * RESETS to a fresh `init()` whenever `resetKey` changes (mode / dopant / topology). The
 * server and first client render both show step 0 of `init()` (deterministic) → no
 * hydration mismatch.
 */
export function useCarrierSim(
  init: () => Carrier[],
  advance: (cs: Carrier[], step: number) => Carrier[],
  running: boolean,
  resetKey: string,
): Carrier[] {
  const reduce = useReducedMotion();
  const [cs, setCs] = useState<Carrier[]>(init);
  const stepRef = useRef(0);
  const initRef = useRef(init);
  const advanceRef = useRef(advance);
  initRef.current = init;
  advanceRef.current = advance; // always step with the latest config (bias, gate, …)

  useEffect(() => { stepRef.current = 0; setCs(initRef.current()); }, [resetKey]);

  useFrameLoop(() => {
    stepRef.current += 1;
    setCs((prev) => advanceRef.current(prev, stepRef.current));
  }, { running: running && !reduce });

  return cs;
}
