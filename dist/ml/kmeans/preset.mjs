'use client';

import { CheckButton, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Circle, Dot, Grid, MovableDot, Segment, Stage, useFrameLoop, useInView } from "@classytic/stage";

//#region src/ml/kmeans/preset.tsx
/**
* KMeansLab, unsupervised clustering you can watch converge. Points sit in a few
* blobs; you drag the k centroids to seed them, then Step (Lloyd's algorithm):
* every point recolours to its nearest centroid, and each centroid jumps to the
* mean of its cluster. Run animates it, centroids migrate into the blobs, the
* within-cluster error (inertia) drops, and it stops when nothing moves. Seed the
* centroids badly on purpose and you land in a worse local minimum, the key
* k-means intuition that initialisation matters.
*
* Pure stage primitives: Dot (coloured by assignment) + MovableDot (centroids) +
* useFrameLoop (throttled stepping). Isometric square view (SSR-safe).
*/
const COLORS = [
	"var(--stage-accent)",
	"var(--stage-good)",
	"var(--stage-danger)",
	"var(--stage-warn)",
	"var(--stage-accent-2)"
];
const OFFS = [
	[-.8, .5],
	[.6, .9],
	[-.4, -.7],
	[.9, -.3],
	[.1, .6],
	[-.9, -.2],
	[.5, -.85]
];
const DEFAULT_POINTS = [
	[2.6, 7.2],
	[7.4, 7.6],
	[5, 2.7]
].flatMap(([cx, cy]) => OFFS.map(([dx, dy]) => ({
	x: cx + dx,
	y: cy + dy
})));
const DEFAULT_SEEDS = [
	{
		x: 3.5,
		y: 5.5
	},
	{
		x: 6.5,
		y: 6
	},
	{
		x: 5,
		y: 4
	}
];
const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
function KMeansLab({ points = DEFAULT_POINTS, k = 3, seeds, span = 10, showLines = true, title = "k-means: watch the clusters form", prompt = "Drag the centroids to seed them, then Step: points recolour to the nearest centroid, centroids jump to their cluster mean. Seed them badly and you get stuck in a worse answer.", objectives, height = 380 }) {
	const view = {
		xMin: 0,
		xMax: span,
		yMin: 0,
		yMax: span
	};
	const [cents, setCents] = useState((seeds ?? DEFAULT_SEEDS).slice(0, k));
	const [running, setRunning] = useState(false);
	const [iter, setIter] = useState(0);
	const [converged, setConverged] = useState(false);
	const { ref: viewRef, inView } = useInView();
	useCheckpoint({
		solved: converged,
		activity: "kmeans"
	});
	const assign = (cs) => points.map((p) => {
		let best = 0, bd = Infinity;
		cs.forEach((c, j) => {
			const dd = d2(c, p);
			if (dd < bd) {
				bd = dd;
				best = j;
			}
		});
		return best;
	});
	const labels = useMemo(() => assign(cents), [cents, points]);
	const inertia = useMemo(() => points.reduce((s, p, i) => s + d2(cents[labels[i]], p), 0), [
		cents,
		labels,
		points
	]);
	const stepOnce = (cs) => {
		const lab = assign(cs);
		return cs.map((c, j) => {
			const mine = points.filter((_, i) => lab[i] === j);
			if (!mine.length) return c;
			return {
				x: mine.reduce((s, p) => s + p.x, 0) / mine.length,
				y: mine.reduce((s, p) => s + p.y, 0) / mine.length
			};
		});
	};
	const moved = (a, b) => a.reduce((m, c, i) => Math.max(m, Math.hypot(c.x - b[i].x, c.y - b[i].y)), 0);
	const step = () => {
		setCents((cs) => {
			const nx = stepOnce(cs);
			if (moved(cs, nx) < .02) {
				setRunning(false);
				setConverged(true);
			}
			return nx;
		});
		setIter((i) => i + 1);
	};
	const acc = useRef(0);
	useFrameLoop((f) => {
		acc.current += f.dtMs;
		if (acc.current >= 320) {
			acc.current = 0;
			step();
		}
	}, { running: running && inView });
	const reset = () => {
		setCents((seeds ?? DEFAULT_SEEDS).slice(0, k));
		setIter(0);
		setRunning(false);
		setConverged(false);
	};
	const dragCent = (j, p) => {
		setRunning(false);
		setConverged(false);
		setCents((cs) => cs.map((c, i) => i === j ? p : c));
	};
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		children: /* @__PURE__ */ jsxs(Stage, {
			view,
			height,
			ariaLabel: `k-means with ${k} clusters; inertia ${inertia.toFixed(1)}`,
			children: [
				/* @__PURE__ */ jsx(Grid, {}),
				showLines && points.map((p, i) => {
					const c = cents[labels[i]];
					return /* @__PURE__ */ jsx(Segment, {
						from: {
							x: p.x,
							y: p.y
						},
						to: {
							x: c.x,
							y: c.y
						},
						color: COLORS[labels[i] % COLORS.length],
						weight: 1,
						opacity: .25
					}, `l${i}`);
				}),
				points.map((p, i) => /* @__PURE__ */ jsx(Dot, {
					x: p.x,
					y: p.y,
					r: 5,
					color: COLORS[labels[i] % COLORS.length]
				}, i)),
				cents.map((c, j) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx(Circle, {
					center: {
						x: c.x,
						y: c.y
					},
					r: .45,
					color: COLORS[j % COLORS.length],
					fill: "none",
					weight: 2
				}), /* @__PURE__ */ jsx(MovableDot, {
					value: c,
					onMove: (p) => dragCent(j, p),
					r: 9,
					color: COLORS[j % COLORS.length],
					ariaLabel: `centroid ${j + 1}`
				})] }, `c${j}`))
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: () => setRunning((r) => !r),
				children: running ? "⏸ Pause" : "▶ Run"
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
				onClick: reset,
				children: "Reset"
			}),
			/* @__PURE__ */ jsxs("span", {
				style: {
					fontWeight: 700,
					fontVariantNumeric: "tabular-nums"
				},
				children: ["inertia ", /* @__PURE__ */ jsx("b", {
					style: { fontSize: 17 },
					children: inertia.toFixed(1)
				})]
			}),
			/* @__PURE__ */ jsx(StatusPill, {
				ok: !running && iter > 0,
				children: !running && iter > 0 ? "converged" : `step ${iter}`
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					marginLeft: "auto",
					color: "var(--stage-muted)"
				},
				children: "drag a centroid to re-seed"
			})
		] }),
		footer: /* @__PURE__ */ jsx(LiveRegion, { children: `Step ${iter}. Inertia ${inertia.toFixed(1)}.` }),
		children: figure
	});
}

//#endregion
export { KMeansLab };