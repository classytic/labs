'use client';

import { createContext, useContext } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/frame.tsx
/**
* LabFrame, the shared layout shell every lab composes into, so labs stop being
* hand-rolled inline-styled one-offs and read as ONE product. Structure:
*
*   title + one-line prompt           (header, no walls of text)
*   [▸ goals]                         (collapsed disclosure, reveal-on-action)
*   ┌─ figure (dominant) ─┬─ aside ─┐ (one grid; aside optional + narrow)
*   └─────────────────────┴─────────┘
*   [ one controls bar ]             (ALL knobs in one place, never scattered)
*   feedback / hints / reveal        (quiet footer)
*
* Everything styles off `.lab-*` in @classytic/labs/styles.css, no inline layout.
* Pair with the existing pedagogy kit (HintLadder, RevealSolution, Feedback).
*
* CREATOR CONTROL, `controlConfig` lets the author decide, per knob, what a learner
* may touch: `{ hide: ['mass'], lock: ['angle'] }`. Hidden knobs vanish; locked knobs
* stay visible but read-only (their value is whatever the creator set as the initial
* prop). LabFrame provides this as context; `Field` (keyed by its `name ?? label`) and
* the `Control` wrapper consume it, so a lab opts in with ~2 lines and every knob,
* existing or new, honours it. The mechanism is uniform: no per-knob boolean props.
*/
const ControlCtx = createContext(void 0);
/** Resolve a single control's state from the surrounding `controlConfig`. */
function useControlOverride(name) {
	const cfg = useContext(ControlCtx);
	return {
		hide: !!cfg?.hide?.includes(name),
		lock: !!cfg?.lock?.includes(name)
	};
}
const INERT = { inert: true };
function LabFrame({ title, prompt, objectives, children, aside, controls, footer, rootRef, controlConfig }) {
	return /* @__PURE__ */ jsx(ControlCtx.Provider, {
		value: controlConfig,
		children: /* @__PURE__ */ jsxs("div", {
			ref: rootRef,
			className: "not-prose lab-frame",
			children: [
				(title || prompt) && /* @__PURE__ */ jsxs("div", {
					className: "lab-frame-head",
					children: [title && /* @__PURE__ */ jsx("p", {
						className: "lab-title",
						children: title
					}), prompt && /* @__PURE__ */ jsx("p", {
						className: "lab-prompt",
						children: prompt
					})]
				}),
				objectives && objectives.length > 0 && /* @__PURE__ */ jsxs("details", {
					className: "lab-goals",
					children: [/* @__PURE__ */ jsx("summary", { children: "What you'll learn" }), /* @__PURE__ */ jsx("ul", { children: objectives.map((o, i) => /* @__PURE__ */ jsx("li", { children: o }, i)) })]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "lab-body",
					"data-aside": aside ? "true" : "false",
					children: [/* @__PURE__ */ jsx("div", {
						className: "lab-figure",
						children
					}), aside && /* @__PURE__ */ jsx("div", {
						className: "lab-aside",
						children: aside
					})]
				}),
				controls && /* @__PURE__ */ jsx("div", {
					className: "lab-controls",
					children: controls
				}),
				footer && /* @__PURE__ */ jsx("div", {
					className: "lab-foot",
					children: footer
				})
			]
		})
	});
}
/** The single controls bar. Put `Field`s (or any control) inside. */
function ControlBar({ children }) {
	return /* @__PURE__ */ jsx(Fragment$1, { children });
}
/**
* Group an inline expression (parens, steppers, "→ result", …) so it reads as ONE
* unit. `.lab-controls` is a grid that gives EACH ControlBar child its own ~185px
* cell, which scatters a multi-piece expression across columns. Wrap those pieces
* in `<ControlExpr>` and they stay together (one cell, tight gaps, baseline-aligned).
*/
function ControlExpr({ children }) {
	return /* @__PURE__ */ jsx("span", {
		style: {
			gridColumn: "1 / -1",
			display: "flex",
			alignItems: "center",
			flexWrap: "wrap",
			gap: 8,
			fontWeight: 600
		},
		children
	});
}
const LockMark = () => /* @__PURE__ */ jsxs("svg", {
	className: "lab-field-lock",
	viewBox: "0 0 24 24",
	"aria-hidden": "true",
	focusable: "false",
	children: [/* @__PURE__ */ jsx("rect", {
		x: "5",
		y: "11",
		width: "14",
		height: "9",
		rx: "2",
		fill: "currentColor"
	}), /* @__PURE__ */ jsx("path", {
		d: "M8 11V8a4 4 0 0 1 8 0v3",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2"
	})]
});
/**
* A labelled control: small-caps label + (control + value) on one row.
* Participates in creator `controlConfig` via `name ?? label`.
*/
function Field({ label, name, value, children }) {
	const { hide, lock } = useControlOverride(name ?? label);
	if (hide) return null;
	return /* @__PURE__ */ jsxs("span", {
		className: "lab-field",
		"data-locked": lock ? "true" : void 0,
		children: [/* @__PURE__ */ jsxs("span", {
			className: "lab-field-label",
			children: [label, lock && /* @__PURE__ */ jsx(LockMark, {})]
		}), /* @__PURE__ */ jsxs("span", {
			className: "lab-field-row",
			children: [lock ? /* @__PURE__ */ jsx("span", {
				className: "lab-locked-wrap",
				...INERT,
				children
			}) : children, value != null && /* @__PURE__ */ jsx("span", {
				className: "lab-field-val",
				children: value
			})]
		})]
	});
}
/**
* Wrap any non-Field control (a toggle, an action button) so it honours the creator's
* hide/lock policy too: `<Control name="components"><Chip…/></Control>`.
*/
function Control({ name, children }) {
	const { hide, lock } = useControlOverride(name);
	if (hide) return null;
	if (!lock) return /* @__PURE__ */ jsx(Fragment$1, { children });
	return /* @__PURE__ */ jsx("span", {
		className: "lab-locked-wrap",
		...INERT,
		children
	});
}
/** A highlighted readout box. `tone="result"` for the headline answer. */
function Callout({ tone, children }) {
	return /* @__PURE__ */ jsx("div", {
		className: "lab-callout",
		"data-tone": tone ?? "info",
		children
	});
}
const SR_ONLY = {
	position: "absolute",
	width: 1,
	height: 1,
	overflow: "hidden",
	clipPath: "inset(50%)"
};
/** Visually-hidden polite live region for screen-reader narration of a changing value. */
function LiveRegion({ children }) {
	return /* @__PURE__ */ jsx("div", {
		"aria-live": "polite",
		style: SR_ONLY,
		children
	});
}
/**
* A labelled progress/energy bar: `frac` (0–1) fills it, `value` is the right-hand
* readout. Replaces the hand-rolled bars in collision/energy/impulse/etc.
*/
function MeterBar({ label, frac, color, value }) {
	const pct = Math.max(0, Math.min(1, frac)) * 100;
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			justifyContent: "space-between",
			fontSize: 11,
			fontWeight: 700,
			color: "var(--stage-muted)"
		},
		children: [/* @__PURE__ */ jsx("span", { children: label }), value != null && /* @__PURE__ */ jsx("span", {
			style: { fontVariantNumeric: "tabular-nums" },
			children: value
		})]
	}), /* @__PURE__ */ jsx("div", {
		style: {
			height: 12,
			borderRadius: 6,
			background: "color-mix(in oklab, var(--stage-muted) 18%, transparent)",
			overflow: "hidden",
			marginTop: 3
		},
		children: /* @__PURE__ */ jsx("div", { style: {
			width: `${pct}%`,
			height: "100%",
			background: color,
			borderRadius: 6,
			transition: "width 0.1s"
		} })
	})] });
}

//#endregion
export { Callout, Control, ControlBar, ControlExpr, Field, LabFrame, LiveRegion, MeterBar };