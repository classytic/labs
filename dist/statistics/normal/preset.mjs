'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useHints } from "../../kit/pedagogy.mjs";
import { normalBetween, normalPdf, withinSigma, zScore } from "../core/normal.mjs";
import { Bracket, Pointer, Spotlight } from "../../kit/annotate.mjs";
import { useCallback, useMemo, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/statistics/normal/preset.tsx
/**
* NormalDistributionLab, the bell curve as a working instrument. Drag μ and σ and
* the curve slides + widens; drag the two shaded handles and read P(a ≤ X ≤ b) as
* the AREA under the curve, with each bound's z-score (how many σ from the mean).
* A second mode draws the 68–95–99.7 rule as nested bands. This is the tool every
* stats/ML lesson reaches for after the Galton board: from "a bell appears" to
* "how likely is a value in THIS range, and how unusual is it (z)?".
*
* pdf/cdf/z come from the normal kernel; the lab only draws + shades them.
*/
const W = 540, H = 324, ML = 30, MR = 16, MT = 18, MB = 64;
const PW = W - ML - MR, PH = H - MT - MB;
const BANDS = [
	{
		k: 1,
		p: withinSigma(1),
		op: .28
	},
	{
		k: 2,
		p: withinSigma(2),
		op: .18
	},
	{
		k: 3,
		p: withinSigma(3),
		op: .1
	}
];
const f1 = (x) => x.toFixed(1);
function NormalDistributionLab({ mu = 0, sigma = 1, a = -1, b = 1, mode: mode0 = "area", title = "The normal distribution", prompt, objectives, hints: hintList, controlId }) {
	const [m, setM] = useState(mu);
	const [sig, setSig] = useState(sigma);
	const [lo, setLo] = useState(a);
	const [hi, setHi] = useState(b);
	const [mode, setMode] = useState(mode0);
	const hints = useHints(hintList);
	const svgRef = useRef(null);
	const drag = useRef(null);
	const xMin = m - 4 * sig, xMax = m + 4 * sig;
	const yMax = normalPdf(m, m, sig) * 1.12;
	const xOf = (x) => ML + (x - xMin) / (xMax - xMin) * PW;
	const yOf = (y) => 260 - y / yMax * PH;
	const vOf = (px) => xMin + (px - ML) / PW * (xMax - xMin);
	const curve = useMemo(() => {
		const pts = [];
		for (let i = 0; i <= 160; i++) {
			const x = xMin + i / 160 * (xMax - xMin);
			pts.push(`${xOf(x).toFixed(1)},${yOf(normalPdf(x, m, sig)).toFixed(1)}`);
		}
		return pts;
	}, [m, sig]);
	const bandPath = (x0, x1) => {
		const a0 = Math.max(xMin, Math.min(x0, x1)), a1 = Math.min(xMax, Math.max(x0, x1));
		const pts = [`${xOf(a0).toFixed(1)},${yOf(0).toFixed(1)}`];
		const steps = 60;
		for (let i = 0; i <= steps; i++) {
			const x = a0 + i / steps * (a1 - a0);
			pts.push(`${xOf(x).toFixed(1)},${yOf(normalPdf(x, m, sig)).toFixed(1)}`);
		}
		pts.push(`${xOf(a1).toFixed(1)},${yOf(0).toFixed(1)}`);
		return `M${pts.join(" L")} Z`;
	};
	const area = normalBetween(lo, hi, m, sig);
	const za = zScore(lo, m, sig), zb = zScore(hi, m, sig);
	const onMove = (e) => {
		if (!drag.current) return;
		const r = svgRef.current.getBoundingClientRect();
		const x = vOf((e.clientX - r.left) / r.width * W);
		if (drag.current === "a") setLo(Math.min(x, hi - .05 * sig));
		else setHi(Math.max(x, lo + .05 * sig));
	};
	const grab = (which) => (e) => {
		drag.current = which;
		e.target.setPointerCapture(e.pointerId);
	};
	const release = () => {
		drag.current = null;
	};
	const reset = useCallback(() => {
		setM(mu);
		setSig(sigma);
		setLo(a);
		setHi(b);
	}, [
		mu,
		sigma,
		a,
		b
	]);
	useControlSurface(controlId, {
		mode: {
			type: "enum",
			label: "mode",
			options: ["area", "rule"],
			get: () => mode,
			set: (v) => setMode(v)
		},
		mean: {
			type: "number",
			label: "mean μ",
			min: -5,
			max: 5,
			step: .1,
			get: () => m,
			set: setM
		},
		sd: {
			type: "number",
			label: "std dev σ",
			min: .3,
			max: 3,
			step: .1,
			get: () => sig,
			set: setSig
		},
		lower: {
			type: "number",
			label: "lower bound a",
			min: -10,
			max: 10,
			step: .1,
			get: () => lo,
			set: setLo
		},
		upper: {
			type: "number",
			label: "upper bound b",
			min: -10,
			max: 10,
			step: .1,
			get: () => hi,
			set: setHi
		},
		reset: {
			type: "action",
			label: "reset",
			invoke: reset
		}
	});
	const handle = (x, which, z) => /* @__PURE__ */ jsxs("g", {
		onPointerDown: grab(which),
		style: { cursor: "ew-resize" },
		role: "slider",
		"aria-label": `${which === "a" ? "lower" : "upper"} bound`,
		"aria-valuenow": x,
		children: [
			/* @__PURE__ */ jsx("line", {
				x1: xOf(x),
				y1: MT,
				x2: xOf(x),
				y2: yOf(0),
				stroke: "var(--stage-accent)",
				strokeWidth: 1.5,
				strokeDasharray: "4 3"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: xOf(x),
				cy: yOf(0),
				r: 8,
				fill: "var(--stage-accent)",
				stroke: "var(--stage-bg)",
				strokeWidth: 2
			}),
			/* @__PURE__ */ jsxs("text", {
				x: xOf(x),
				y: yOf(0) + 26,
				textAnchor: "middle",
				fontSize: 10,
				fill: "var(--stage-accent)",
				fontWeight: 700,
				children: ["z=", z.toFixed(2)]
			})
		]
	});
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "lab-bar",
			style: { gap: 8 },
			children: [/* @__PURE__ */ jsx(Chip, {
				selected: mode === "area",
				onClick: () => setMode("area"),
				children: "shade an area"
			}), /* @__PURE__ */ jsx(Chip, {
				selected: mode === "rule",
				onClick: () => setMode("rule"),
				children: "68–95–99.7 rule"
			})]
		}),
		/* @__PURE__ */ jsx("div", {
			style: {
				borderRadius: 14,
				background: "var(--stage-bg)",
				border: "1px solid var(--stage-grid)",
				padding: 8,
				touchAction: "none"
			},
			children: /* @__PURE__ */ jsxs("svg", {
				ref: svgRef,
				viewBox: `0 0 ${W} ${H}`,
				style: {
					width: "100%",
					maxWidth: W,
					height: "auto",
					display: "block"
				},
				onPointerMove: onMove,
				onPointerUp: release,
				onPointerLeave: release,
				role: "img",
				"aria-label": `normal curve, mean ${m}, sd ${sig}`,
				children: [
					mode === "rule" && [...BANDS].reverse().map((band) => /* @__PURE__ */ jsx("path", {
						d: bandPath(m - band.k * sig, m + band.k * sig),
						fill: "var(--stage-accent)",
						opacity: band.op
					}, band.k)),
					mode === "area" && /* @__PURE__ */ jsx("path", {
						d: bandPath(lo, hi),
						fill: "color-mix(in oklab, var(--stage-accent) 38%, transparent)"
					}),
					/* @__PURE__ */ jsx("line", {
						x1: ML,
						y1: yOf(0),
						x2: W - MR,
						y2: yOf(0),
						stroke: "var(--stage-fg)",
						strokeWidth: 1.5
					}),
					[
						-3,
						-2,
						-1,
						0,
						1,
						2,
						3
					].map((k) => {
						const x = m + k * sig;
						return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
							x1: xOf(x),
							y1: yOf(0),
							x2: xOf(x),
							y2: yOf(0) + 4,
							stroke: "var(--stage-muted)",
							strokeWidth: 1
						}), /* @__PURE__ */ jsx("text", {
							x: xOf(x),
							y: yOf(0) + 15,
							textAnchor: "middle",
							fontSize: 9.5,
							fill: "var(--stage-muted)",
							style: { fontVariantNumeric: "tabular-nums" },
							children: k === 0 ? "μ" : `${k > 0 ? "+" : ""}${k}σ`
						})] }, k);
					}),
					/* @__PURE__ */ jsx("polyline", {
						points: curve.join(" "),
						fill: "none",
						stroke: "var(--stage-fg)",
						strokeWidth: 2.5
					}),
					/* @__PURE__ */ jsx("line", {
						x1: xOf(m),
						y1: MT,
						x2: xOf(m),
						y2: yOf(0),
						stroke: "var(--stage-muted)",
						strokeWidth: 1,
						strokeDasharray: "2 3"
					}),
					mode === "rule" ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
						/* @__PURE__ */ jsx(Bracket, {
							x1: xOf(m - sig),
							x2: xOf(m + sig),
							y: yOf(0) + 30,
							text: `±1σ → ${(withinSigma(1) * 100).toFixed(1)}% of all values`,
							tone: "good",
							side: "below"
						}),
						/* @__PURE__ */ jsx(Spotlight, {
							cx: xOf(m + 2 * sig),
							cy: yOf(normalPdf(m + 2 * sig, m, sig)),
							r: 11,
							tone: "warn"
						}),
						/* @__PURE__ */ jsx(Pointer, {
							x: xOf(m + 2 * sig),
							y: yOf(normalPdf(m + 2 * sig, m, sig)),
							dx: 26,
							dy: -34,
							text: "rare, beyond 2σ",
							tone: "warn"
						})
					] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [handle(lo, "a", za), handle(hi, "b", zb)] })
				]
			})
		}),
		mode === "area" ? /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				gap: 16,
				flexWrap: "wrap",
				alignItems: "baseline",
				margin: "10px 0",
				fontVariantNumeric: "tabular-nums"
			},
			children: [
				/* @__PURE__ */ jsx("span", {
					style: {
						fontSize: 20,
						fontWeight: 800,
						color: "var(--stage-good)"
					},
					children: /* @__PURE__ */ jsx(Tex$1, { tex: `P(${f1(lo)} \\le X \\le ${f1(hi)}) = ${(area * 100).toFixed(1)}\\%` })
				}),
				/* @__PURE__ */ jsx("span", {
					style: {
						color: "var(--stage-accent)",
						fontWeight: 700
					},
					children: /* @__PURE__ */ jsx(Tex$1, { tex: `z: ${za.toFixed(2)} \\to ${zb.toFixed(2)}` })
				}),
				/* @__PURE__ */ jsx("span", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)"
					},
					children: "drag the dots ↔"
				})
			]
		}) : /* @__PURE__ */ jsx("div", {
			style: {
				display: "flex",
				gap: 18,
				flexWrap: "wrap",
				margin: "10px 0",
				fontWeight: 700
			},
			children: BANDS.map((band) => /* @__PURE__ */ jsx("span", {
				style: { color: "var(--stage-accent)" },
				children: /* @__PURE__ */ jsx(Tex$1, { tex: `\\pm${band.k}\\sigma \\to ${(band.p * 100).toFixed(band.k === 3 ? 1 : 1)}\\%` })
			}, band.k))
		})
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "mean μ",
				value: f1(m),
				children: /* @__PURE__ */ jsx(Slider, {
					value: m,
					min: -5,
					max: 5,
					step: .1,
					onChange: setM,
					ariaLabel: "mean"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "std dev σ",
				value: f1(sig),
				children: /* @__PURE__ */ jsx(Slider, {
					value: sig,
					min: .3,
					max: 3,
					step: .1,
					onChange: setSig,
					ariaLabel: "standard deviation"
				})
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: reset,
				children: "reset"
			})
		] }),
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { NormalDistributionLab };