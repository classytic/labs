'use client';

import { gaussian, mulberry32 } from "../../core/rng.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useHints } from "../../kit/pedagogy.mjs";
import { useCallback, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { CanvasLayer, useControlSurface } from "@classytic/stage";

//#region src/ml/knn/preset.tsx
/**
* KNNBoundaryLab, the answer to "a line can't split XOR." k-nearest-neighbours
* paints the whole plane by asking, at every point, "what are my k closest
* labelled neighbours, and which class wins the vote?" The boundary it carves is
* CURVY, it shrugs off XOR and even concentric rings that no straight line could
* touch. Drag the ✦ test point to watch its k neighbours light up and cast their
* votes; slide k to feel the trade-off: k=1 memorises every island (jagged,
* overfit), big k smooths everything (and starts ignoring real structure).
*
* The decision regions are a CanvasLayer heatmap (one vote per cell, exactly the
* high-element-count job canvas is for); points + neighbour spokes draw on top.
*/
const R = 5, A0 = "#1c7ed6", A1 = "#e8590c";
const view = {
	xMin: -5,
	xMax: R,
	yMin: -5,
	yMax: R
};
function makeData(kind, seed) {
	const rng = mulberry32(seed);
	const pts = [];
	const blob = (cx, cy, cls, k, sd = .8) => {
		for (let i = 0; i < k; i++) pts.push({
			x: gaussian(rng, cx, sd),
			y: gaussian(rng, cy, sd),
			cls
		});
	};
	if (kind === "blobs") {
		blob(-2, -1.5, 0, 16);
		blob(2, 1.5, 1, 16);
	} else if (kind === "xor") {
		blob(-2.2, 2.2, 0, 9);
		blob(2.2, -2.2, 0, 9);
		blob(2.2, 2.2, 1, 9);
		blob(-2.2, -2.2, 1, 9);
	} else {
		for (let i = 0; i < 16; i++) pts.push({
			x: gaussian(rng, 0, .7),
			y: gaussian(rng, 0, .7),
			cls: 1
		});
		for (let i = 0; i < 22; i++) {
			const a = rng() * Math.PI * 2, r = 3.4 + gaussian(rng, 0, .3);
			pts.push({
				x: Math.cos(a) * r,
				y: Math.sin(a) * r,
				cls: 0
			});
		}
	}
	return pts;
}
function KNNBoundaryLab({ dataset = "circles", k = 5, seed = 7, title = "k-nearest neighbours", prompt, objectives, hints: hintList, controlId, height = 330 }) {
	const [kind, setKind] = useState(dataset);
	const [pts, setPts] = useState(() => makeData(dataset, seed));
	const [kk, setKk] = useState(k);
	const [query, setQuery] = useState({
		x: .6,
		y: 1.2
	});
	const hints = useHints(hintList);
	const nearest = useCallback((x, y, kn, exclude = -1) => {
		const d = pts.map((p, i) => ({
			i,
			d2: (p.x - x) ** 2 + (p.y - y) ** 2
		})).filter((o) => o.i !== exclude);
		d.sort((a, b) => a.d2 - b.d2);
		return d.slice(0, kn).map((o) => o.i);
	}, [pts]);
	const vote = useCallback((idxs) => {
		let s = 0;
		for (const i of idxs) s += pts[i].cls;
		return s * 2 > idxs.length ? 1 : 0;
	}, [pts]);
	const acc = useMemo(() => {
		if (!pts.length) return 0;
		let ok = 0;
		for (let i = 0; i < pts.length; i++) if (vote(nearest(pts[i].x, pts[i].y, kk, i)) === pts[i].cls) ok++;
		return ok / pts.length;
	}, [
		pts,
		kk,
		nearest,
		vote
	]);
	const qNbrs = nearest(query.x, query.y, kk);
	const qCls = vote(qNbrs);
	const qCount1 = qNbrs.reduce((a, i) => a + pts[i].cls, 0);
	const draw = useCallback((ctx, c) => {
		const css = getComputedStyle(ctx.canvas);
		const tok = (s, fb) => css.getPropertyValue(s).trim() || fb;
		const fg = tok("--stage-fg", "#222"), bg = tok("--stage-bg", "#fff");
		const W = ctx.canvas.clientWidth || 640, H = height, CELL = 7;
		ctx.clearRect(0, 0, W, H);
		for (let px = 0; px < W; px += CELL) for (let py = 0; py < H; py += CELL) {
			const [mx, my] = c.toMath(px + CELL / 2, py + CELL / 2);
			ctx.fillStyle = vote(nearest(mx, my, kk)) ? A1 : A0;
			ctx.globalAlpha = .16;
			ctx.fillRect(px, py, 8, 8);
		}
		ctx.globalAlpha = 1;
		for (const p of pts) {
			const [x, y] = c.toPx(p.x, p.y);
			ctx.fillStyle = p.cls ? A1 : A0;
			ctx.strokeStyle = bg;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.arc(x, y, 4.5, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
		}
		const [qx, qy] = c.toPx(query.x, query.y);
		ctx.strokeStyle = fg;
		ctx.globalAlpha = .45;
		ctx.setLineDash([4, 3]);
		ctx.lineWidth = 1.2;
		for (const i of qNbrs) {
			const [nx, ny] = c.toPx(pts[i].x, pts[i].y);
			ctx.beginPath();
			ctx.moveTo(qx, qy);
			ctx.lineTo(nx, ny);
			ctx.stroke();
		}
		ctx.setLineDash([]);
		ctx.globalAlpha = 1;
		ctx.fillStyle = qCls ? A1 : A0;
		ctx.beginPath();
		ctx.arc(qx, qy, 7.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = fg;
		ctx.lineWidth = 2.5;
		ctx.stroke();
		ctx.fillStyle = bg;
		ctx.font = "bold 11px ui-sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("?", qx, qy);
	}, [
		pts,
		kk,
		query,
		qNbrs,
		qCls,
		height
	]);
	const loadData = useCallback((d) => {
		setKind(d);
		setPts(makeData(d, seed));
	}, [seed]);
	useControlSurface(controlId, {
		dataset: {
			type: "enum",
			label: "dataset",
			options: [
				"blobs",
				"xor",
				"circles"
			],
			get: () => kind,
			set: (v) => loadData(v)
		},
		k: {
			type: "number",
			label: "k (neighbours)",
			min: 1,
			max: 15,
			step: 2,
			get: () => kk,
			set: setKk
		}
	});
	const vw = useMemo(() => view, []);
	const clampX = (x) => Math.max(view.xMin, Math.min(view.xMax, x));
	const clampY = (y) => Math.max(view.yMin, Math.min(view.yMax, y));
	const KEY_STEP = .25;
	const onKeyDown = useCallback((e) => {
		let dx = 0, dy = 0;
		if (e.key === "ArrowLeft") dx = -.25;
		else if (e.key === "ArrowRight") dx = KEY_STEP;
		else if (e.key === "ArrowUp") dy = KEY_STEP;
		else if (e.key === "ArrowDown") dy = -.25;
		else return;
		e.preventDefault();
		setQuery((q) => ({
			x: clampX(q.x + dx),
			y: clampY(q.y + dy)
		}));
	}, []);
	const figure = /* @__PURE__ */ jsx("div", {
		tabIndex: 0,
		role: "application",
		"aria-label": `k-NN decision boundary, k ${kk}. Test point predicts class ${qCls ? "B" : "A"}. Accuracy ${(acc * 100).toFixed(0)} percent. Use arrow keys to move the test point.`,
		onKeyDown,
		style: {
			outline: "none",
			borderRadius: 6,
			position: "relative"
		},
		onFocus: (e) => {
			e.currentTarget.style.outline = "2px solid var(--stage-accent, #1c7ed6)";
			e.currentTarget.style.outlineOffset = "2px";
		},
		onBlur: (e) => {
			e.currentTarget.style.outline = "none";
		},
		children: /* @__PURE__ */ jsx(CanvasLayer, {
			view: vw,
			height,
			draw,
			onPointerMath: (m) => setQuery({
				x: clampX(m[0]),
				y: clampY(m[1])
			}),
			ariaLabel: `k-NN boundary, k ${kk}, accuracy ${(acc * 100).toFixed(0)}%`
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [
				/* @__PURE__ */ jsx("span", {
					style: { color: A0 },
					children: "● class A"
				}),
				"  ",
				/* @__PURE__ */ jsx("span", {
					style: { color: A1 },
					children: "● class B"
				}),
				/* @__PURE__ */ jsxs("div", {
					style: { color: "var(--stage-accent)" },
					children: [
						"✦ votes: ",
						kk - qCount1,
						" A vs ",
						qCount1,
						" B → ",
						/* @__PURE__ */ jsx("span", {
							style: { color: qCls ? A1 : A0 },
							children: qCls ? "B" : "A"
						})
					]
				}),
				/* @__PURE__ */ jsxs("span", {
					className: "lab-callout-big",
					style: { color: acc === 1 ? "var(--stage-good)" : "var(--stage-accent)" },
					children: [
						"LOO accuracy ",
						(acc * 100).toFixed(1),
						"%"
					]
				})
			]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "k (neighbours)",
				value: /* @__PURE__ */ jsx("b", { children: kk }),
				children: /* @__PURE__ */ jsx(Slider, {
					value: kk,
					min: 1,
					max: 15,
					step: 2,
					onChange: setKk,
					ariaLabel: "number of neighbours"
				})
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: "data:"
			}),
			[
				"blobs",
				"xor",
				"circles"
			].map((d) => /* @__PURE__ */ jsx(Chip, {
				selected: kind === d,
				onClick: () => loadData(d),
				children: d
			}, d)),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: "· drag the ✦ test point"
			})
		] }),
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { KNNBoundaryLab };