'use client';

import { clamp } from "../core/util.mjs";
import { CheckButton, Chip, Slider } from "../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../kit/frame.mjs";
import { ReactionFlow } from "../kit/reaction.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Circle, Label, Segment, Stage, useFrameLoop, useInView } from "@classytic/stage";

//#region src/chem/reaction-lab.tsx
/**
* ReactionLab, a synthesis reaction as moving atoms: A + B collide and bond into
* A–B. Raise the temperature and they collide harder/more often (kinetics); press
* React to run it. Atoms are conserved, none created or destroyed, just
* rearranged.
*
* Now on the @classytic/stage engine (SVG, accessible, themed).
*/
const VIEW = {
	xMin: -10,
	xMax: 10,
	yMin: -6,
	yMax: 6
};
const R = 1.7;
function ReactionLab({ a = "A", b = "B", title = "A + B → A–B", height = 300 } = {}) {
	const [temp, setTemp] = useState(1);
	const [playing, setPlaying] = useState(false);
	const [bonded, setBonded] = useState(false);
	const [p, setP] = useState(0);
	const { ref: viewRef, inView } = useInView();
	useFrameLoop((f) => {
		setP((prev) => {
			const next = clamp(prev + f.dtMs / 1e3 * .35 * temp, 0, 1);
			if (next >= 1 && !bonded) {
				setBonded(true);
				setPlaying(false);
			}
			return next;
		});
	}, { running: playing && !bonded && inView });
	const reset = () => {
		setP(0);
		setBonded(false);
		setPlaying(false);
	};
	const jit = (1 - p) * 1.2 * temp;
	const apartGap = 5.2;
	const cxA = -5.2 * (1 - p) - R * p * .9;
	const cxB = apartGap * (1 - p) + R * p * .9;
	const yA = Math.sin(p * 9) * jit;
	const yB = -Math.sin(p * 9) * jit;
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ReactionFlow, {
		reactants: [{ kind: "A" }, { kind: "B" }],
		products: [{ kind: "AB" }],
		height: 60,
		molSize: 24,
		ariaLabel: `${a} + ${b} react to form ${a}${b}`
	}), /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		children: /* @__PURE__ */ jsxs(Stage, {
			view: VIEW,
			height,
			ariaLabel: `${a} and ${b} ${p > .95 ? "bonded into a product" : "as reactants"}`,
			children: [
				p > .8 && /* @__PURE__ */ jsx(Segment, {
					from: {
						x: cxA + R,
						y: yA
					},
					to: {
						x: cxB - R,
						y: yB
					},
					color: "var(--stage-fg)",
					weight: 3
				}),
				/* @__PURE__ */ jsx(Circle, {
					center: {
						x: cxA,
						y: yA
					},
					r: R,
					color: "var(--stage-accent)",
					fill: "var(--stage-accent)",
					fillOpacity: 1,
					weight: 0
				}),
				/* @__PURE__ */ jsx(Label, {
					x: cxA,
					y: yA,
					text: a,
					color: "var(--stage-bg)",
					size: 18,
					weight: 700
				}),
				/* @__PURE__ */ jsx(Circle, {
					center: {
						x: cxB,
						y: yB
					},
					r: R,
					color: "var(--stage-accent-2)",
					fill: "var(--stage-accent-2)",
					fillOpacity: 1,
					weight: 0
				}),
				/* @__PURE__ */ jsx(Label, {
					x: cxB,
					y: yB,
					text: b,
					color: "var(--stage-bg)",
					size: 18,
					weight: 700
				}),
				/* @__PURE__ */ jsx(Label, {
					x: 0,
					y: VIEW.yMin + .8,
					text: p > .95 ? `${a}–${b} (product)` : `${a} + ${b} (reactants)`,
					color: "var(--stage-fg)",
					size: 13
				})
			]
		})
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: "Atoms rearrange, none are created or destroyed. Raise the temperature to react faster.",
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: bonded ? "product" : playing ? "reacting…" : "reactants"
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(CheckButton, {
				onClick: () => {
					if (bonded) reset();
					setPlaying(true);
				},
				children: bonded ? "Run again" : "React"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: false,
				onClick: reset,
				children: "Reset"
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "temperature",
				children: /* @__PURE__ */ jsx(Slider, {
					value: temp,
					min: .3,
					max: 3,
					step: .1,
					onChange: setTemp,
					ariaLabel: "temperature",
					style: { width: 120 }
				})
			})
		] }),
		children: figure
	});
}

//#endregion
export { ReactionLab };