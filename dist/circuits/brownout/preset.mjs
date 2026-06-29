'use client';

import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { Tag, Wire } from "../../kit/electronics.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { solveDC } from "@classytic/stage/circuit";

//#region src/circuits/brownout/preset.tsx
/**
* BrownoutLab — what a falling supply voltage does to digital logic. A CMOS gate only switches
* when its transistors can turn on, and that needs the supply rail VDD to stay above the
* threshold Vth. Drag the battery EMF down (a draining cell, a sagging rail) and the engine solves
* the gate's output: with a healthy supply it swings rail to rail (valid 1 / 0); as VDD falls
* toward Vth the swing collapses and the output can no longer follow the input, so it is no longer
* a valid 1 or 0. That is a brown-out: the chip is not broken, it is simply starved of voltage, and
* this is the bridge from EMF and
* the battery to whether a logic circuit works at all.
*/
const K = .5;
const C_HEALTHY = "var(--stage-good)";
const C_MARGINAL = "var(--stage-warn, oklch(0.78 0.15 80))";
const C_DEAD = "var(--stage-danger)";
const W = 460, H = 250;
function BrownoutLab({ vth = 2, vmax = 6, title = "Brown-out: when the supply is too low to think", prompt = "Drag the battery EMF down. The CMOS gate only switches while the supply rail VDD stays above the transistor threshold. As VDD falls toward Vth the output, solved by the engine, loses its swing and can no longer follow the input: a brown-out, where the logic is no longer a valid 1 or 0.", ask, activity = "brownout" } = {}) {
	const [vdd, setVdd] = useState(5);
	const [A, setA] = useState(1);
	const ch = useChallenge(BROWNOUT_Q);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: "brownout:predict"
	});
	const inv = (vddV, aV) => [
		{
			kind: "V",
			n1: 1,
			n2: 0,
			value: vddV
		},
		{
			kind: "V",
			n1: 3,
			n2: 0,
			value: aV
		},
		{
			kind: "M",
			pmos: true,
			n1: 2,
			n2: 1,
			n3: 3,
			value: 0,
			vth,
			k: K
		},
		{
			kind: "M",
			n1: 2,
			n2: 0,
			n3: 3,
			value: 0,
			vth,
			k: K
		}
	];
	const yAt = (aV) => solveDC(inv(vdd, aV)).nodeV[2] ?? 0;
	const Yhigh = yAt(0);
	const Ylow = yAt(vdd);
	const Y = yAt(A ? vdd : 0);
	const swing = Yhigh - Ylow;
	const swingFrac = vdd > .05 ? swing / vdd : 0;
	const SAFE = 1.5 * vth;
	const collapsed = swingFrac <= .5;
	const zone = collapsed ? "dead" : vdd < SAFE ? "marginal" : "healthy";
	const zoneColor = zone === "healthy" ? C_HEALTHY : zone === "marginal" ? C_MARGINAL : C_DEAD;
	const valid = !collapsed;
	const level = collapsed ? "invalid" : Y > vdd / 2 ? "1" : "0";
	const GX = 70, GTOP = 40, GBOT = 210, GW = 26;
	const y = (v) => GBOT - Math.min(v, vmax) / vmax * (GBOT - GTOP);
	const band = (lo, hi, color) => /* @__PURE__ */ jsx("rect", {
		x: GX,
		y: y(hi),
		width: GW,
		height: Math.max(0, y(lo) - y(hi)),
		fill: color,
		opacity: .32
	});
	const gx = 250, gy = 125;
	const scene = /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 12,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			maxWidth: W,
			margin: "0 auto"
		},
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			width: "100%",
			role: "img",
			"aria-label": `Brown-out demo, supply ${vdd.toFixed(1)} volts, logic ${zone === "healthy" ? "valid" : zone === "marginal" ? "marginal" : "invalid"}`,
			children: [
				band(0, vth, C_DEAD),
				band(vth, SAFE, C_MARGINAL),
				band(SAFE, vmax, C_HEALTHY),
				/* @__PURE__ */ jsx("rect", {
					x: GX,
					y: GTOP,
					width: GW,
					height: GBOT - GTOP,
					fill: "none",
					stroke: "var(--stage-grid)",
					strokeWidth: 1,
					rx: 4
				}),
				/* @__PURE__ */ jsx("line", {
					x1: GX - 4,
					y1: y(vth),
					x2: 100,
					y2: y(vth),
					stroke: C_DEAD,
					strokeWidth: 1,
					strokeDasharray: "3 3"
				}),
				/* @__PURE__ */ jsx("line", {
					x1: GX - 4,
					y1: y(SAFE),
					x2: 100,
					y2: y(SAFE),
					stroke: C_HEALTHY,
					strokeWidth: 1,
					strokeDasharray: "3 3"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 104,
					y: y(vth) + 4,
					text: `Vth ${vth}V`,
					color: "var(--stage-muted)",
					size: 10,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 104,
					y: y(SAFE) + 4,
					text: "safe",
					color: "var(--stage-muted)",
					size: 10,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx("rect", {
					x: GX,
					y: y(vdd),
					width: GW,
					height: GBOT - y(vdd),
					fill: zoneColor,
					opacity: .85
				}),
				/* @__PURE__ */ jsx("polygon", {
					points: `${GX - 12},${y(vdd) - 6} ${GX - 12},${y(vdd) + 6} ${GX - 2},${y(vdd)}`,
					fill: zoneColor
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 83,
					y: GTOP - 8,
					text: "VDD",
					color: "var(--stage-fg)",
					size: 12,
					weight: 800,
					anchor: "middle"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 83,
					y: 226,
					text: `${vdd.toFixed(1)} V`,
					color: zoneColor,
					size: 13,
					weight: 800,
					anchor: "middle"
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [
						[96, y(vdd)],
						[gx, y(vdd)],
						[gx, gy - 34]
					],
					live: vdd > .05
				}),
				/* @__PURE__ */ jsx("polygon", {
					points: `${gx},${gy - 26} ${gx},151 290,${gy}`,
					fill: "color-mix(in oklab, var(--stage-metal, gray) 18%, var(--stage-bg))",
					stroke: "var(--stage-fg)",
					strokeWidth: 1.5
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: 296,
					cy: gy,
					r: 5,
					fill: "var(--stage-bg)",
					stroke: "var(--stage-fg)",
					strokeWidth: 1.5
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 270,
					y: 129,
					text: "NOT",
					color: "var(--stage-fg)",
					size: 10,
					weight: 700,
					anchor: "middle"
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[gx - 36, gy], [gx, gy]],
					live: !!A
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: gx - 40,
					cy: gy,
					r: 4.5,
					fill: A ? C_HEALTHY : "var(--stage-muted)"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: gx - 40,
					y: gy - 10,
					text: `A=${A}`,
					color: "var(--stage-fg)",
					size: 11,
					weight: 700,
					anchor: "middle"
				}),
				/* @__PURE__ */ jsx(Wire, {
					points: [[301, gy], [346, gy]],
					live: valid && level === "1"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: 350,
					cy: gy,
					r: 5,
					fill: level === "invalid" ? C_DEAD : level === "1" ? C_HEALTHY : "var(--stage-muted)"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 358,
					y: gy - 8,
					text: "Y",
					color: "var(--stage-fg)",
					size: 12,
					weight: 700,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 358,
					y: 137,
					text: level === "invalid" ? "?" : level,
					color: level === "invalid" ? C_DEAD : level === "1" ? C_HEALTHY : "var(--stage-fg)",
					size: 14,
					weight: 800,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Tag, {
					x: 270,
					y: H - 14,
					text: `output = ${Y.toFixed(2)} V`,
					color: "var(--stage-muted)",
					size: 11,
					weight: 700,
					anchor: "middle"
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: `battery EMF = ${vdd.toFixed(1)} V`,
			children: /* @__PURE__ */ jsx(Slider, {
				min: 0,
				max: vmax,
				step: .1,
				value: vdd,
				onChange: setVdd,
				ariaLabel: "battery EMF in volts"
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "input A",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: A === 0,
					onClick: () => setA(0),
					children: "0"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: A === 1,
					onClick: () => setA(1),
					children: "1"
				})]
			})
		})] }),
		aside: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 10
			},
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "lab-pill",
					"data-state": valid ? "ok" : "no",
					role: "status",
					style: { alignSelf: "flex-start" },
					children: zone === "healthy" ? "✓ supply healthy: logic valid, good noise margin" : zone === "marginal" ? "⚠ low rail: logic still valid but the noise margin is thin" : "✗ supply below threshold: output invalid (no swing)"
				}),
				/* @__PURE__ */ jsx(Callout, {
					tone: "result",
					children: /* @__PURE__ */ jsxs("div", {
						style: {
							fontSize: 13,
							lineHeight: 1.6
						},
						children: [
							"supply VDD = ",
							/* @__PURE__ */ jsxs("strong", { children: [vdd.toFixed(1), " V"] }),
							" (threshold Vth = ",
							vth,
							" V)",
							/* @__PURE__ */ jsx("br", {}),
							"output swing = ",
							/* @__PURE__ */ jsxs("strong", { children: [Math.max(0, swing).toFixed(2), " V"] }),
							" (",
							Math.round(Math.max(0, swingFrac) * 100),
							"% of rail)",
							/* @__PURE__ */ jsx("br", {}),
							"this output = ",
							Y.toFixed(2),
							" V → ",
							level === "invalid" ? /* @__PURE__ */ jsx("span", {
								style: {
									color: C_DEAD,
									fontWeight: 700
								},
								children: "invalid (neither 1 nor 0)"
							}) : /* @__PURE__ */ jsxs("span", {
								style: { fontWeight: 700 },
								children: ["logic ", level]
							})
						]
					})
				}),
				/* @__PURE__ */ jsx(Callout, {
					tone: "info",
					children: /* @__PURE__ */ jsx("div", {
						style: {
							fontSize: 12.5,
							lineHeight: 1.5
						},
						children: "A transistor needs gate-to-source above Vth to conduct. Once the whole rail drops near Vth, neither the pull-up nor the pull-down can fully turn on, so the output can no longer be driven to a valid level and the swing collapses. Real systems brown out when a battery drains or a heavy load makes the supply sag (EMF minus the internal-resistance drop). The cure is a minimum supply voltage, not a faster chip."
					})
				})
			]
		}),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChallengeCard, {
			questions: BROWNOUT_Q,
			state: ch,
			title: "Predict first"
		}), ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity
		}) : null] }),
		children: scene
	});
}
const BROWNOUT_Q = [{
	id: "brownout-low",
	prompt: "The battery drains until the supply VDD falls below the transistor threshold Vth. What happens to the gate output?",
	choices: [
		{
			value: "a",
			label: "it becomes invalid: neither a clean 1 nor 0"
		},
		{
			value: "b",
			label: "it stays a perfect 1 and 0, just slower"
		},
		{
			value: "c",
			label: "the gate burns out"
		}
	],
	answer: "a",
	explain: "Below Vth neither transistor can fully turn on, so the output cannot reach the rails and the swing collapses (it stops following the input). Nothing is damaged: the chip is simply starved of voltage. That is a brown-out, and it is why every chip has a minimum supply voltage."
}];

//#endregion
export { BrownoutLab };