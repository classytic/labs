'use client';

import { clamp } from "../../core/util.mjs";
import { Callout, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { CoordPlane, num } from "../../kit/coords.mjs";
import { useEffect, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, MovableDot, Plot, Segment, compileExpr } from "@classytic/stage";

//#region src/math/domain-range/preset.tsx
/**
* DomainRangeLab, domain & range as SHADOWS. The big idea students miss is that
* domain/range aren't formulas to memorise; they're what you SEE when you let the
* curve cast two shadows:
*
*   • shine a light from ABOVE → the curve's shadow on the x-axis is the DOMAIN
*     (every input the function actually accepts), and
*   • shine a light from the SIDE → the shadow on the y-axis is the RANGE
*     (every output it can produce).
*
* On top of that, a "feed the machine" game: drag the input probe along the
* x-axis, it turns GREEN when the machine accepts the input (in the domain) and
* RED "undefined" when it doesn't (a pole like 1/(x−2), a √ of a negative, or an
* author-set restriction). So the SAME lab teaches every domain TYPE just by
* changing the expression: x² (range ≥ 0), √x (x ≥ 0), 1/x (x ≠ 0), √(9−x²)
* (the semicircle: domain [−3,3], range [0,3]), or a restricted interval.
*
* Built on the shared CoordPlane + the stage expr engine; authorable via props
* (equation, an optional domain restriction, a checked question).
*/
const C_DOMAIN = "var(--stage-accent)";
const C_RANGE = "var(--stage-accent-2)";
const C_OK = "var(--stage-good)";
const C_BAD = "var(--stage-danger)";
const N = 1200;
/** Contiguous covered intervals of a sorted value set (split where the gap exceeds `gap`). */
function coveredIntervals(values, gap) {
	const v = values.filter(Number.isFinite).sort((a, b) => a - b);
	if (!v.length) return [];
	const out = [];
	let lo = v[0], prev = v[0];
	for (let i = 1; i < v.length; i++) {
		const x = v[i];
		if (x - prev > gap) {
			out.push([lo, prev]);
			lo = x;
		}
		prev = x;
	}
	out.push([lo, prev]);
	return out;
}
/** Sort + merge overlapping/adjacent intervals. */
function mergeIntervals(iv) {
	const v = iv.filter((x) => x != null).sort((a, b) => a[0] - b[0]);
	const out = [];
	for (const [a, b] of v) {
		const last = out[out.length - 1];
		if (last && a <= last[1] + 1e-6) last[1] = Math.max(last[1], b);
		else out.push([a, b]);
	}
	return out;
}
const fmtIntervals = (rs, eps) => rs.length ? rs.map(([a, b]) => b - a < eps ? `{${num(a)}}` : `[${num(a)}, ${num(b)}]`).join(" ∪ ") : ", ";
function DomainRangeLab({ equation = "sqrt(9 - x^2)", xRange = [-6, 6], yRange = "auto", restrict, probe, title = "Domain and range: the two shadows", prompt = "Drag the input probe: green = the machine accepts it (in the domain), red = undefined. The blue strip is every allowed input; the orange strip is every output.", ask, height = 400, activity = "domain-range" } = {}) {
	const [x0, x1] = xRange;
	const compiled = (() => {
		const c = compileExpr(equation);
		return c.error !== void 0 ? null : c;
	})();
	const inRestrict = (x) => !restrict || x >= restrict[0] - 1e-9 && x <= restrict[1] + 1e-9;
	const f = (x) => compiled && inRestrict(x) ? compiled.fn({ x }) : NaN;
	const dx = (x1 - x0) / N;
	const pts = [];
	for (let i = 0; i <= N; i++) {
		const x = x0 + i * dx;
		const y = f(x);
		if (Number.isFinite(y)) pts.push([x, y]);
	}
	const [yMin, yMax] = (() => {
		if (yRange !== "auto") return yRange;
		if (!pts.length) return [-6, 6];
		const s = pts.map((p) => p[1]).sort((a, b) => a - b);
		const lo = Math.min(0, s[Math.floor(s.length * .02)] ?? -1);
		const hi = Math.max(0, s[Math.floor(s.length * .98)] ?? 1);
		const pad = Math.max(1, (hi - lo) * .12);
		return [lo - pad, hi + pad];
	})();
	const yCap = Math.max(Math.abs(yMin), Math.abs(yMax)) * 3.5;
	const domain = coveredIntervals(pts.filter(([, y]) => Math.abs(y) <= yCap).map(([x]) => x), dx * 2.5);
	const range = mergeIntervals(domain.map(([a, b]) => {
		let mn = Infinity, mx = -Infinity;
		for (const [x, y] of pts) if (x >= a - 1e-9 && x <= b + 1e-9 && y >= yMin && y <= yMax) {
			if (y < mn) mn = y;
			if (y > mx) mx = y;
		}
		return Number.isFinite(mn) ? [mn, mx] : null;
	}));
	const [pxState, setPx] = useState(clamp(probe ?? (x0 + x1) / 2, x0, x1));
	const pX = clamp(pxState, x0, x1);
	const pY = f(pX);
	const accepted = Number.isFinite(pY);
	const visited = useRef({
		min: pX,
		max: pX
	});
	const [swept, setSwept] = useState(false);
	useEffect(() => {
		const v = visited.current;
		if (pX < v.min) v.min = pX;
		if (pX > v.max) v.max = pX;
		if (!swept && v.max - v.min >= (x1 - x0) * .6) setSwept(true);
	}, [
		pX,
		swept,
		x0,
		x1
	]);
	useCheckpoint({
		solved: swept,
		activity
	});
	const figure = /* @__PURE__ */ jsxs(CoordPlane, {
		view: {
			xMin: x0,
			xMax: x1,
			yMin,
			yMax
		},
		height,
		preserveAspect: false,
		ariaLabel: `Domain and range of ${equation}`,
		children: [
			compiled && /* @__PURE__ */ jsx(Plot.OfX, {
				y: f,
				color: "var(--stage-fg)",
				weight: 2.5
			}),
			domain.map(([a, b], i) => /* @__PURE__ */ jsx(Segment, {
				from: {
					x: a,
					y: 0
				},
				to: {
					x: b,
					y: 0
				},
				color: C_DOMAIN,
				weight: 7
			}, `d${i}`)),
			domain.length > 0 && /* @__PURE__ */ jsx(Label, {
				x: domain[0][0],
				y: 0,
				text: "domain",
				color: C_DOMAIN,
				size: 12,
				dy: 18,
				dx: 2,
				anchor: "start"
			}),
			range.map(([a, b], i) => /* @__PURE__ */ jsx(Segment, {
				from: {
					x: 0,
					y: a
				},
				to: {
					x: 0,
					y: b
				},
				color: C_RANGE,
				weight: 7
			}, `r${i}`)),
			range.length > 0 && /* @__PURE__ */ jsx(Label, {
				x: 0,
				y: range[range.length - 1][1],
				text: "range",
				color: C_RANGE,
				size: 12,
				dx: 10,
				anchor: "start"
			}),
			accepted ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: pX,
						y: 0
					},
					to: {
						x: pX,
						y: pY
					},
					color: C_OK,
					weight: 1.5,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: pX,
						y: pY
					},
					to: {
						x: 0,
						y: pY
					},
					color: C_OK,
					weight: 1.5,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: pX,
					y: pY,
					r: 5,
					color: C_OK
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: 0,
					y: pY,
					r: 5,
					color: C_RANGE
				})
			] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Segment, {
				from: {
					x: pX,
					y: yMin
				},
				to: {
					x: pX,
					y: yMax
				},
				color: C_BAD,
				weight: 1.5,
				dashed: true
			}), /* @__PURE__ */ jsx(Label, {
				x: pX,
				y: (yMin + yMax) / 2,
				text: "undefined",
				color: C_BAD,
				size: 12,
				dx: 8,
				anchor: "start"
			})] }),
			/* @__PURE__ */ jsx(MovableDot, {
				value: {
					x: pX,
					y: 0
				},
				onMove: (p) => setPx(clamp(p.x, x0, x1)),
				constrain: "horizontal",
				color: accepted ? C_OK : C_BAD,
				ariaLabel: "input probe, drag along the x-axis"
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		aside: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 10
			},
			children: [/* @__PURE__ */ jsx("div", {
				className: "lab-pill",
				"data-state": accepted ? "ok" : "no",
				role: "status",
				style: { alignSelf: "flex-start" },
				children: accepted ? `✓ f(${num(pX)}) = ${num(pY)}, accepted` : `✗ x = ${num(pX)} is not in the domain`
			}), /* @__PURE__ */ jsx(Callout, {
				tone: "result",
				children: /* @__PURE__ */ jsxs("div", {
					style: {
						display: "grid",
						gap: 6,
						fontVariantNumeric: "tabular-nums",
						fontSize: 13
					},
					children: [
						/* @__PURE__ */ jsxs("span", { children: ["f(x) = ", /* @__PURE__ */ jsx("strong", { children: equation })] }),
						/* @__PURE__ */ jsxs("span", {
							style: { color: C_DOMAIN },
							children: ["domain: ", /* @__PURE__ */ jsx("strong", { children: fmtIntervals(domain, dx * 3) })]
						}),
						/* @__PURE__ */ jsxs("span", {
							style: { color: C_RANGE },
							children: ["range: ", /* @__PURE__ */ jsx("strong", { children: fmtIntervals(range, (yMax - yMin) * .05) })]
						}),
						restrict && /* @__PURE__ */ jsxs("span", {
							style: { color: "var(--stage-muted)" },
							children: [
								"restricted to [",
								num(restrict[0]),
								", ",
								num(restrict[1]),
								"]"
							]
						})
					]
				})
			})]
		}),
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : void 0,
		children: figure
	});
}

//#endregion
export { DomainRangeLab };