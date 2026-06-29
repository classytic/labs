'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { thermalColor } from "../../kit/thermal.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/physics/entropy/preset.tsx
/**
* EntropyLab, why heat only flows one way, and why a gas always spreads out.
* Entropy is the bookkeeping behind the second law: in any real (spontaneous)
* process the TOTAL entropy of the universe increases.
*
*   • HEAT FLOW, move a chunk of heat Q from a hot body (Th) to a cold one (Tc).
*     The hot body loses ΔS = −Q/Th; the cold body gains ΔS = +Q/Tc. Because
*     Tc < Th, the gain outweighs the loss, so ΔS_total = Q(1/Tc − 1/Th) > 0 , 
*     hot→cold is spontaneous. Running it backwards would DECREASE total entropy,
*     which never happens by itself. (Equal temperatures ⇒ ΔS_total = 0, reversible.)
*   • FREE EXPANSION, let a gas spread into a vacuum. No heat, no work, but the gas
*     can never un-mix: ΔS = nR·ln(Vf/Vi) > 0. Spreading out is simply overwhelmingly
*     more likely than staying bunched up (more microstates).
*
* Interactive (recomputes on the sliders), no simulation loop. Pure SVG, themed.
*/
const R = 8.314462618;
const W = 640, H = 340;
function EntropyLab({ mode: mode0 = "heat", title = "Entropy & the second law: the one-way arrow", prompt = "Real processes always increase the total entropy of the universe. See why heat flows hot→cold and why a gas spreads out, and never reverses on its own.", objectives = [
	"Compute entropy change as ΔS = Q/T for heat moved at temperature T",
	"See ΔS_total > 0 for spontaneous heat flow (and = 0 only when Th = Tc)",
	"Explain free expansion: ΔS = nR·ln(Vf/Vi) > 0, gas never un-mixes"
] } = {}) {
	const [mode, setMode] = useState(mode0);
	const [Th, setTh] = useState(500);
	const [Tc, setTc] = useState(300);
	const [Q, setQ] = useState(1e3);
	const [m, setM] = useState(1);
	let figure;
	let aside;
	if (mode === "heat") {
		const tc = Math.min(Tc, Th);
		const dSh = -Q / Th, dSc = Q / tc, dST = dSh + dSc;
		const scale = 70 / Math.max(2, Math.abs(dSc));
		const bar = (x, label, val, color) => {
			const baseY = 250, hpx = val * scale;
			return /* @__PURE__ */ jsxs("g", { children: [
				/* @__PURE__ */ jsx("rect", {
					x: x - 26,
					y: hpx >= 0 ? baseY - hpx : baseY,
					width: 52,
					height: Math.abs(hpx),
					rx: 3,
					fill: color,
					opacity: .85
				}),
				/* @__PURE__ */ jsx("text", {
					x,
					y: 270,
					textAnchor: "middle",
					fontSize: 11,
					fill: "var(--stage-fg)",
					children: label
				}),
				/* @__PURE__ */ jsxs("text", {
					x,
					y: hpx >= 0 ? baseY - hpx - 6 : baseY + Math.abs(hpx) + 14,
					textAnchor: "middle",
					fontSize: 11,
					fontWeight: 700,
					fill: color,
					style: { fontVariantNumeric: "tabular-nums" },
					children: [val >= 0 ? "+" : "−", Math.abs(val).toFixed(2)]
				})
			] });
		};
		figure = /* @__PURE__ */ jsx("div", {
			style: fwrap,
			children: /* @__PURE__ */ jsxs("svg", {
				viewBox: `0 0 ${W} ${H}`,
				width: "100%",
				role: "img",
				"aria-label": `Heat flow, total entropy change ${dST.toFixed(2)} joules per kelvin`,
				children: [
					/* @__PURE__ */ jsx("rect", {
						x: 40,
						y: 130,
						width: 120,
						height: 90,
						rx: 10,
						fill: thermalColor(.95),
						opacity: .85
					}),
					/* @__PURE__ */ jsx("text", {
						x: 100,
						y: 180,
						textAnchor: "middle",
						fontSize: 13,
						fontWeight: 800,
						fill: "var(--stage-bg)",
						children: "HOT"
					}),
					/* @__PURE__ */ jsxs("text", {
						x: 100,
						y: 200,
						textAnchor: "middle",
						fontSize: 12,
						fill: "var(--stage-bg)",
						children: [Th, " K"]
					}),
					/* @__PURE__ */ jsx("rect", {
						x: 250,
						y: 130,
						width: 120,
						height: 90,
						rx: 10,
						fill: thermalColor(.12),
						opacity: .85
					}),
					/* @__PURE__ */ jsx("text", {
						x: 310,
						y: 180,
						textAnchor: "middle",
						fontSize: 13,
						fontWeight: 800,
						fill: "var(--stage-bg)",
						children: "COLD"
					}),
					/* @__PURE__ */ jsxs("text", {
						x: 310,
						y: 200,
						textAnchor: "middle",
						fontSize: 12,
						fill: "var(--stage-bg)",
						children: [tc, " K"]
					}),
					/* @__PURE__ */ jsx("line", {
						x1: 165,
						y1: 175,
						x2: 245,
						y2: 175,
						stroke: "var(--stage-warn)",
						strokeWidth: 3
					}),
					/* @__PURE__ */ jsx("polygon", {
						points: "245,175 235,169 235,181",
						fill: "var(--stage-warn)"
					}),
					/* @__PURE__ */ jsxs("text", {
						x: 205,
						y: 164,
						textAnchor: "middle",
						fontSize: 11,
						fontWeight: 700,
						fill: "var(--stage-warn)",
						children: [
							"Q = ",
							Q,
							" J"
						]
					}),
					/* @__PURE__ */ jsx("line", {
						x1: 420,
						y1: 250,
						x2: 620,
						y2: 250,
						stroke: "var(--stage-grid)",
						strokeWidth: 1
					}),
					/* @__PURE__ */ jsx("text", {
						x: 520,
						y: 56,
						textAnchor: "middle",
						fontSize: 11,
						fill: "var(--stage-muted)",
						children: "entropy change (J/K)"
					}),
					bar(450, "hot", dSh, "var(--stage-danger, #e03131)"),
					bar(520, "cold", dSc, "var(--stage-accent, #3b82f6)"),
					bar(590, "total", dST, "var(--stage-good, #16a34a)")
				]
			})
		});
		aside = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
			tone: dST >= 0 ? "result" : "info",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "grid",
					gap: 2,
					fontVariantNumeric: "tabular-nums"
				},
				children: [/* @__PURE__ */ jsxs("span", {
					style: {
						fontWeight: 800,
						fontSize: 16
					},
					children: [
						"ΔS_total = ",
						dST >= 0 ? "+" : "−",
						Math.abs(dST).toFixed(2),
						" J/K"
					]
				}), /* @__PURE__ */ jsx("span", {
					style: { fontSize: 13 },
					children: dST > .001 ? "spontaneous ✓" : "reversible limit (Th = Tc)"
				})]
			})
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8,
				padding: "8px 2px 0",
				fontSize: 13
			},
			children: [/* @__PURE__ */ jsx(Tex, {
				tex: "\\Delta S_{tot} = \\dfrac{Q}{T_c} - \\dfrac{Q}{T_h} > 0",
				block: true
			}), /* @__PURE__ */ jsxs("span", {
				style: { color: "var(--stage-muted)" },
				children: [
					"The cold body gains ",
					/* @__PURE__ */ jsx("strong", {
						style: { color: "var(--stage-fg)" },
						children: "more"
					}),
					" entropy than the hot body loses (same Q, smaller T). So heat flows hot→cold by itself; the reverse would lower total entropy, forbidden by the 2nd law."
				]
			})]
		})] });
	} else {
		const n = 1, ratio = 1 + m, dS = n * R * Math.log(ratio);
		const bx = 60, by = 70, bw = 360, bh = 200;
		const wallX = 240;
		const accRight = bx + bw * (.5 + .5 * m);
		const parts = Array.from({ length: 44 }, (_, i) => {
			const hx = i * .6180339 % 1, hy = (i * .7548 + .13) % 1;
			return /* @__PURE__ */ jsx("circle", {
				cx: 68 + hx * (accRight - bx - 16),
				cy: 80 + hy * (bh - 20),
				r: 3.2,
				fill: thermalColor(.5),
				opacity: .9
			}, i);
		});
		figure = /* @__PURE__ */ jsx("div", {
			style: fwrap,
			children: /* @__PURE__ */ jsxs("svg", {
				viewBox: `0 0 ${W} ${H}`,
				width: "100%",
				role: "img",
				"aria-label": `Free expansion, entropy increase ${dS.toFixed(2)} joules per kelvin`,
				children: [
					/* @__PURE__ */ jsx("rect", {
						x: bx,
						y: by,
						width: bw,
						height: bh,
						rx: 6,
						fill: "color-mix(in oklab, var(--stage-accent) 8%, transparent)",
						stroke: "var(--stage-metal)",
						strokeWidth: 3
					}),
					m < .98 && /* @__PURE__ */ jsx("text", {
						x: (accRight + bx + bw) / 2,
						y: 170,
						textAnchor: "middle",
						fontSize: 12,
						fill: "var(--stage-muted)",
						children: "vacuum"
					}),
					parts,
					/* @__PURE__ */ jsx("line", {
						x1: wallX,
						y1: by,
						x2: wallX,
						y2: 270,
						stroke: "var(--stage-warn)",
						strokeWidth: 4,
						strokeDasharray: "6 5",
						opacity: 1 - m
					}),
					/* @__PURE__ */ jsx("text", {
						x: 240,
						y: 292,
						textAnchor: "middle",
						fontSize: 11,
						fill: "var(--stage-muted)",
						children: m < .02 ? "gas confined to the left half" : m > .98 ? "gas fills the whole box" : "spreading…"
					})
				]
			})
		});
		aside = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					fontWeight: 800,
					fontSize: 16,
					fontVariantNumeric: "tabular-nums"
				},
				children: [
					"ΔS = +",
					dS.toFixed(2),
					" J/K"
				]
			})
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8,
				padding: "8px 2px 0",
				fontSize: 13
			},
			children: [/* @__PURE__ */ jsx(Tex, {
				tex: "\\Delta S = nR\\,\\ln\\!\\dfrac{V_f}{V_i}",
				block: true
			}), /* @__PURE__ */ jsxs("span", {
				style: { color: "var(--stage-muted)" },
				children: [
					"No heat, no work, yet entropy still rises, because the gas now has far more ways to arrange itself. Fully open (Vf = 2Vi) gives ",
					/* @__PURE__ */ jsx("strong", {
						style: { color: "var(--stage-fg)" },
						children: "nR·ln 2 ≈ 5.76 J/K"
					}),
					". You’ll never see it pile back into one half on its own."
				]
			})]
		})] });
	}
	const controls = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 10
		},
		children: [/* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
			label: "process",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: mode === "heat",
					onClick: () => setMode("heat"),
					children: "heat flows hot→cold"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: mode === "expansion",
					onClick: () => setMode("expansion"),
					children: "free expansion (spreading)"
				})]
			})
		}) }), mode === "heat" ? /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "hot Th",
				value: `${Th} K`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: Th,
					min: 310,
					max: 800,
					step: 10,
					onChange: setTh,
					ariaLabel: "hot temperature"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "cold Tc",
				value: `${Math.min(Tc, Th)} K`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: Tc,
					min: 250,
					max: 800,
					step: 10,
					onChange: setTc,
					ariaLabel: "cold temperature"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "heat Q",
				value: `${Q} J`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: Q,
					min: 200,
					max: 3e3,
					step: 100,
					onChange: setQ,
					ariaLabel: "heat transferred"
				})
			})
		] }) : /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
			label: "open the partition",
			value: `${Math.round(m * 100)}%`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: m,
				min: 0,
				max: 1,
				step: .05,
				onChange: setM,
				ariaLabel: "partition openness"
			})
		}) })]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside,
		controls,
		children: figure
	});
}
const fwrap = {
	borderRadius: 14,
	overflow: "hidden",
	background: "var(--stage-bg)",
	border: "1px solid var(--stage-grid)"
};

//#endregion
export { EntropyLab };