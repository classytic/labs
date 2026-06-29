'use client';

import { clamp, lerp } from "../core/util.mjs";
import { Tex as Tex$1 } from "../core/tex.mjs";
import { CheckButton, Slider } from "../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../kit/frame.mjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { CanvasLayer, compileExpr, differentiate, evaluate, simplify, toLatex, useFrameLoop, useInView } from "@classytic/stage";

//#region src/math/gradient-descent.tsx
/**
* GradientDescent, the calculus that powers machine learning, made visible.
*
* Plots a 2-variable "loss surface" f(x, y) as a heatmap, then walks downhill by
* the rule that trains every neural net: step opposite the gradient,
*   (x, y) ← (x, y) − lr · ∇f,   ∇f = [∂f/∂x, ∂f/∂y].
*
* The gradient is the engine's EXACT symbolic differentiator , 
* `differentiate(ast, 'x')` and `differentiate(ast, 'y')`, proving the scalar
* expr engine already does multivariable partials (numerical fallback otherwise).
*
* This is a genuine HIGH-ELEMENT-COUNT figure (a per-pixel-cell heatmap), so it
* renders on the engine's `<CanvasLayer>` (zero-dep raw Canvas2D, HiDPI, shares
* the coordinate system + clock) instead of one SVG node per cell, and instead
* of a heavy GPU dependency. Everything ELSE (controls, KaTeX, theming) is the
* same kit every other lab uses. Drag the start point, tune the rate, watch it
* converge, or diverge.
*/
const VIRIDIS = [
	[
		68,
		1,
		84
	],
	[
		59,
		82,
		139
	],
	[
		33,
		145,
		140
	],
	[
		94,
		201,
		98
	],
	[
		253,
		231,
		37
	]
];
function viridis(t) {
	const x = clamp(t, 0, 1) * (VIRIDIS.length - 1);
	const i = Math.min(VIRIDIS.length - 2, Math.floor(x)), f = x - i;
	const a = VIRIDIS[i], b = VIRIDIS[i + 1];
	return `rgb(${Math.round(lerp(a[0], b[0], f))},${Math.round(lerp(a[1], b[1], f))},${Math.round(lerp(a[2], b[2], f))})`;
}
/** Iso-loss contour lines via marching squares on a lattice-sampled value grid. */
function contours(ctx, vals, cols, rows, cell, levels, color) {
	ctx.save();
	ctx.strokeStyle = color;
	ctx.lineWidth = 1;
	ctx.beginPath();
	const px = (col) => col * cell, py = (r) => r * cell;
	for (const L of levels) for (let r = 0; r < rows - 1; r++) for (let col = 0; col < cols - 1; col++) {
		const tl = vals[r * cols + col], tr = vals[r * cols + col + 1], br = vals[(r + 1) * cols + col + 1], bl = vals[(r + 1) * cols + col];
		if (!(Number.isFinite(tl) && Number.isFinite(tr) && Number.isFinite(br) && Number.isFinite(bl))) continue;
		const code = (tl >= L ? 8 : 0) | (tr >= L ? 4 : 0) | (br >= L ? 2 : 0) | (bl >= L ? 1 : 0);
		if (code === 0 || code === 15) continue;
		const top = () => [px(col) + cell * ((L - tl) / (tr - tl)), py(r)];
		const bot = () => [px(col) + cell * ((L - bl) / (br - bl)), py(r + 1)];
		const lft = () => [px(col), py(r) + cell * ((L - tl) / (bl - tl))];
		const rgt = () => [px(col + 1), py(r) + cell * ((L - tr) / (br - tr))];
		const seg = (a, b) => {
			ctx.moveTo(a[0], a[1]);
			ctx.lineTo(b[0], b[1]);
		};
		switch (code) {
			case 1:
			case 14:
				seg(lft(), bot());
				break;
			case 2:
			case 13:
				seg(bot(), rgt());
				break;
			case 3:
			case 12:
				seg(lft(), rgt());
				break;
			case 4:
			case 11:
				seg(top(), rgt());
				break;
			case 6:
			case 9:
				seg(top(), bot());
				break;
			case 7:
			case 8:
				seg(lft(), top());
				break;
			case 5:
				seg(lft(), top());
				seg(bot(), rgt());
				break;
			case 10:
				seg(lft(), bot());
				seg(top(), rgt());
				break;
		}
	}
	ctx.stroke();
	ctx.restore();
}
/** A negative-gradient step arrow, in math coords, via raw ctx. */
function drawArrow(ctx, c, x0, y0, x1, y1, color) {
	const [ax, ay] = c.toPx(x0, y0);
	const [bx, by] = c.toPx(x1, y1);
	ctx.strokeStyle = color;
	ctx.fillStyle = color;
	ctx.lineWidth = 2.5;
	ctx.beginPath();
	ctx.moveTo(ax, ay);
	ctx.lineTo(bx, by);
	ctx.stroke();
	const ang = Math.atan2(by - ay, bx - ax), head = 8;
	ctx.beginPath();
	ctx.moveTo(bx, by);
	ctx.lineTo(bx - head * Math.cos(ang - .4), by - head * Math.sin(ang - .4));
	ctx.lineTo(bx - head * Math.cos(ang + .4), by - head * Math.sin(ang + .4));
	ctx.closePath();
	ctx.fill();
}
function GradientDescent({ equation = "x^2 + 2*y^2", range = [-3, 3], start = [2.4, 1.8], learningRate = .1, title = "Gradient descent", height = 360 } = {}) {
	const [lo, hi] = range;
	const [lr, setLr] = useState(learningRate);
	const [start0, setStart0] = useState([clamp(start[0], lo, hi), clamp(start[1], lo, hi)]);
	const [path, setPath] = useState([start0]);
	const [running, setRunning] = useState(false);
	const acc = useRef(0);
	const { ref: viewRef, inView } = useInView();
	const sx = clamp(start[0], lo, hi);
	const sy = clamp(start[1], lo, hi);
	useEffect(() => {
		setStart0([sx, sy]);
		setPath([[sx, sy]]);
		setRunning(false);
	}, [sx, sy]);
	useEffect(() => {
		setLr(learningRate);
	}, [learningRate]);
	const model = useMemo(() => {
		const res = compileExpr(equation);
		if (res.error || !res.ast) return {
			ok: false,
			error: res.error ?? "Invalid expression"
		};
		const ast = res.ast;
		const f = (x, y) => evaluate(ast, {
			x,
			y
		});
		const partial = (vn) => {
			let node = null;
			try {
				const d = differentiate(ast, vn);
				node = d ? simplify(d) : null;
			} catch {
				node = null;
			}
			if (node) return (x, y) => evaluate(node, {
				x,
				y
			});
			const h = 1e-5;
			return (x, y) => vn === "x" ? (f(x + h, y) - f(x - h, y)) / (2 * h) : (f(x, y + h) - f(x, y - h)) / (2 * h);
		};
		const dxNode = (() => {
			try {
				const d = differentiate(ast, "x");
				return d ? simplify(d) : null;
			} catch {
				return null;
			}
		})();
		const dyNode = (() => {
			try {
				const d = differentiate(ast, "y");
				return d ? simplify(d) : null;
			} catch {
				return null;
			}
		})();
		return {
			ok: true,
			f,
			fx: partial("x"),
			fy: partial("y"),
			fLatex: toLatex(ast),
			dxLatex: dxNode ? toLatex(dxNode) : null,
			dyLatex: dyNode ? toLatex(dyNode) : null
		};
	}, [equation]);
	const view = useMemo(() => ({
		xMin: lo,
		xMax: hi,
		yMin: lo,
		yMax: hi
	}), [lo, hi]);
	const coordsOptions = useMemo(() => ({ pad: 8 }), []);
	const cur = path[path.length - 1] ?? start0;
	const draw = useCallback((ctx, c) => {
		if (!model.ok) return;
		const { f } = model;
		const accent = getComputedStyle(ctx.canvas).getPropertyValue("--stage-accent").trim() || "#5b8cff";
		const cell = 6;
		const cols = Math.ceil(c.width / cell) + 1;
		const rows = Math.ceil(c.height / cell) + 1;
		const vals = new Float64Array(cols * rows);
		let vmin = Infinity, vmax = -Infinity;
		for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
			const [mx, my] = c.toMath(col * cell, r * cell);
			const v = f(mx, my);
			vals[r * cols + col] = v;
			if (Number.isFinite(v)) {
				if (v < vmin) vmin = v;
				if (v > vmax) vmax = v;
			}
		}
		const span = vmax - vmin || 1;
		for (let r = 0; r < rows - 1; r++) for (let col = 0; col < cols - 1; col++) {
			const v = vals[r * cols + col];
			ctx.fillStyle = viridis(Number.isFinite(v) ? clamp((v - vmin) / span, 0, 1) : 0);
			ctx.fillRect(col * cell, r * cell, 7, 7);
		}
		contours(ctx, vals, cols, rows, cell, Array.from({ length: 11 }, (_, i) => vmin + (i + 1) / 12 * span), "rgba(0,0,0,0.32)");
		ctx.save();
		ctx.globalAlpha = .3;
		ctx.strokeStyle = "rgba(255,255,255,0.7)";
		ctx.lineWidth = 1;
		const oy = c.toPx(0, 0)[1], ox = c.toPx(0, 0)[0];
		ctx.beginPath();
		ctx.moveTo(c.toPx(lo, 0)[0], oy);
		ctx.lineTo(c.toPx(hi, 0)[0], oy);
		ctx.moveTo(ox, c.toPx(0, lo)[1]);
		ctx.lineTo(ox, c.toPx(0, hi)[1]);
		ctx.stroke();
		ctx.restore();
		if (path.length > 1) {
			ctx.lineJoin = "round";
			ctx.lineCap = "round";
			const trace = () => {
				ctx.beginPath();
				path.forEach((p, i) => {
					const [px, py] = c.toPx(p[0], p[1]);
					if (i === 0) ctx.moveTo(px, py);
					else ctx.lineTo(px, py);
				});
				ctx.stroke();
			};
			ctx.strokeStyle = "rgba(0,0,0,0.55)";
			ctx.lineWidth = 4.5;
			trace();
			ctx.strokeStyle = "rgba(255,255,255,0.95)";
			ctx.lineWidth = 2;
			trace();
		}
		for (const p of path) {
			const [px, py] = c.toPx(p[0], p[1]);
			ctx.beginPath();
			ctx.arc(px, py, 2.4, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(255,255,255,0.92)";
			ctx.fill();
			ctx.lineWidth = 1;
			ctx.strokeStyle = "rgba(0,0,0,0.45)";
			ctx.stroke();
		}
		const [cxx, cyy] = cur;
		const gx = model.fx(cxx, cyy), gy = model.fy(cxx, cyy), gmag = Math.hypot(gx, gy);
		if (gmag > 1e-4) {
			const scale = Math.min(.9, .9 * (hi - lo) / 6 / gmag);
			ctx.save();
			ctx.shadowColor = "rgba(0,0,0,0.65)";
			ctx.shadowBlur = 4;
			drawArrow(ctx, c, cxx, cyy, cxx - gx * scale, cyy - gy * scale, "#ffffff");
			ctx.restore();
		}
		const [pcx, pcy] = c.toPx(cxx, cyy);
		ctx.beginPath();
		ctx.arc(pcx, pcy, 7.5, 0, Math.PI * 2);
		ctx.fillStyle = "#fff";
		ctx.fill();
		ctx.beginPath();
		ctx.arc(pcx, pcy, 5, 0, Math.PI * 2);
		ctx.fillStyle = accent;
		ctx.fill();
	}, [
		model,
		path,
		cur,
		lo,
		hi
	]);
	useFrameLoop((frame) => {
		if (!model.ok) return;
		acc.current += frame.dtMs;
		if (acc.current < 90) return;
		acc.current = 0;
		setPath((prev) => {
			const last = prev[prev.length - 1];
			if (!last || prev.length > 250) {
				setRunning(false);
				return prev;
			}
			const gx = model.fx(last[0], last[1]);
			const gy = model.fy(last[0], last[1]);
			if (Math.hypot(gx, gy) < .001) {
				setRunning(false);
				return prev;
			}
			const next = [last[0] - lr * gx, last[1] - lr * gy];
			if (Math.abs(next[0]) > 1e3 || Math.abs(next[1]) > 1e3) {
				setRunning(false);
				return prev;
			}
			return [...prev, next];
		});
	}, { running: running && model.ok && inView });
	const step = () => {
		if (!model.ok) return;
		setRunning(false);
		setPath((prev) => {
			const last = prev[prev.length - 1];
			if (!last) return prev;
			const gx = model.fx(last[0], last[1]);
			const gy = model.fy(last[0], last[1]);
			return [...prev, [last[0] - lr * gx, last[1] - lr * gy]];
		});
	};
	if (!model.ok) return /* @__PURE__ */ jsxs("div", {
		className: "not-prose",
		children: [title && /* @__PURE__ */ jsx("p", {
			style: {
				fontWeight: 600,
				marginBottom: 6
			},
			children: title
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				padding: "12px",
				fontSize: 13,
				color: "var(--stage-danger)"
			},
			children: [
				"“",
				equation,
				"”, ",
				model.error
			]
		})]
	});
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		children: /* @__PURE__ */ jsx(CanvasLayer, {
			view,
			height,
			coordsOptions,
			draw,
			onPointerMath: (m) => {
				setRunning(false);
				const p = [clamp(m[0], lo, hi), clamp(m[1], lo, hi)];
				setStart0(p);
				setPath([p]);
			},
			ariaLabel: `Gradient descent on f(x,y) = ${equation}; drag to set the start point`
		})
	});
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [
		/* @__PURE__ */ jsx(CheckButton, {
			onClick: () => setRunning((r) => !r),
			children: running ? "Pause" : "Run"
		}),
		/* @__PURE__ */ jsx("button", {
			type: "button",
			className: "lab-chip",
			onClick: step,
			children: "Step"
		}),
		/* @__PURE__ */ jsx("button", {
			type: "button",
			className: "lab-chip",
			onClick: () => {
				setRunning(false);
				setPath([start0]);
			},
			children: "Reset"
		}),
		/* @__PURE__ */ jsx(Field, {
			label: "learning rate",
			value: /* @__PURE__ */ jsx("strong", {
				style: { fontVariantNumeric: "tabular-nums" },
				children: lr.toFixed(2)
			}),
			children: /* @__PURE__ */ jsx(Slider, {
				value: lr,
				min: .01,
				max: .6,
				step: .01,
				onChange: setLr,
				ariaLabel: "learning rate"
			})
		}),
		/* @__PURE__ */ jsxs("span", {
			style: {
				marginLeft: "auto",
				display: "inline-flex",
				gap: 16,
				fontVariantNumeric: "tabular-nums"
			},
			children: [
				/* @__PURE__ */ jsxs("span", { children: ["x ", cur[0].toFixed(2)] }),
				/* @__PURE__ */ jsxs("span", { children: ["y ", cur[1].toFixed(2)] }),
				/* @__PURE__ */ jsxs("span", { children: ["f ", model.f(cur[0], cur[1]).toFixed(3)] }),
				/* @__PURE__ */ jsxs("span", { children: ["steps ", path.length - 1] })
			]
		})
	] });
	const footer = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexWrap: "wrap",
			gap: "4px 16px",
			padding: "6px 2px",
			fontSize: 13
		},
		children: [
			/* @__PURE__ */ jsxs("span", {
				style: {
					display: "inline-flex",
					alignItems: "center",
					gap: 6
				},
				children: [
					/* @__PURE__ */ jsx("span", {
						style: { opacity: .6 },
						children: "f ="
					}),
					" ",
					/* @__PURE__ */ jsx(Tex$1, { tex: model.fLatex })
				]
			}),
			model.dxLatex && /* @__PURE__ */ jsx(Tex$1, { tex: `\\frac{\\partial f}{\\partial x} = ${model.dxLatex}` }),
			model.dyLatex && /* @__PURE__ */ jsx(Tex$1, { tex: `\\frac{\\partial f}{\\partial y} = ${model.dyLatex}` })
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title: title || void 0,
		prompt: "Drag the start point, set the learning rate, and step downhill along −∇f. Too big a rate overshoots.",
		controls,
		footer,
		children: figure
	});
}

//#endregion
export { GradientDescent };