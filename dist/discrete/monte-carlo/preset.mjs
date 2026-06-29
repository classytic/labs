'use client';

import { mulberry32, randInt } from "../../core/rng.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { HintLadder, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { useReducedMotionDeferred } from "../../kit/anim.mjs";
import { catColor, catToken } from "../../kit/palette.mjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { CanvasLayer, useControlSurface, useFrameLoop, useInView } from "@classytic/stage";

//#region src/discrete/monte-carlo/preset.tsx
/**
* MonteCarloLab, the GENERAL "estimate a probability by running it many times"
* engine. The whole of statistical ML rests on one idea this lab makes visible:
* the empirical frequency of an event converges to its true probability as trials
* pile up (the law of large numbers). You don't compute the answer, you SAMPLE
* it, and watch the estimate settle onto the truth.
*
* It is general by construction: a creator supplies one or more SERIES, each just
* a `run(rng) → didItHappen` (or `point(rng) → {x,y,hit}` for area/scatter
* estimates like π). The lab runs seeded batches per frame, tracks hits/total,
* and draws either a convergence run-chart (empirical line homing onto the dashed
* theoretical) or a dart scatter. Randomness is a SEEDED PRNG (mulberry32), so a
* run is replayable, an agent can pin a seed and reproduce a lesson exactly.
*
* Ships a small library of named experiments (`montyHall`, `piDarts`, `diceSum`,
* `bernoulli`) that expand to series, the Monty Hall paradox (switch ⇒ ⅔, stay
* ⇒ ⅓, two lines splitting apart) is the headline. Add an experiment by writing a
* factory that returns series; the engine never changes.
*/
function montyTrial(rng, doSwitch, doors) {
	const car = randInt(rng, 0, doors - 1);
	const pick = randInt(rng, 0, doors - 1);
	return doSwitch ? pick !== car : pick === car;
}
function expand(exp) {
	switch (exp.kind) {
		case "montyHall": {
			const d = exp.doors ?? 3;
			return {
				viz: "runchart",
				series: [{
					label: "switch",
					run: (r) => montyTrial(r, true, d),
					theoretical: (d - 1) / d
				}, {
					label: "stay",
					run: (r) => montyTrial(r, false, d),
					theoretical: 1 / d
				}]
			};
		}
		case "piDarts": return {
			viz: "scatter",
			series: [{
				label: "π estimate",
				point: (r) => {
					const x = r() * 2 - 1, y = r() * 2 - 1;
					return {
						x,
						y,
						hit: x * x + y * y <= 1
					};
				},
				estimate: (f) => 4 * f,
				theoretical: Math.PI
			}]
		};
		case "diceSum": {
			const dice = exp.dice ?? 2;
			let ways = 0;
			const total = 6 ** dice;
			for (let m = 0; m < total; m++) {
				let s = 0, x = m;
				for (let i = 0; i < dice; i++) {
					s += x % 6 + 1;
					x = Math.floor(x / 6);
				}
				if (s === exp.target) ways++;
			}
			return {
				viz: "runchart",
				series: [{
					label: `sum = ${exp.target}`,
					run: (r) => {
						let s = 0;
						for (let i = 0; i < dice; i++) s += randInt(r, 1, 6);
						return s === exp.target;
					},
					theoretical: ways / total
				}]
			};
		}
		case "bernoulli": return {
			viz: "runchart",
			series: [{
				label: exp.label ?? `p = ${exp.p}`,
				run: (r) => r() < exp.p,
				theoretical: exp.p
			}]
		};
	}
}
function MonteCarloLab({ series: seriesIn, experiment, viz: vizIn, seed = 12345, batch = 30, maxTrials, title = "Monte Carlo", prompt, objectives, hints: hintList, controlId, height = 320 }) {
	const { series, viz } = useMemo(() => {
		if (seriesIn?.length) return {
			series: seriesIn,
			viz: vizIn ?? (seriesIn[0].point ? "scatter" : "runchart")
		};
		if (experiment) {
			const e = expand(experiment);
			return {
				series: e.series,
				viz: vizIn ?? e.viz
			};
		}
		return {
			series: [],
			viz: "runchart"
		};
	}, [
		seriesIn,
		experiment,
		vizIn
	]);
	const cap = maxTrials ?? (viz === "scatter" ? 5e3 : 2e4);
	const hints = useHints(hintList);
	const [speed, setSpeed] = useState(batch);
	const [running, setRunning] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [tick, setTick] = useState(0);
	const reduce = useReducedMotionDeferred();
	const { ref: viewRef, inView } = useInView();
	const rt = useRef([]);
	const points = useRef([]);
	const seedRef = useRef(seed);
	const initRT = useCallback(() => {
		rt.current = series.map((_, i) => ({
			hits: 0,
			total: 0,
			hist: [],
			nextRec: 1,
			rng: mulberry32(seedRef.current + i * 99991 >>> 0)
		}));
		points.current = [];
	}, [series]);
	if (rt.current.length !== series.length) initRT();
	useEffect(() => {
		setMounted(true);
	}, []);
	const reset = useCallback(() => {
		initRT();
		setTick((t) => t + 1);
		setRunning(false);
	}, [initRT]);
	const reseed = useCallback((s) => {
		seedRef.current = s >>> 0;
		reset();
	}, [reset]);
	const toggleRun = useCallback(() => {
		setRunning((r) => {
			if (!r && rt.current.every((st) => st.total >= cap)) {
				initRT();
				setTick((t) => t + 1);
			}
			return !r;
		});
	}, [cap, initRT]);
	useFrameLoop(() => {
		let anyLeft = false;
		series.forEach((s, i) => {
			const st = rt.current[i];
			if (st.total >= cap) return;
			anyLeft = true;
			const ramp = Math.max(1, Math.floor(st.total / 12) + 1);
			const n = Math.min(speed, ramp, cap - st.total);
			for (let k = 0; k < n; k++) {
				if (viz === "scatter" && s.point) {
					const p = s.point(st.rng);
					if (points.current.length < cap) points.current.push(p);
					if (p.hit) st.hits++;
					st.total++;
				} else if (s.run) {
					if (s.run(st.rng)) st.hits++;
					st.total++;
				}
				if (viz !== "scatter" && st.total >= st.nextRec) {
					const frac = st.hits / st.total;
					st.hist.push([st.total, s.estimate ? s.estimate(frac) : frac]);
					st.nextRec = Math.ceil(st.nextRec * 1.25) + 1;
				}
			}
		});
		if (!anyLeft) setRunning(false);
		setTick((t) => t + 1 & 16777215);
	}, { running: running && mounted && !reduce && inView });
	const draw = useCallback((ctx, c) => {
		const css = getComputedStyle(ctx.canvas);
		const tok = (n, fb) => css.getPropertyValue(n).trim() || fb;
		tok("--stage-fg", "#222");
		const grid = tok("--stage-grid", "rgba(125,125,125,.25)"), muted = tok("--stage-muted", "#888"), good = tok("--stage-good", "#2f9e44");
		const seriesColor = (i) => series[i].color ?? tok(catToken(i), `hsl(${i * 47 % 360} 70% 50%)`);
		const W = ctx.canvas.clientWidth || 640, Hh = height;
		ctx.clearRect(0, 0, W, Hh);
		if (viz === "scatter") {
			const [cx, cy] = c.toPx(0, 0);
			const rpx = Math.abs(c.toPx(1, 0)[0] - cx);
			const [sx0, sy0] = c.toPx(-1, 1), [sx1, sy1] = c.toPx(1, -1);
			ctx.strokeStyle = grid;
			ctx.lineWidth = 1.5;
			ctx.strokeRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
			ctx.strokeStyle = muted;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.arc(cx, cy, rpx, 0, Math.PI * 2);
			ctx.stroke();
			for (const p of points.current) {
				const [px, py] = c.toPx(p.x, p.y);
				ctx.fillStyle = p.hit ? good : muted;
				ctx.globalAlpha = p.hit ? .7 : .4;
				ctx.beginPath();
				ctx.arc(px, py, 1.6, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.globalAlpha = 1;
			return;
		}
		const padL = 34, padR = 12, padT = 12, padB = 22;
		const logCap = Math.log10(Math.max(10, cap));
		const X = (n) => padL + Math.log10(Math.max(1, n)) / logCap * (W - padL - padR);
		const allEst = series.flatMap((s, i) => (rt.current[i]?.hist ?? []).map((h) => h[1])).concat(series.map((s) => s.theoretical).filter((t) => t != null));
		let yLo = allEst.length ? Math.min(...allEst) : 0, yHi = allEst.length ? Math.max(...allEst) : 1;
		const span = Math.max(.05, yHi - yLo);
		yLo = Math.max(0, yLo - span * .25);
		yHi = yHi + span * .25;
		const Y = (v) => padT + (1 - (v - yLo) / (yHi - yLo)) * (Hh - padT - padB);
		ctx.strokeStyle = grid;
		ctx.lineWidth = 1;
		ctx.fillStyle = muted;
		ctx.font = "10px ui-sans-serif, system-ui";
		for (let g = 0; g <= 4; g++) {
			const v = yLo + g / 4 * (yHi - yLo);
			const yy = Y(v);
			ctx.beginPath();
			ctx.moveTo(padL, yy);
			ctx.lineTo(W - padR, yy);
			ctx.stroke();
			ctx.textAlign = "right";
			ctx.fillText(v.toFixed(2), padL - 4, yy + 3);
		}
		ctx.textAlign = "center";
		for (let p = 1; Math.pow(10, p) <= cap; p++) {
			const n = Math.pow(10, p);
			ctx.fillText(n >= 1e3 ? `${n / 1e3}k` : String(n), X(n), Hh - 6);
		}
		series.forEach((s, i) => {
			if (s.theoretical == null) return;
			ctx.strokeStyle = seriesColor(i);
			ctx.globalAlpha = .55;
			ctx.setLineDash([6, 5]);
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(padL, Y(s.theoretical));
			ctx.lineTo(W - padR, Y(s.theoretical));
			ctx.stroke();
		});
		ctx.setLineDash([]);
		ctx.globalAlpha = 1;
		series.forEach((s, i) => {
			const hist = rt.current[i]?.hist ?? [];
			if (hist.length < 2) return;
			ctx.strokeStyle = seriesColor(i);
			ctx.lineWidth = 2.5;
			ctx.beginPath();
			hist.forEach(([n, v], j) => {
				const x = X(n), y = Y(v);
				if (j === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			});
			ctx.stroke();
			const [ln, lv] = hist[hist.length - 1];
			ctx.fillStyle = seriesColor(i);
			ctx.beginPath();
			ctx.arc(X(ln), Y(lv), 3.5, 0, Math.PI * 2);
			ctx.fill();
		});
	}, [
		series,
		viz,
		height,
		cap,
		tick
	]);
	const view = useMemo(() => viz === "scatter" ? {
		xMin: -1.15,
		xMax: 1.15,
		yMin: -1.15,
		yMax: 1.15
	} : {
		xMin: 0,
		xMax: 1,
		yMin: 0,
		yMax: 1
	}, [viz]);
	const stats = series.map((s, i) => {
		const st = rt.current[i];
		const total = st?.total ?? 0;
		const frac = total ? st.hits / total : 0;
		return {
			label: s.label,
			color: s.color ?? catColor(i),
			est: s.estimate ? s.estimate(frac) : frac,
			theoretical: s.theoretical,
			total
		};
	});
	const totalTrials = stats.reduce((a, b) => Math.max(a, b.total), 0);
	useCheckpoint({
		solved: stats.length > 0 && totalTrials >= 300 && stats.every((s) => s.theoretical == null || Math.abs(s.est - s.theoretical) <= (viz === "scatter" ? .05 : .02)),
		activity: `monte-carlo:${title}`,
		hintsUsed: hints.count
	});
	useControlSurface(controlId, {
		run: {
			type: "action",
			label: running ? "pause" : "run",
			invoke: toggleRun
		},
		reset: {
			type: "action",
			label: "reset",
			invoke: reset
		},
		speed: {
			type: "number",
			label: "trials/frame",
			min: 10,
			max: 2e3,
			step: 10,
			get: () => speed,
			set: setSpeed
		},
		seed: {
			type: "number",
			label: "seed",
			min: 1,
			max: 999999,
			step: 1,
			get: () => seedRef.current,
			set: reseed
		}
	});
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsx(CanvasLayer, {
			view,
			height,
			draw,
			ariaLabel: `${title}: ${stats.map((s) => `${s.label} ${s.est.toFixed(3)}`).join(", ")} after ${totalTrials} trials`
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 6,
					fontVariantNumeric: "tabular-nums"
				},
				children: [stats.map((s) => /* @__PURE__ */ jsxs("span", {
					style: {
						fontWeight: 700,
						color: s.color
					},
					children: [
						s.label,
						": ",
						s.total ? s.est.toFixed(viz === "scatter" ? 4 : 3) : ", ",
						s.theoretical != null && /* @__PURE__ */ jsxs("span", {
							style: {
								color: "var(--stage-muted)",
								fontWeight: 500
							},
							children: [
								" (→ ",
								s.theoretical.toFixed(viz === "scatter" ? 4 : 3),
								")"
							]
						})
					]
				}, s.label)), /* @__PURE__ */ jsxs("span", {
					style: { color: "var(--stage-muted)" },
					children: ["N = ", totalTrials.toLocaleString()]
				})]
			})
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Chip, {
				selected: running,
				onClick: toggleRun,
				children: running ? "⏸ pause" : "▶ run"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: reset,
				children: "↺ reset"
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "speed",
				value: `seed ${seedRef.current}`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: speed,
					min: 10,
					max: 2e3,
					step: 10,
					onChange: setSpeed,
					ariaLabel: "trials per frame"
				})
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs(LiveRegion, { children: [
			stats.map((s) => `${s.label} ${s.est.toFixed(3)}`).join("; "),
			" after ",
			totalTrials,
			" trials."
		] }), /* @__PURE__ */ jsx(HintLadder, { hints })] }),
		children: figure
	});
}

//#endregion
export { MonteCarloLab };