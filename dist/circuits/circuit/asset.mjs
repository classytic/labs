'use client';

import { num } from "../../core/util.mjs";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { StageAssetDefs, registerAsset, useCoords } from "@classytic/stage";
import { solveDC } from "@classytic/stage/circuit";

//#region src/circuits/circuit/asset.tsx
const TYPE = {
	1: "resistor",
	2: "bulb",
	3: "switch"
};
const REF_V = 6;
const XL = -3.2;
const XR = 3.2;
const ROW_GAP = 1.5;
const RETURN_DROP = 2.2;
const numOr = (v, d) => typeof v === "number" && Number.isFinite(v) ? v : typeof v === "boolean" ? v ? 1 : 0 : d;
/**
* Solve the branch-list network through the ONE circuit engine (@classytic/stage/circuit
* MNA): parallel branches between the left bus (node 1) and the ground return (node 0),
* each a series chain with its own internal nodes; closed switch = near-zero R, open
* branch = omitted. Returns the totals + per-branch current read back from node voltages.
*/
function solveNetwork(raw, nBranch, emf, internalR) {
	const elems = [];
	let node = 2;
	if (internalR > 1e-9) {
		const bn = node++;
		elems.push({
			kind: "V",
			n1: bn,
			n2: 0,
			value: emf,
			id: "batt"
		});
		elems.push({
			kind: "R",
			n1: bn,
			n2: 1,
			value: internalR
		});
	} else elems.push({
		kind: "V",
		n1: 1,
		n2: 0,
		value: emf,
		id: "batt"
	});
	const branchOf = (b) => raw.filter((r) => r.branch === b).sort((a, c) => a.pos - c.pos);
	const first = [];
	for (let b = 0; b < nBranch; b++) {
		const chain = branchOf(b);
		if (chain.length === 0 || chain.some((r) => r.type === "switch" && !r.closed)) {
			first[b] = null;
			continue;
		}
		let prev = 1;
		let f = null;
		chain.forEach((r, idx) => {
			const nb = idx === chain.length - 1 ? 0 : node++;
			const R = r.type === "switch" ? 1e-6 : Math.max(1e-9, r.ohms);
			elems.push({
				kind: "R",
				n1: prev,
				n2: nb,
				value: R
			});
			if (!f) f = {
				a: prev,
				b: nb,
				R
			};
			prev = nb;
		});
		first[b] = f;
	}
	const sol = solveDC(elems);
	const V = sol.nodeV;
	return {
		Itotal: Math.abs(sol.current["batt"] ?? 0),
		branchI: first.map((f) => f ? Math.abs(((V[f.a] ?? 0) - (V[f.b] ?? 0)) / f.R) : 0)
	};
}
function resolver({ params, bound }) {
	const nComp = Math.max(0, Math.round(num(params.nComp, 0)));
	const nBranch = Math.max(1, Math.round(num(params.nBranch, 1)));
	const internalR = Math.max(0, num(params.internalR, 0));
	const emf = Math.max(0, numOr(bound.emf, num(params.emf, 6)));
	const goalType = Math.round(num(params.goalType, 0));
	const goalComp = Math.round(num(params.goalComp, -1));
	const goalVal = num(params.goalVal, .1);
	const goalTol = num(params.goalTol, .05);
	const raw = [];
	for (let i = 0; i < nComp; i++) {
		const type = TYPE[Math.round(num(params[`t${i}`], 1))] ?? "resistor";
		const swIdx = Math.round(num(params[`sw${i}`], -1));
		const closed = type !== "switch" ? true : numOr(bound[`k${swIdx}`], 1) >= .5;
		raw.push({
			i,
			type,
			ohms: Math.max(0, num(params[`o${i}`], type === "switch" ? 0 : 1)),
			branch: Math.round(num(params[`b${i}`], 0)),
			pos: num(params[`p${i}`], i),
			closed
		});
	}
	const branchOf = (b) => raw.filter((r) => r.branch === b).sort((a, c) => a.pos - c.pos);
	const { Itotal, branchI } = solveNetwork(raw, nBranch, emf, internalR);
	const loopH = (nBranch - 1) * ROW_GAP + RETURN_DROP;
	const yTop = loopH / 2;
	const yReturn = -loopH / 2;
	const PADX = 1.1;
	const comps = [];
	for (let b = 0; b < nBranch; b++) {
		const yb = yTop - b * ROW_GAP;
		const chain = branchOf(b);
		const Ib = branchI[b] ?? 0;
		const m = chain.length;
		chain.forEach((r, idx) => {
			const x = m === 1 ? 0 : -2.1 + (XR - PADX - -2.1) * (idx / (m - 1));
			const R = r.ohms;
			const vDrop = Ib * R;
			const brightness = r.type === "bulb" ? Math.max(0, Math.min(1, vDrop / REF_V)) : 0;
			comps.push({
				type: r.type,
				at: {
					x,
					y: yb
				},
				ohms: R,
				branch: b,
				current: Ib,
				brightness,
				closed: r.closed,
				label: r.type === "switch" ? "" : `${R}Ω`
			});
		});
	}
	const railEnergized = Itotal > 1e-6;
	const wires = [
		{
			pts: [{
				x: XL,
				y: yReturn
			}, {
				x: XL,
				y: yTop
			}],
			energized: railEnergized
		},
		{
			pts: [{
				x: XR,
				y: yReturn
			}, {
				x: XR,
				y: yTop
			}],
			energized: railEnergized
		},
		{
			pts: [{
				x: XL,
				y: yReturn
			}, {
				x: XR,
				y: yReturn
			}],
			energized: railEnergized
		}
	];
	for (let b = 0; b < nBranch; b++) {
		const yb = yTop - b * ROW_GAP;
		wires.push({
			pts: [{
				x: XL,
				y: yb
			}, {
				x: XR,
				y: yb
			}],
			energized: (branchI[b] ?? 0) > 1e-6
		});
	}
	const bulbs = comps.filter((c) => c.type === "bulb");
	let solved = false;
	if (goalType === 0) {
		const t = goalComp >= 0 ? comps[goalComp] : bulbs[0];
		solved = !!t && t.type === "bulb" && t.brightness >= goalVal;
	} else if (goalType === 1) {
		const I = goalComp >= 0 ? comps[goalComp]?.current ?? 0 : Itotal;
		solved = Math.abs(I - goalVal) <= goalTol;
	} else if (goalType === 2) solved = bulbs.length > 0 && bulbs.every((c) => c.brightness >= .1);
	const flowDur = Itotal > 1e-6 ? Math.max(.45, Math.min(3, 1.2 / Itotal)) : 0;
	return {
		kind: "asset-geom",
		parts: { battery: {
			x: 0,
			y: yReturn
		} },
		meta: {
			comps,
			wires,
			emf,
			Itotal,
			Rtot: Itotal > 1e-12 ? emf / Itotal : -1,
			solved,
			flowDur,
			energized: railEnergized
		}
	};
}
function Component({ geom }) {
	const c = useCoords();
	const p = geom.parts;
	const m = geom.meta ?? {};
	const P = (v) => c.toPx(v.x, v.y);
	const HALF = 22;
	const wirePath = (w) => w.pts.map((v) => P(v).join(",")).join(" ");
	const renderComp = (comp, i) => {
		const [cx, cy] = P(comp.at);
		if (comp.type === "resistor") {
			const h = 11;
			return /* @__PURE__ */ jsxs("g", { children: [
				/* @__PURE__ */ jsx("rect", {
					x: cx - HALF,
					y: cy - h,
					width: HALF * 2,
					height: h * 2,
					rx: 3,
					fill: "var(--stage-bg)",
					stroke: "var(--stage-accent)",
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: cx - HALF,
					cy,
					r: 2.5,
					fill: "var(--stage-metal)"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: cx + HALF,
					cy,
					r: 2.5,
					fill: "var(--stage-metal)"
				}),
				/* @__PURE__ */ jsx("text", {
					x: cx,
					y: cy - h - 6,
					fill: "var(--stage-fg)",
					fontSize: 11,
					fontWeight: 600,
					textAnchor: "middle",
					children: comp.label
				})
			] }, i);
		}
		if (comp.type === "bulb") {
			const r = 15;
			const glow = comp.brightness;
			const lit = glow > .02;
			const fill = lit ? `color-mix(in oklab, var(--stage-warn) ${Math.round(glow * 90)}%, var(--stage-bg))` : "var(--stage-bg)";
			const d = r * .72;
			const cross = lit ? "var(--stage-sheen)" : "var(--stage-metal)";
			const crossOp = lit ? .95 : .65;
			return /* @__PURE__ */ jsxs("g", { children: [
				lit && /* @__PURE__ */ jsx("circle", {
					cx,
					cy,
					r: 22 + 8 * glow,
					fill: "var(--stage-warn)",
					opacity: .22 * glow
				}),
				/* @__PURE__ */ jsx("circle", {
					cx,
					cy,
					r,
					fill,
					stroke: "var(--stage-metal)",
					strokeWidth: 1.75
				}),
				/* @__PURE__ */ jsx("line", {
					x1: cx - d,
					y1: cy - d,
					x2: cx + d,
					y2: cy + d,
					stroke: cross,
					strokeWidth: 1.5,
					opacity: crossOp
				}),
				/* @__PURE__ */ jsx("line", {
					x1: cx - d,
					y1: cy + d,
					x2: cx + d,
					y2: cy - d,
					stroke: cross,
					strokeWidth: 1.5,
					opacity: crossOp
				}),
				/* @__PURE__ */ jsx("text", {
					x: cx,
					y: cy + r + 15,
					fill: "var(--stage-fg)",
					fontSize: 11,
					fontWeight: 600,
					textAnchor: "middle",
					children: comp.label
				})
			] }, i);
		}
		const lev = comp.closed ? {
			x: cx + HALF,
			y: cy
		} : {
			x: cx + HALF * .5,
			y: cy - HALF * .9
		};
		return /* @__PURE__ */ jsxs("g", { children: [
			/* @__PURE__ */ jsx("line", {
				x1: cx - HALF,
				y1: cy,
				x2: cx + HALF,
				y2: cy,
				stroke: "var(--stage-metal)",
				strokeWidth: 0
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: cx - HALF,
				cy,
				r: 3.5,
				fill: "var(--stage-metal)"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: cx + HALF,
				cy,
				r: 3.5,
				fill: "var(--stage-metal)"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: cx - HALF,
				y1: cy,
				x2: lev.x,
				y2: lev.y,
				stroke: comp.closed ? "var(--stage-good)" : "var(--stage-warn)",
				strokeWidth: 3,
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ jsx("text", {
				x: cx,
				y: cy + 22,
				fill: "var(--stage-fg)",
				fontSize: 11,
				textAnchor: "middle",
				children: comp.closed ? "closed" : "open"
			})
		] }, i);
	};
	const [batx, baty] = P(p.battery ?? {
		x: 0,
		y: 0
	});
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(StageAssetDefs, {}),
		/* @__PURE__ */ jsx("style", { children: `@keyframes stage-current-flow{to{stroke-dashoffset:-16}}@media (prefers-reduced-motion:reduce){.stage-current{animation:none!important}}` }),
		/* @__PURE__ */ jsxs("g", { children: [
			m.wires.map((w, i) => /* @__PURE__ */ jsx("polyline", {
				points: wirePath(w),
				fill: "none",
				stroke: "var(--stage-metal)",
				strokeWidth: 2.5,
				strokeLinejoin: "round",
				strokeLinecap: "round"
			}, `w${i}`)),
			m.flowDur > 0 && m.wires.filter((w) => w.energized).map((w, i) => /* @__PURE__ */ jsx("polyline", {
				className: "stage-current",
				points: wirePath(w),
				fill: "none",
				stroke: "var(--stage-good)",
				strokeWidth: 2.5,
				strokeDasharray: "6 10",
				strokeLinecap: "round",
				style: { animation: `stage-current-flow ${m.flowDur}s linear infinite` }
			}, `f${i}`)),
			/* @__PURE__ */ jsxs("g", { children: [
				/* @__PURE__ */ jsx("line", {
					x1: batx - 4,
					y1: baty - 11,
					x2: batx - 4,
					y2: baty + 11,
					stroke: "var(--stage-metal)",
					strokeWidth: 3
				}),
				/* @__PURE__ */ jsx("line", {
					x1: batx + 4,
					y1: baty - 6,
					x2: batx + 4,
					y2: baty + 6,
					stroke: "var(--stage-metal)",
					strokeWidth: 3
				}),
				/* @__PURE__ */ jsxs("text", {
					x: batx,
					y: baty + 24,
					fill: "var(--stage-fg)",
					fontSize: 13,
					fontWeight: 700,
					textAnchor: "middle",
					children: [m.emf, "V"]
				})
			] }),
			m.comps.map(renderComp)
		] })
	] });
}
const CIRCUIT_NETWORK_ASSET = {
	resolver,
	Component
};
registerAsset("circuit-network", CIRCUIT_NETWORK_ASSET);

//#endregion
export { CIRCUIT_NETWORK_ASSET };