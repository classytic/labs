'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useHints } from "../../kit/pedagogy.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { useEffect, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { CanvasLayer, useControlSurface } from "@classytic/stage";

//#region src/physics/waves/ripple.tsx
/**
* RippleTankLab, two-source interference in 2-D, the famous ripple tank. Two point
* sources send out circular waves; where crests meet crests the water heaves
* (CONSTRUCTIVE, a bright antinodal line, path difference = nλ) and where a crest
* meets a trough it goes flat (DESTRUCTIVE, a dark nodal line, Δ = (n+½)λ). Drag the
* sources, change the wavelength, and the fan of interference fringes opens and
* closes. Two views: "ripples" (the live animated field) and "fringes" (the static
* interference amplitude, crisp bright/dark hyperbolas).
*
* A genuine per-cell field → CanvasLayer heatmap. Distances are in pixels so the
* wavefronts stay circular regardless of the box's aspect. Honours reduced-motion.
*/
const VIEW = {
	xMin: 0,
	xMax: 1,
	yMin: 0,
	yMax: 1
};
function RippleTankLab({ wavelength = .1, view: view0 = "ripples", title = "Ripple tank: two-source interference", prompt, objectives, hints: hintList, controlId, height = 320 }) {
	const [lam, setLam] = useState(wavelength);
	const [view, setView] = useState(view0);
	const [mounted, setMounted] = useState(false);
	const t = useRef(0);
	const hints = useHints(hintList);
	const gate = usePlayGate();
	const s1 = useRef({
		x: .35,
		y: .5
	});
	const s2 = useRef({
		x: .65,
		y: .5
	});
	const drag = useRef(null);
	useEffect(() => {
		setMounted(true);
	}, []);
	useEffect(() => {
		const up = () => {
			drag.current = null;
		};
		window.addEventListener("pointerup", up);
		return () => window.removeEventListener("pointerup", up);
	}, []);
	const repaint = useFrameTick(gate.running && mounted && view === "ripples", (frame) => {
		t.current += frame.dtMs / 1e3;
	});
	const draw = (ctx, _c) => {
		const W = ctx.canvas.clientWidth || 640, H = height, CELL = 4;
		const lamPx = Math.max(8, lam * W), k = 2 * Math.PI / lamPx, om = 2 * Math.PI * .7, tt = t.current;
		const p1 = {
			x: s1.current.x * W,
			y: (1 - s1.current.y) * H
		};
		const p2 = {
			x: s2.current.x * W,
			y: (1 - s2.current.y) * H
		};
		for (let px = 0; px < W; px += CELL) for (let py = 0; py < H; py += CELL) {
			const r1 = Math.hypot(px - p1.x, py - p1.y), r2 = Math.hypot(px - p2.x, py - p2.y);
			let L;
			if (view === "ripples") L = 50 + (Math.sin(k * r1 - om * tt) + Math.sin(k * r2 - om * tt)) / 2 * 40;
			else L = 8 + Math.abs(Math.cos(k * (r1 - r2) / 2)) * 82;
			ctx.fillStyle = `hsl(205 68% ${L.toFixed(0)}%)`;
			ctx.fillRect(px, py, 5, 5);
		}
		for (const p of [p1, p2]) {
			ctx.fillStyle = "#fff";
			ctx.strokeStyle = "#111";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
		}
	};
	const pick = (m) => {
		drag.current = Math.hypot(m[0] - s1.current.x, m[1] - s1.current.y) <= Math.hypot(m[0] - s2.current.x, m[1] - s2.current.y) ? 0 : 1;
		move(m);
	};
	const move = (m) => {
		const s = drag.current === 0 ? s1 : s2;
		s.current = {
			x: Math.max(.04, Math.min(.96, m[0])),
			y: Math.max(.06, Math.min(.94, m[1]))
		};
		repaint();
	};
	useControlSurface(controlId, {
		wavelength: {
			type: "number",
			label: "wavelength",
			min: .05,
			max: .2,
			step: .005,
			get: () => lam,
			set: setLam
		},
		view: {
			type: "enum",
			label: "view",
			options: ["ripples", "fringes"],
			get: () => view,
			set: (v) => setView(v)
		},
		run: {
			type: "action",
			label: gate.playing ? "pause" : "play",
			invoke: () => gate.setPlaying(!gate.playing)
		}
	});
	const figure = /* @__PURE__ */ jsx(PlayWrap, {
		gate,
		children: /* @__PURE__ */ jsx("div", {
			style: {
				borderRadius: 14,
				overflow: "hidden",
				background: "#0b1726",
				border: "1px solid var(--stage-grid)"
			},
			children: /* @__PURE__ */ jsx(CanvasLayer, {
				view: VIEW,
				height,
				draw,
				onPointerMath: (m) => {
					if (drag.current == null) pick(m);
					else move(m);
				},
				ariaLabel: "ripple tank two-source interference"
			})
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [/* @__PURE__ */ jsx("div", {
				className: "lab-field-label",
				style: { marginBottom: 6 },
				children: "interference"
			}), /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 6,
					fontSize: 14,
					fontWeight: 700
				},
				children: [/* @__PURE__ */ jsxs("span", { children: [
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-good)" },
						children: "bright"
					}),
					", crests meet · ",
					/* @__PURE__ */ jsx(Tex$1, { tex: "\\Delta = n\\lambda" })
				] }), /* @__PURE__ */ jsxs("span", { children: [
					/* @__PURE__ */ jsx("span", {
						style: { color: "var(--stage-accent)" },
						children: "dark"
					}),
					", crest + trough · ",
					/* @__PURE__ */ jsx(Tex$1, { tex: "\\Delta = \\left(n + \\tfrac12\\right)\\lambda" })
				] })]
			})]
		}), /* @__PURE__ */ jsxs("p", {
			className: "lab-prompt",
			style: { fontSize: 13 },
			children: [
				view === "fringes" ? "Static interference pattern: the bright hyperbolas are where the two waves always reinforce; the dark ones where they always cancel." : "Live ripples, watch crests collide. The still (grey) lines between the churn are where the waves cancel.",
				" ",
				"Shorter wavelength or wider sources → more, tighter fringes."
			]
		})] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "view",
				children: /* @__PURE__ */ jsxs("span", {
					style: {
						display: "flex",
						gap: 6
					},
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: view === "ripples",
						onClick: () => setView("ripples"),
						children: "ripples"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: view === "fringes",
						onClick: () => setView("fringes"),
						children: "fringes"
					})]
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "wavelength",
				value: lam.toFixed(3),
				children: /* @__PURE__ */ jsx(Slider, {
					value: lam,
					min: .05,
					max: .2,
					step: .005,
					onChange: setLam,
					ariaLabel: "wavelength"
				})
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)"
				},
				children: "drag the two white sources ↔ · ▶ play to animate"
			})
		] }),
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { RippleTankLab };