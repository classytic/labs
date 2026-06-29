'use client';

import { useReducedMotion } from "./anim.mjs";
import { useEffect, useRef, useState } from "react";
import { useFrameLoop } from "@classytic/stage";

//#region src/kit/carrier-engine.ts
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
/** integer-only PRNG (no Math.sin/Math.random) → identical on server + client. */
const rand = (a, b) => {
	let x = (Math.imul(a + 1, 73856093) ^ Math.imul(b + 1, 19349663)) >>> 0;
	x ^= x >>> 13;
	x = Math.imul(x, 1274126177) >>> 0;
	x ^= x >>> 16;
	return x % 1e5 / 1e5;
};
/** A deterministic, EVENLY-spread point inside a box from a seed. Uses the R2 low-
*  discrepancy sequence (plastic constant) so consecutive seeds (0,1,2,…) scatter across
*  the whole box instead of clumping — a plain hash clusters consecutive seeds. */
const inBox = (b, seed, pad = 8) => {
	const fx = (.5 + .7548776662466927 * seed) % 1;
	const fy = (.5 + .5698402909980532 * seed) % 1;
	return {
		x: b.x + pad + fx * Math.max(1, b.w - 2 * pad),
		y: b.y + pad + fy * Math.max(1, b.h - 2 * pad)
	};
};
/**
* Advance carriers one tick with MOMENTUM: velocity persists and relaxes toward the drift
* target while taking small random thermal kicks, then position integrates from velocity.
* The persistent velocity is what makes carriers glide and wander smoothly instead of
* vibrating in place. Walls bounce (velocity flips); everything stays inside its box. Pure.
*/
function stepCarriers(cs, step, bounds, f) {
	const sp = f.speed ?? 1, jit = f.jitter ?? 0;
	const dx = f.drift?.x ?? 0, dy = f.drift?.y ?? 0;
	const signed = f.signed ?? true;
	const damp = f.damp ?? .86;
	const spring = f.spring ?? 0;
	return cs.map((c) => {
		if (c.fixed) return c;
		const dir = !signed ? 1 : c.t === "e" ? 1 : -1;
		let vx = (c.vx ?? 0) * damp + (1 - damp) * dx * dir + (rand(c.id, step) - .5) * jit;
		let vy = (c.vy ?? 0) * damp + (1 - damp) * dy * dir + (rand(c.id, step * 2 + 7) - .5) * jit;
		if (spring && c.hx !== void 0) vx += (c.hx - c.x) * spring;
		if (spring && c.hy !== void 0) vy += (c.hy - c.y) * spring;
		let x = c.x + vx * sp, y = c.y + vy * sp;
		const b = c.box ?? bounds;
		if (x < b.x) {
			x = 2 * b.x - x;
			vx = Math.abs(vx);
		} else if (x > b.x + b.w) {
			x = 2 * (b.x + b.w) - x;
			vx = -Math.abs(vx);
		}
		if (y < b.y) {
			y = 2 * b.y - y;
			vy = Math.abs(vy);
		} else if (y > b.y + b.h) {
			y = 2 * (b.y + b.h) - y;
			vy = -Math.abs(vy);
		}
		x = Math.max(b.x, Math.min(b.x + b.w, x));
		y = Math.max(b.y, Math.min(b.y + b.h, y));
		return {
			...c,
			x,
			y,
			vx,
			vy
		};
	});
}
/** Tween every carrier's opacity toward active(1)/inactive(0) so the visible population
*  changes by FADING, not by rebuilding the pool. A carrier is active when it has no slot
*  or its slot < `target`. Call inside advance after stepCarriers. */
function tweenOpacity(cs, target, rate = .1) {
	return cs.map((c) => {
		const want = c.slot === void 0 || c.slot < target ? 1 : 0;
		return {
			...c,
			o: (c.o ?? want) + (want - (c.o ?? want)) * rate
		};
	});
}
/** Recombine free e⁻/h⁺ pairs within `r` px. With `respawn`, each partner is reborn at a
*  fresh site (steady population, e.g. thermal generation⇄recombination); without it the
*  pair is removed. */
function recombine(cs, r, step, respawn) {
	if (!r) return cs;
	const r2 = r * r;
	const hit = /* @__PURE__ */ new Set();
	const es = cs.filter((c) => c.t === "e" && !c.fixed);
	const hs = cs.filter((c) => c.t === "h" && !c.fixed);
	for (const e of es) for (const h of hs) {
		if (hit.has(e.id) || hit.has(h.id)) continue;
		if ((e.x - h.x) ** 2 + (e.y - h.y) ** 2 < r2) {
			hit.add(e.id);
			hit.add(h.id);
		}
	}
	if (!hit.size) return cs;
	if (!respawn) return cs.filter((c) => !hit.has(c.id));
	return cs.map((c) => hit.has(c.id) ? {
		...c,
		...respawn(c, step)
	} : c);
}
/**
* Drive a carrier simulation: holds the pool, advances it each frame via `advance`, and
* RESETS to a fresh `init()` whenever `resetKey` changes (mode / dopant / topology). The
* server and first client render both show step 0 of `init()` (deterministic) → no
* hydration mismatch.
*/
function useCarrierSim(init, advance, running, resetKey) {
	const reduce = useReducedMotion();
	const [cs, setCs] = useState(init);
	const stepRef = useRef(0);
	const initRef = useRef(init);
	const advanceRef = useRef(advance);
	initRef.current = init;
	advanceRef.current = advance;
	useEffect(() => {
		stepRef.current = 0;
		setCs(initRef.current());
	}, [resetKey]);
	useFrameLoop(() => {
		stepRef.current += 1;
		setCs((prev) => advanceRef.current(prev, stepRef.current));
	}, { running: running && !reduce });
	return cs;
}

//#endregion
export { inBox, rand, recombine, stepCarriers, tweenOpacity, useCarrierSim };