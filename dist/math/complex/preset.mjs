'use client';

import { StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { CoordPlane } from "../../kit/coords.mjs";
import { I, abs, arg, argDeg, eq, isFiniteC, mul, powInt, rootsOfUnity, toStr } from "./core.mjs";
import { useEffect, useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Circle, Dot, Label, MovableDot, Polyline, Segment } from "@classytic/stage";

//#region src/math/complex/preset.tsx
/**
* ComplexPlaneLab, the Argand-diagram playground built on the complex kernel. A
* complex number is a POINT (a + bi) you drag; the lab draws it as a vector from
* the origin so the SAME (x, y) → (r, θ) story the vector labs teach now reads as
* "modulus and argument". Modes turn the abstract into the visible:
*   • point    , drag z: see a, b, the modulus r = √(a²+b²), and the angle θ in
*                BOTH degrees and radians.
*   • multiply , also plot i·z, the 90° ROTATION that makes i² = −1 obvious
*                (rotate 90° twice = 180° = −1).
*   • power    , plot z, z², z³, , De Moivre as a spiral (moduli multiply,
*                angles add).
*   • roots    , the n nth-roots of unity equally spaced on the unit circle
*                (n = 4 → 1, i, −1, −i; n = 3 → 1, ω, ω²).
*/
const clampNum = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmt$1 = (n, dp = 2) => {
	const r = Math.round(n * 10 ** dp) / 10 ** dp;
	return (Object.is(r, -0) ? 0 : r).toString().replace(/^-/, "−");
};
/** Points along the angle arc from the +Re axis to θ, at radius `r`. */
function arc(theta, r) {
	const n = 28;
	return Array.from({ length: 29 }, (_, i) => {
		const t = theta * i / n;
		return {
			x: r * Math.cos(t),
			y: r * Math.sin(t)
		};
	});
}
const rootLabel = (k, n) => n === 4 ? [
	"1",
	"i",
	"−1",
	"−i"
][k] : n === 2 ? ["1", "−1"][k] : k === 0 ? "1" : k === 1 ? "ω" : `ω${k === 2 ? "²" : k === 3 ? "³" : "^" + k}`;
function ComplexPlaneLab(props = {}) {
	const { mode = "point", rootsN = 4, powerN = 3, snap = 1, range = 6, target, height = 380, title = "The complex plane", prompt = mode === "roots" ? "The nth-roots of unity, equally spaced on the unit circle." : mode === "multiply" ? "Drag z. Multiplying by i rotates it 90° — do it twice and you land on −z." : "Drag the point. Read off a + bi, the modulus r, and the angle θ.", activity = "complex-plane" } = props;
	const snapV = (p) => {
		const s = snap > 0 ? {
			x: Math.round(p.x / snap) * snap,
			y: Math.round(p.y / snap) * snap
		} : p;
		return {
			x: clampNum(s.x, -range, range),
			y: clampNum(s.y, -range, range)
		};
	};
	const start0 = () => snapV({
		x: props.start?.re ?? (mode === "roots" ? 0 : 3),
		y: props.start?.im ?? (mode === "roots" ? 0 : 2)
	});
	const [z, setZ] = useState(start0);
	useEffect(() => {
		setZ(start0());
	}, [
		props.start?.re,
		props.start?.im,
		mode,
		range
	]);
	const Z = {
		re: z.x,
		im: z.y
	};
	const r = abs(Z);
	const thetaRad = arg(Z);
	const thetaDeg = argDeg(Z);
	const solved = target != null && eq(Z, {
		re: target.re,
		im: target.im
	}, 1e-6);
	useCheckpoint({
		solved,
		activity,
		response: toStr(Z)
	});
	const nRoots = clampNum(Math.round(rootsN), 2, 12);
	const nPow = clampNum(Math.round(powerN), 2, 6);
	const roots = useMemo(() => rootsOfUnity(nRoots), [nRoots]);
	const iz = mul(I, Z);
	const powers = useMemo(() => Array.from({ length: nPow }, (_, k) => powInt(Z, k + 1)), [
		Z.re,
		Z.im,
		nPow
	]);
	const view = {
		xMin: -range,
		xMax: range,
		yMin: -range,
		yMax: range
	};
	const accent = solved ? "var(--stage-good)" : "var(--stage-accent)";
	const figure = /* @__PURE__ */ jsxs(CoordPlane, {
		view,
		height,
		step: mode === "roots" || mode === "multiply" ? 1 : void 0,
		ariaLabel: `Argand plane, z = ${toStr(Z)}`,
		children: [
			/* @__PURE__ */ jsx(Circle, {
				center: {
					x: 0,
					y: 0
				},
				r: 1,
				color: "var(--stage-muted)",
				weight: 1,
				fill: "none",
				opacity: .5
			}),
			/* @__PURE__ */ jsx(Label, {
				x: range - .3,
				y: 0,
				text: "Re",
				color: "var(--stage-muted)",
				size: 12,
				dy: -10
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 0,
				y: range - .3,
				text: "Im",
				color: "var(--stage-muted)",
				size: 12,
				dx: 14
			}),
			mode === "roots" && roots.map((w, k) => /* @__PURE__ */ jsxs("g", { children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: 0
					},
					to: {
						x: w.re,
						y: w.im
					},
					color: "var(--stage-good)",
					weight: 1.5,
					opacity: .55
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: w.re,
					y: w.im,
					r: 5,
					color: "var(--stage-good)"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: w.re,
					y: w.im,
					text: rootLabel(k, nRoots),
					color: "var(--stage-good)",
					size: 13,
					dx: w.re >= 0 ? 12 : -12,
					dy: w.im >= 0 ? -8 : 14,
					anchor: w.re >= 0 ? "start" : "end"
				})
			] }, k)),
			mode === "power" && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Polyline, {
				points: [{
					x: 0,
					y: 0
				}, ...powers.filter(isFiniteC).map((p) => ({
					x: p.re,
					y: p.im
				}))],
				color: "var(--stage-accent-2)",
				weight: 1.5,
				opacity: .5,
				dashed: true
			}), powers.map((p, k) => isFiniteC(p) && /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx(Dot, {
				x: p.re,
				y: p.im,
				r: 4,
				color: "var(--stage-accent-2)"
			}), /* @__PURE__ */ jsx(Label, {
				x: p.re,
				y: p.im,
				text: `z${[
					"",
					"²",
					"³",
					"⁴",
					"⁵",
					"⁶"
				][k]}`,
				color: "var(--stage-accent-2)",
				size: 12,
				dy: -10
			})] }, k))] }),
			mode !== "roots" && (z.x !== 0 || z.y !== 0) && /* @__PURE__ */ jsxs(Fragment$1, { children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: 0
					},
					to: z,
					color: accent,
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(Polyline, {
					points: arc(thetaRad, Math.min(.9, r * .45) + .4),
					color: "var(--stage-muted)",
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Label, {
					x: Math.cos(thetaRad / 2) * 1.05,
					y: Math.sin(thetaRad / 2) * 1.05,
					text: "θ",
					color: "var(--stage-muted)",
					size: 13
				}),
				/* @__PURE__ */ jsx(Label, {
					x: z.x / 2,
					y: z.y / 2,
					text: `r=${fmt$1(r)}`,
					color: accent,
					size: 12,
					dx: z.y >= 0 ? 10 : -10,
					dy: z.x >= 0 ? -8 : 14,
					anchor: z.y >= 0 ? "start" : "end"
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: z,
					to: {
						x: z.x,
						y: 0
					},
					color: "var(--stage-grid)",
					weight: 1.25,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: z,
					to: {
						x: 0,
						y: z.y
					},
					color: "var(--stage-grid)",
					weight: 1.25,
					dashed: true
				})
			] }),
			mode === "multiply" && (z.x !== 0 || z.y !== 0) && /* @__PURE__ */ jsxs(Fragment$1, { children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: 0
					},
					to: {
						x: iz.re,
						y: iz.im
					},
					color: "var(--stage-accent-2)",
					weight: 2,
					opacity: .85,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: iz.re,
					y: iz.im,
					r: 6,
					color: "var(--stage-accent-2)"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: iz.re,
					y: iz.im,
					text: "i·z",
					color: "var(--stage-accent-2)",
					size: 12,
					dy: -12
				})
			] }),
			mode !== "roots" && target != null && !solved && /* @__PURE__ */ jsx(Dot, {
				x: target.re,
				y: target.im,
				r: 9,
				color: "var(--stage-good)",
				opacity: .35
			}),
			mode !== "roots" && /* @__PURE__ */ jsx(MovableDot, {
				value: z,
				onMove: (p) => setZ(snapV(p)),
				snap,
				step: snap || 1,
				color: accent,
				r: 9,
				ariaLabel: "complex number z, drag it"
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: mode === "roots" ? /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsxs("span", {
			style: {
				fontWeight: 700,
				fontSize: 15
			},
			children: [
				"z",
				/* @__PURE__ */ jsx("sup", { children: nRoots }),
				" = 1 has ",
				nRoots,
				" roots"
			]
		}), /* @__PURE__ */ jsxs("span", {
			style: {
				opacity: .85,
				fontVariantNumeric: "tabular-nums"
			},
			children: [
				"spaced ",
				fmt$1(360 / nRoots, 1),
				"° apart on the unit circle"
			]
		})] }) : /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsxs("span", {
				style: {
					fontWeight: 700,
					fontSize: 16,
					fontVariantNumeric: "tabular-nums"
				},
				children: ["z = ", toStr(Z)]
			}),
			/* @__PURE__ */ jsxs("span", {
				style: {
					opacity: .85,
					fontVariantNumeric: "tabular-nums"
				},
				children: ["|z| = ", fmt$1(r)]
			}),
			/* @__PURE__ */ jsxs("span", {
				style: {
					opacity: .85,
					fontVariantNumeric: "tabular-nums"
				},
				children: [
					"arg = ",
					fmt$1(thetaDeg, 1),
					"° = ",
					fmt$1(thetaRad),
					" rad"
				]
			}),
			mode === "multiply" && /* @__PURE__ */ jsxs("span", {
				style: { opacity: .85 },
				children: ["i·z = ", toStr(iz)]
			}),
			target != null && /* @__PURE__ */ jsx(StatusPill, {
				ok: solved,
				children: solved ? `✓ ${toStr({
					re: target.re,
					im: target.im
				})}` : `target ${toStr({
					re: target.re,
					im: target.im
				})}`
			})
		] }),
		children: figure
	});
}

//#endregion
export { ComplexPlaneLab };