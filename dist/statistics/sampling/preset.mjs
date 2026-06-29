'use client';

import { gaussian, mulberry32 } from "../../core/rng.mjs";
import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useHints } from "../../kit/pedagogy.mjs";
import { useReducedMotion } from "../../kit/anim.mjs";
import { normalPdf } from "../core/normal.mjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { CanvasLayer, useControlSurface, useFrameLoop, useInView } from "@classytic/stage";

//#region src/statistics/sampling/preset.tsx
/**
* SamplingDistributionLab, the two ideas that turn a sample into an inference.
*
*  • sampling mode, draw sample after sample (size n) from the population and pile
*    up their MEANS. The pile is far tighter than the population and matches
*    Normal(μ, σ/√n): the Central Limit Theorem, and why bigger n ⇒ smaller error.
*  • CI mode, from each sample build a confidence interval x̄ ± z*·(σ/√n) and stack
*    them; colour green if it captures μ, red if it misses. About C% are green , 
*    making concrete what "95% confident" actually means (it's the PROCEDURE, not
*    one interval). Running coverage converges to the chosen level.
*
* Seeded Gaussian draws (replayable); animated on CanvasLayer so you watch it build.
* SE/curve/z* come from the normal kernel + standard z-values.
*/
const ZSTAR = {
	.8: 1.2816,
	.9: 1.6449,
	.95: 1.96,
	.99: 2.5758
};
const ROWS = 22;
const f2 = (x) => x.toFixed(2);
function SamplingDistributionLab({ mu = 50, sigma = 10, n = 30, confidence = .95, mode: mode0 = "ci", title = "Sampling & confidence", prompt, objectives, hints: hintList, controlId, height = 320 }) {
	const [m, setM] = useState(mu);
	const [sg, setSg] = useState(sigma);
	const [nn, setNn] = useState(n);
	const [conf, setConf] = useState(confidence);
	const [mode, setMode] = useState(mode0);
	const speed = 3;
	const hints = useHints(hintList);
	const [running, setRunning] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [tick, setTick] = useState(0);
	const reduce = useReducedMotion();
	const { ref: viewRef, inView } = useInView();
	const rng = useRef(mulberry32(2025));
	const means = useRef([]);
	const bars = useRef([]);
	const cover = useRef({
		total: 0,
		hit: 0
	});
	const zStar = ZSTAR[conf];
	const se = sg / Math.sqrt(nn);
	const xMin = m - 3.4 * sg, xMax = m + 3.4 * sg;
	useEffect(() => {
		setMounted(true);
	}, []);
	const reset = useCallback(() => {
		rng.current = mulberry32(2025);
		means.current = [];
		bars.current = [];
		cover.current = {
			total: 0,
			hit: 0
		};
		setTick((t) => t + 1);
		setRunning(false);
	}, []);
	useEffect(() => {
		reset();
	}, [
		m,
		sg,
		nn,
		conf,
		reset
	]);
	const drawSample = () => {
		let s = 0;
		for (let i = 0; i < nn; i++) s += gaussian(rng.current, m, sg);
		return s / nn;
	};
	useFrameLoop(() => {
		for (let k = 0; k < speed; k++) {
			const xbar = drawSample();
			if (mode === "sampling") {
				means.current.push(xbar);
				if (means.current.length > 5e3) means.current.shift();
			} else {
				const lo = xbar - zStar * se, hi = xbar + zStar * se;
				const covers = lo <= m && m <= hi;
				bars.current.push({
					mean: xbar,
					covers
				});
				if (bars.current.length > ROWS) bars.current.shift();
				cover.current.total++;
				if (covers) cover.current.hit++;
			}
		}
		setTick((t) => t + 1 & 16777215);
	}, { running: running && mounted && !reduce && inView });
	const draw = useCallback((ctx, _c) => {
		const css = getComputedStyle(ctx.canvas);
		const tok = (k, fb) => css.getPropertyValue(k).trim() || fb;
		const fg = tok("--stage-fg", "#222"), grid = tok("--stage-grid", "rgba(125,125,125,.3)"), muted = tok("--stage-muted", "#888"), accent = tok("--stage-accent", "#1c7ed6"), good = tok("--stage-good", "#2f9e44"), bad = tok("--stage-danger", "#e03131");
		const W = ctx.canvas.clientWidth || 640, H = height, padL = 30, padR = 14, padT = 14, padB = 26;
		const X = (v) => padL + (v - xMin) / (xMax - xMin) * (W - padL - padR);
		ctx.clearRect(0, 0, W, H);
		ctx.strokeStyle = grid;
		ctx.fillStyle = muted;
		ctx.font = "10px ui-sans-serif, system-ui";
		ctx.textAlign = "center";
		for (let k = -3; k <= 3; k++) {
			const x = X(m + k * sg);
			ctx.beginPath();
			ctx.moveTo(x, padT);
			ctx.lineTo(x, H - padB);
			ctx.globalAlpha = k === 0 ? 0 : .5;
			ctx.stroke();
			ctx.globalAlpha = 1;
		}
		ctx.strokeStyle = fg;
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.moveTo(X(m), padT);
		ctx.lineTo(X(m), H - padB);
		ctx.stroke();
		ctx.fillStyle = fg;
		ctx.fillText(`μ=${m}`, X(m), H - 8);
		if (mode === "sampling") {
			const plotH = H - padT - padB, peak = normalPdf(m, m, se);
			const curveY = (pdf) => H - padB - pdf / peak * plotH * .92;
			ctx.strokeStyle = muted;
			ctx.globalAlpha = .5;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			for (let i = 0; i <= 120; i++) {
				const v = xMin + i / 120 * (xMax - xMin);
				const y = curveY(normalPdf(v, m, sg));
				i ? ctx.lineTo(X(v), y) : ctx.moveTo(X(v), y);
			}
			ctx.stroke();
			ctx.globalAlpha = 1;
			const B = 41, bw = (xMax - xMin) / B;
			const counts = new Array(B).fill(0);
			for (const mn of means.current) {
				const b = Math.floor((mn - xMin) / bw);
				if (b >= 0 && b < B) counts[b]++;
			}
			const maxC = Math.max(1, ...counts);
			ctx.fillStyle = accent;
			ctx.globalAlpha = .85;
			counts.forEach((c, i) => {
				if (!c) return;
				const h = c / maxC * plotH * .92;
				ctx.fillRect(X(xMin + i * bw) + 1, H - padB - h, (W - padL - padR) / B - 1, h);
			});
			ctx.globalAlpha = 1;
			ctx.strokeStyle = good;
			ctx.lineWidth = 2.5;
			ctx.beginPath();
			for (let i = 0; i <= 160; i++) {
				const v = xMin + i / 160 * (xMax - xMin);
				const y = curveY(normalPdf(v, m, se));
				i ? ctx.lineTo(X(v), y) : ctx.moveTo(X(v), y);
			}
			ctx.stroke();
		} else {
			const rowH = (H - padT - padB) / ROWS;
			bars.current.forEach((b, i) => {
				const y = padT + (i + .5) * rowH;
				const lo = b.mean - zStar * se, hi = b.mean + zStar * se;
				ctx.strokeStyle = b.covers ? good : bad;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(X(lo), y);
				ctx.lineTo(X(hi), y);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(X(lo), y - 3);
				ctx.lineTo(X(lo), y + 3);
				ctx.moveTo(X(hi), y - 3);
				ctx.lineTo(X(hi), y + 3);
				ctx.stroke();
				ctx.fillStyle = b.covers ? good : bad;
				ctx.beginPath();
				ctx.arc(X(b.mean), y, 2.5, 0, Math.PI * 2);
				ctx.fill();
			});
		}
	}, [
		mode,
		m,
		sg,
		nn,
		conf,
		zStar,
		se,
		xMin,
		xMax,
		height,
		tick
	]);
	useControlSurface(controlId, {
		mode: {
			type: "enum",
			label: "mode",
			options: ["sampling", "ci"],
			get: () => mode,
			set: (v) => setMode(v)
		},
		run: {
			type: "action",
			label: running ? "pause" : "run",
			invoke: () => setRunning((r) => !r)
		},
		reset: {
			type: "action",
			label: "reset",
			invoke: reset
		},
		n: {
			type: "number",
			label: "sample size n",
			min: 2,
			max: 200,
			step: 1,
			get: () => nn,
			set: setNn
		},
		confidence: {
			type: "enum",
			label: "confidence level",
			options: [
				"0.8",
				"0.9",
				"0.95",
				"0.99"
			],
			get: () => String(conf),
			set: (v) => setConf(Number(v))
		}
	});
	const view = useMemo(() => ({
		xMin: 0,
		xMax: 1,
		yMin: 0,
		yMax: 1
	}), []);
	const coverage = cover.current.total ? cover.current.hit / cover.current.total : 0;
	const meansSD = means.current.length > 1 ? Math.sqrt(means.current.reduce((a, x) => a + (x - m) ** 2, 0) / means.current.length) : 0;
	const figure = /* @__PURE__ */ jsxs("div", {
		ref: viewRef,
		className: "lab-playwrap",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "lab-bar",
				style: { gap: 8 },
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: mode === "ci",
					onClick: () => setMode("ci"),
					children: "confidence intervals"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: mode === "sampling",
					onClick: () => setMode("sampling"),
					children: "sampling distribution"
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					borderRadius: 14,
					overflow: "hidden",
					background: "var(--stage-bg)",
					border: "1px solid var(--stage-grid)",
					marginTop: 6
				},
				children: /* @__PURE__ */ jsx(CanvasLayer, {
					view,
					height,
					draw,
					ariaLabel: `${mode}; SE ${f2(se)}`
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "lab-bar",
				style: {
					flexWrap: "wrap",
					gap: 16,
					marginTop: 6,
					fontVariantNumeric: "tabular-nums",
					fontWeight: 700
				},
				children: [/* @__PURE__ */ jsxs("span", { children: [
					/* @__PURE__ */ jsx(Tex$1, { tex: "\\\\mathrm{SE} = \\\\sigma/\\\\sqrt{n}" }),
					" = ",
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-good)" },
						children: f2(se)
					})
				] }), mode === "ci" ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("span", { children: [
					"level: ",
					(conf * 100).toFixed(0),
					"%"
				] }), /* @__PURE__ */ jsxs("span", {
					style: { color: "var(--stage-accent)" },
					children: [
						"coverage: ",
						(coverage * 100).toFixed(1),
						"% ",
						/* @__PURE__ */ jsxs("span", {
							style: {
								color: "var(--stage-muted)",
								fontWeight: 500
							},
							children: [
								"(",
								cover.current.hit,
								"/",
								cover.current.total,
								")"
							]
						})
					]
				})] }) : /* @__PURE__ */ jsxs("span", {
					style: { color: "var(--stage-accent)" },
					children: [
						"spread of means ",
						/* @__PURE__ */ jsx(Tex$1, { tex: `\\approx ${f2(meansSD)}` }),
						" ",
						/* @__PURE__ */ jsxs("span", {
							style: {
								color: "var(--stage-muted)",
								fontWeight: 500
							},
							children: [
								"(",
								/* @__PURE__ */ jsx(Tex$1, { tex: `\\to \\mathrm{SE}\\ ${f2(se)}` }),
								")"
							]
						}),
						" · ",
						means.current.length,
						" samples"
					]
				})]
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Chip, {
				selected: running,
				onClick: () => setRunning((r) => !r),
				children: running ? "⏸ pause" : "▶ run"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: reset,
				children: "↺ reset"
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "n",
				value: nn,
				children: /* @__PURE__ */ jsx(Slider, {
					value: nn,
					min: 2,
					max: 200,
					step: 1,
					onChange: setNn,
					ariaLabel: "sample size"
				})
			}),
			mode === "ci" && /* @__PURE__ */ jsx("span", {
				style: {
					display: "flex",
					gap: 4,
					alignItems: "center"
				},
				children: [
					.8,
					.9,
					.95,
					.99
				].map((c) => /* @__PURE__ */ jsxs(Chip, {
					selected: conf === c,
					onClick: () => setConf(c),
					children: [c * 100, "%"]
				}, c))
			})
		] }),
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { SamplingDistributionLab };