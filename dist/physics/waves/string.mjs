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

//#region src/physics/waves/string.tsx
/**
* StringReflectionLab, where standing waves COME FROM. Two lessons in one string:
*   • pulse, send a single bump down the string and watch it bounce off the end.
*     A FIXED end flips it (inverts); a FREE end sends it back upright. The string
*     itself is always incident + reflected added together (both shown faint).
*   • resonance, send a continuous wave; it reflects and superposes with itself.
*     At most frequencies the ends won't sit still, but at the special resonant
*     frequencies fₙ = n·c/2L the reflection locks in and a clean STANDING wave (the
*     nth harmonic) appears, nodes pinned to both ends. That's how a string sings.
*
* Exact boundary behaviour via the image method; animated on <CanvasLayer>,
* play-gated, reduced-motion aware. The standing-wave maths matches the wave kernel.
*/
const L = 10, C = 4, A = 1.5;
const view = {
	xMin: -.4,
	xMax: 10.4,
	yMin: -4,
	yMax: 4
};
const pulse = (u, sig = .7) => A * Math.exp(-(u * u) / (2 * sig * sig));
function StringReflectionLab({ mode: mode0 = "pulse", end: end0 = "fixed", frequency = .4, title = "Reflection & standing waves", prompt, objectives, hints: hintList, controlId, height = 300 }) {
	const [mode, setMode] = useState(mode0);
	const [end, setEnd] = useState(end0);
	const [f, setF] = useState(frequency);
	const [mounted, setMounted] = useState(false);
	const t = useRef(0);
	const hints = useHints(hintList);
	const gate = usePlayGate();
	useEffect(() => {
		setMounted(true);
	}, []);
	useFrameTick(gate.running && mounted, (frame) => {
		t.current += frame.dtMs / 1e3;
		if (mode === "pulse" && C * t.current > 24) t.current = 0;
	});
	const k = 2 * Math.PI * f / C;
	const nNear = Math.max(1, Math.round(k * L / Math.PI));
	const fRes = nNear * C / (2 * L);
	const resonant = Math.abs(f - fRes) < .012;
	const draw = (ctx, c) => {
		const css = getComputedStyle(ctx.canvas);
		const tok = (n, fb) => css.getPropertyValue(n).trim() || fb;
		const acc = tok("--stage-accent", "#1c7ed6"), warn = tok("--stage-warn", "#e8a020"), good = tok("--stage-good", "#2f9e44"), mut = tok("--stage-muted", "#888"), fg = tok("--stage-fg", "#222");
		const W = ctx.canvas.clientWidth || 640, H = height;
		ctx.clearRect(0, 0, W, H);
		const [, y0] = c.toPx(0, 0);
		const tt = t.current;
		ctx.strokeStyle = mut;
		ctx.globalAlpha = .4;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(c.toPx(0, 0)[0], y0);
		ctx.lineTo(c.toPx(L, 0)[0], y0);
		ctx.stroke();
		ctx.globalAlpha = 1;
		const plot = (fn, color, w, alpha = 1) => {
			ctx.strokeStyle = color;
			ctx.lineWidth = w;
			ctx.globalAlpha = alpha;
			ctx.beginPath();
			for (let i = 0; i <= 300; i++) {
				const x = i / 300 * L;
				const [px, py] = c.toPx(x, fn(x));
				i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
			}
			ctx.stroke();
			ctx.globalAlpha = 1;
		};
		let inc, ref;
		if (mode === "pulse") {
			const s = end === "fixed" ? -1 : 1;
			inc = (x) => pulse(x - 1 - C * tt);
			ref = (x) => s * pulse(2 * L - x - 1 - C * tt);
		} else {
			const om = 2 * Math.PI * f;
			inc = (x) => A * Math.sin(k * x - om * tt);
			ref = (x) => A * Math.sin(k * x + om * tt);
		}
		plot(inc, acc, 1.5, .4);
		plot(ref, warn, 1.5, .4);
		plot((x) => inc(x) + ref(x), good, 3);
		const wall = (xx) => {
			const [px] = c.toPx(xx, 0);
			ctx.strokeStyle = fg;
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(px, c.toPx(xx, 2.6)[1]);
			ctx.lineTo(px, c.toPx(xx, -2.6)[1]);
			ctx.stroke();
		};
		const ring = (xx) => {
			const [px] = c.toPx(xx, 0);
			ctx.strokeStyle = fg;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(px, y0, 7, 0, Math.PI * 2);
			ctx.stroke();
		};
		if (mode === "pulse") {
			ring(0);
			end === "fixed" ? wall(L) : ring(L);
		} else {
			wall(0);
			wall(L);
		}
		if (mode === "resonance" && resonant) for (let m = 0; m <= nNear; m++) {
			const xn = m * L / nNear;
			const [px] = c.toPx(xn, 0);
			ctx.fillStyle = warn;
			ctx.beginPath();
			ctx.arc(px, y0, 4, 0, Math.PI * 2);
			ctx.fill();
		}
	};
	useControlSurface(controlId, {
		mode: {
			type: "enum",
			label: "mode",
			options: ["pulse", "resonance"],
			get: () => mode,
			set: (m) => setMode(m)
		},
		end: {
			type: "enum",
			label: "end (pulse)",
			options: ["fixed", "free"],
			get: () => end,
			set: (e) => setEnd(e)
		},
		frequency: {
			type: "number",
			label: "frequency",
			min: .1,
			max: 1.6,
			step: .01,
			get: () => f,
			set: setF
		},
		snap: {
			type: "action",
			label: "snap to resonance",
			invoke: () => setF(fRes)
		}
	});
	const figure = /* @__PURE__ */ jsx(PlayWrap, {
		gate,
		children: /* @__PURE__ */ jsx("div", {
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
				ariaLabel: `${mode} on a string`
			})
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: mode === "pulse" ? /* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "lab-field-label",
					children: [end, " end"]
				}),
				/* @__PURE__ */ jsx("div", {
					style: {
						fontSize: 15,
						fontWeight: 800,
						color: end === "fixed" ? "var(--stage-warn)" : "var(--stage-good)"
					},
					children: end === "fixed" ? "reflects INVERTED" : "reflects UPRIGHT"
				}),
				/* @__PURE__ */ jsx("div", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)"
					},
					children: "green = incident + reflected (both faint)"
				})
			]
		}) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "lab-field-label",
					children: ["resonance ", /* @__PURE__ */ jsx(Tex$1, { tex: "f_n = \\tfrac{n c}{2L}" })]
				}),
				/* @__PURE__ */ jsx("span", {
					className: "lab-callout-big",
					style: { color: resonant ? "var(--stage-good)" : "var(--stage-fg)" },
					children: resonant ? `n = ${nNear} ✓` : "…"
				}),
				/* @__PURE__ */ jsxs("div", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)"
					},
					children: [
						"nearest harmonic ",
						/* @__PURE__ */ jsx(Tex$1, { tex: `f_{${nNear}}` }),
						" = ",
						fRes.toFixed(2)
					]
				})
			]
		}), /* @__PURE__ */ jsx("p", {
			className: "lab-prompt",
			style: { fontSize: 13 },
			children: resonant ? `Resonance! The reflection locks in, a clean ${nNear}-loop standing wave with nodes on both ends.` : "Off resonance: the ends won’t hold still. Nudge f toward a harmonic (or snap) until it locks."
		})] }),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "mode",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "flex",
					gap: 6
				},
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: mode === "pulse",
					onClick: () => setMode("pulse"),
					children: "pulse + reflect"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: mode === "resonance",
					onClick: () => setMode("resonance"),
					children: "standing / resonance"
				})]
			})
		}), mode === "pulse" ? /* @__PURE__ */ jsx(Field, {
			label: "end",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "flex",
					gap: 6
				},
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: end === "fixed",
					onClick: () => setEnd("fixed"),
					children: "fixed"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: end === "free",
					onClick: () => setEnd("free"),
					children: "free"
				})]
			})
		}) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Field, {
			label: "frequency",
			value: f.toFixed(2),
			children: /* @__PURE__ */ jsx(Slider, {
				value: f,
				min: .1,
				max: 1.6,
				step: .01,
				onChange: setF,
				ariaLabel: "frequency"
			})
		}), /* @__PURE__ */ jsxs(Chip, {
			selected: false,
			onClick: () => setF(fRes),
			children: ["snap to f", nNear]
		})] })] }),
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { StringReflectionLab };