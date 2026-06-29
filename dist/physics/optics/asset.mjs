'use client';

import { jsx, jsxs } from "react/jsx-runtime";
import { isLineVal, isVec2, registerAsset, useCoords, vec } from "@classytic/stage";

//#region src/physics/optics/asset.tsx
const n = (v, d) => typeof v === "number" && Number.isFinite(v) ? v : d;
const asVec = (v, d) => isVec2(v) ? v : d;
const cross = (a, b) => a.x * b.y - a.y * b.x;
function rayHitsSegment(P, d, m) {
	const s = vec.sub(m.b, m.a);
	const denom = cross(d, s);
	if (Math.abs(denom) < 1e-9) return null;
	const qp = vec.sub(m.a, P);
	const t = cross(qp, s) / denom;
	const u = cross(qp, d) / denom;
	if (t > 1e-6 && u >= 0 && u <= 1) return t;
	return null;
}
function rayHitsTarget(P, d, target, R, maxT) {
	const tProj = Math.max(0, Math.min(maxT, vec.dot(vec.sub(target, P), d)));
	const cp = {
		x: P.x + d.x * tProj,
		y: P.y + d.y * tProj
	};
	return vec.dist(cp, target) <= R ? cp : null;
}
function resolver({ params, bound }) {
	const source = asVec(bound.source, {
		x: -5,
		y: -2
	});
	const aim = isVec2(bound.aim) ? bound.aim : null;
	const target = isVec2(bound.target) ? bound.target : null;
	const dir0 = aim ? vec.normalize(vec.sub(aim, source)) : vec.normalize(asVec(params.dir, {
		x: 1,
		y: 0
	}));
	const maxBounces = n(params.maxBounces, 8);
	const targetR = n(params.targetR, .5);
	const far = n(params.far, 60);
	const mirrors = Object.keys(bound).filter((k) => /^m\d+$/.test(k)).map((k) => bound[k]).filter(isLineVal);
	const pts = [source];
	let P = source;
	let d = dir0;
	let hit = false;
	let bounces = 0;
	for (let b = 0; b <= maxBounces; b++) {
		let bestT = Infinity;
		let bestMirror = null;
		for (const m of mirrors) {
			const t = rayHitsSegment(P, d, m);
			if (t != null && t < bestT) {
				bestT = t;
				bestMirror = m;
			}
		}
		const maxT = bestMirror ? bestT : far;
		if (target) {
			const th = rayHitsTarget(P, d, target, targetR, maxT);
			if (th) {
				pts.push(th);
				hit = true;
				break;
			}
		}
		if (!bestMirror) {
			pts.push({
				x: P.x + d.x * far,
				y: P.y + d.y * far
			});
			break;
		}
		const hp = {
			x: P.x + d.x * bestT,
			y: P.y + d.y * bestT
		};
		pts.push(hp);
		const along = vec.normalize(vec.sub(bestMirror.b, bestMirror.a));
		const nrm = {
			x: -along.y,
			y: along.x
		};
		d = vec.normalize(vec.sub(d, vec.scale(nrm, 2 * vec.dot(d, nrm))));
		P = {
			x: hp.x + d.x * 1e-4,
			y: hp.y + d.y * 1e-4
		};
		bounces++;
	}
	return {
		kind: "asset-geom",
		parts: {
			ray: pts,
			sourceAt: source,
			...target ? { targetAt: target } : {}
		},
		meta: {
			hit,
			bounces,
			dir0,
			mirrors: mirrors.map((m) => ({
				a: m.a,
				b: m.b
			}))
		}
	};
}
function Component({ geom }) {
	const c = useCoords();
	const P = (v) => c.toPx(v.x, v.y);
	const ray = geom.parts.ray ?? [];
	const sourceAt = geom.parts.sourceAt;
	const targetAt = geom.parts.targetAt;
	const meta = geom.meta ?? {};
	const hit = meta.hit === true;
	const rayPx = ray.map(P);
	const rayStr = rayPx.map((p) => p.join(",")).join(" ");
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		children: [
			(meta.mirrors ?? []).map((m, i) => {
				const a = P(m.a), b = P(m.b);
				const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
				const nx = -dy / len, ny = dx / len;
				const ticks = Math.max(3, Math.floor(len / 16));
				const HL = 9;
				return /* @__PURE__ */ jsxs("g", { children: [Array.from({ length: ticks }, (_, k) => {
					const s = (k + .5) / ticks;
					const px = a[0] + dx * s, py = a[1] + dy * s;
					return /* @__PURE__ */ jsx("line", {
						x1: px,
						y1: py,
						x2: px + nx * HL,
						y2: py + ny * HL,
						stroke: "var(--stage-metal)",
						strokeWidth: 1.5,
						opacity: .7
					}, k);
				}), /* @__PURE__ */ jsx("line", {
					x1: a[0],
					y1: a[1],
					x2: b[0],
					y2: b[1],
					stroke: "var(--stage-sheen)",
					strokeWidth: 3,
					strokeLinecap: "round",
					opacity: .92
				})] }, i);
			}),
			rayPx.length > 1 && /* @__PURE__ */ jsx("polyline", {
				points: rayStr,
				fill: "none",
				stroke: "var(--stage-warn)",
				strokeWidth: 7,
				opacity: .18,
				strokeLinejoin: "round",
				strokeLinecap: "round"
			}),
			rayPx.length > 1 && /* @__PURE__ */ jsx("polyline", {
				points: rayStr,
				fill: "none",
				stroke: "var(--stage-warn)",
				strokeWidth: 2.5,
				strokeLinejoin: "round",
				strokeLinecap: "round"
			}),
			targetAt && (() => {
				const [tx, ty] = P(targetAt);
				const R = c.sx(.6);
				return /* @__PURE__ */ jsxs("g", { children: [
					hit && /* @__PURE__ */ jsx("circle", {
						cx: tx,
						cy: ty,
						r: R * 1.8,
						fill: "var(--stage-good)",
						opacity: .25
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: tx,
						cy: ty,
						r: R,
						fill: "none",
						stroke: hit ? "var(--stage-good)" : "var(--stage-metal)",
						strokeWidth: 2
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: tx,
						cy: ty,
						r: R * .45,
						fill: hit ? "var(--stage-good)" : "var(--stage-metal)",
						opacity: hit ? 1 : .55
					})
				] });
			})(),
			sourceAt && (() => {
				const [sx, sy] = P(sourceAt);
				const r = c.sx(.34);
				return /* @__PURE__ */ jsxs("g", { children: [
					/* @__PURE__ */ jsx("circle", {
						cx: sx,
						cy: sy,
						r: r * 2.4,
						fill: "var(--stage-warn)",
						opacity: .2
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: sx,
						cy: sy,
						r,
						fill: "var(--stage-warn)",
						stroke: "var(--stage-metal)",
						strokeWidth: 1.5
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: sx,
						cy: sy,
						r: r * .45,
						fill: "var(--stage-sheen)",
						opacity: .95
					})
				] });
			})()
		]
	});
}
const OPTICS_RAY_ASSET = {
	resolver,
	Component
};
registerAsset("optics-ray", OPTICS_RAY_ASSET);

//#endregion
export { OPTICS_RAY_ASSET };