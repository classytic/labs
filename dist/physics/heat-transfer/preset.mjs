'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { BurnerGlyph, thermalColor } from "../../kit/thermal.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/physics/heat-transfer/preset.tsx
/**
* HeatTransferLab, the three ways heat travels, side by side, each with its real
* rate law and an iconic animation:
*
*   • CONDUCTION, through a solid, atom to atom. A rod between a hot and a cold
*     end settles into a linear temperature gradient; energy packets march down it
*     at a speed set by Fourier's law  Q̇ = k·A·ΔT/L  (copper races, wood crawls).
*   • CONVECTION, bulk flow in a fluid. Heated fluid expands, rises, cools at the
*     top and sinks, a rolling convection current. Rate  Q̇ = h·A·ΔT.
*   • RADIATION, electromagnetic waves, no medium needed. A hot body glows and
*     throws photons outward; the power obeys Stefan–Boltzmann  P = εσA(T⁴ − T₀⁴),
*     so doubling the absolute temperature multiplies the radiated power by 16.
*
* Hand-driven on a frame loop (the rates are steady-state formulas; the loop only
* animates the packets / current / photons). Pure SVG, play-gated, themed.
*/
const W = 720, H = 380;
const SIGMA = 5.67e-8;
const MATERIALS = {
	copper: {
		k: 400,
		label: "🟧 copper"
	},
	aluminium: {
		k: 235,
		label: "⬜ aluminium"
	},
	glass: {
		k: .8,
		label: "🔲 glass"
	},
	wood: {
		k: .15,
		label: "🟫 wood"
	}
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function HeatTransferLab({ mode: mode0 = "conduction", title = "Heat transfer: conduction, convection & radiation", prompt = "The three ways heat moves: through solids (conduction), by bulk fluid flow (convection), and as radiation across empty space.", objectives = [
	"Tell conduction, convection and radiation apart by their mechanism",
	"See conduction depends on the material: Q̇ = k·A·ΔT/L (copper ≫ wood)",
	"See radiation obeys T⁴, double the temperature, 16× the power"
], controlConfig } = {}) {
	const [mode, setMode] = useState(mode0);
	const [material, setMaterial] = useState("copper");
	const [hotC, setHotC] = useState(100);
	const [lengthCm, setLengthCm] = useState(20);
	const [powerC, setPowerC] = useState(140);
	const [bodyK, setBodyK] = useState(500);
	const [emiss, setEmiss] = useState(1);
	const tRef = useRef(0);
	const gate = usePlayGate();
	useFrameTick(gate.running, (f) => {
		tRef.current += Math.min(.05, f.dtMs / 1e3);
	});
	const t = tRef.current;
	const A = 4e-4;
	const k = MATERIALS[material].k;
	const condRate = k * A * hotC / (lengthCm / 100);
	const surrK = 300;
	const radP = emiss * SIGMA * .02 * (bodyK ** 4 - surrK ** 4);
	const convRate = 12 * .02 * (powerC / 140) * 60;
	let figure;
	let controls;
	let aside;
	if (mode === "conduction") {
		const x0 = 150, x1 = 600, yMid = 175, rodH = 46;
		const len = x1 - x0;
		const NSEG = 16;
		const speed = clamp(condRate / 80, .05, 2.5);
		const nPk = Math.max(0, Math.round(clamp(condRate / 8, 0, 14)));
		figure = /* @__PURE__ */ jsx(PlayWrap, {
			gate,
			children: /* @__PURE__ */ jsx("div", {
				style: fwrap,
				children: /* @__PURE__ */ jsxs("svg", {
					viewBox: `0 0 ${W} ${H}`,
					width: "100%",
					role: "img",
					"aria-label": `Conduction through ${material}, rate ${condRate.toFixed(1)} watts`,
					children: [
						/* @__PURE__ */ jsx("rect", {
							x: 70,
							y: yMid - 55,
							width: 80,
							height: 110,
							rx: 8,
							fill: thermalColor(1),
							opacity: .85
						}),
						/* @__PURE__ */ jsxs("text", {
							x: 110,
							y: yMid - 62,
							textAnchor: "middle",
							fontSize: 12,
							fontWeight: 700,
							fill: "var(--stage-fg)",
							children: [hotC, "°C"]
						}),
						/* @__PURE__ */ jsx("rect", {
							x: x1,
							y: yMid - 55,
							width: 80,
							height: 110,
							rx: 8,
							fill: thermalColor(0),
							opacity: .85
						}),
						/* @__PURE__ */ jsx("text", {
							x: 640,
							y: yMid - 62,
							textAnchor: "middle",
							fontSize: 12,
							fontWeight: 700,
							fill: "var(--stage-fg)",
							children: "0°C"
						}),
						Array.from({ length: NSEG }, (_, i) => /* @__PURE__ */ jsx("rect", {
							x: x0 + i / NSEG * len,
							y: yMid - rodH / 2,
							width: 29.125,
							height: rodH,
							fill: thermalColor(1 - i / NSEG)
						}, i)),
						/* @__PURE__ */ jsx("rect", {
							x: x0,
							y: yMid - rodH / 2,
							width: len,
							height: rodH,
							fill: "none",
							stroke: "var(--stage-metal)",
							strokeWidth: 2,
							rx: 4
						}),
						Array.from({ length: 11 }, (_, i) => {
							const fx = i / 10, ax = x0 + fx * len, amp = (1 - fx) * 5 + 1;
							const jy = Math.sin(t * 11 + i) * amp;
							return /* @__PURE__ */ jsx("circle", {
								cx: ax + Math.cos(t * 9 + i * 1.3) * amp * .5,
								cy: yMid + jy,
								r: 3,
								fill: "var(--stage-bg)",
								opacity: .8
							}, i);
						}),
						Array.from({ length: nPk }, (_, i) => {
							return /* @__PURE__ */ jsx("circle", {
								cx: x0 + (t * speed + i / Math.max(1, nPk)) % 1 * len,
								cy: yMid,
								r: 5,
								fill: "var(--stage-warn)",
								opacity: .9
							}, i);
						}),
						/* @__PURE__ */ jsx(BurnerGlyph, {
							cx: 110,
							baseY: 233,
							w: 66,
							level: .8,
							phase: t
						})
					]
				})
			})
		});
		controls = /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "material",
				children: /* @__PURE__ */ jsx("span", {
					className: "lab-field-row",
					children: Object.entries(MATERIALS).map(([key, m]) => /* @__PURE__ */ jsx(Chip, {
						selected: material === key,
						onClick: () => setMaterial(key),
						children: m.label
					}, key))
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "hot end ΔT",
				value: `${hotC} °C`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: hotC,
					min: 20,
					max: 200,
					step: 10,
					onChange: setHotC,
					ariaLabel: "hot-end temperature"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "rod length",
				value: `${lengthCm} cm`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: lengthCm,
					min: 5,
					max: 50,
					step: 5,
					onChange: setLengthCm,
					ariaLabel: "rod length"
				})
			})
		] });
		aside = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsx("span", {
				style: tnum,
				children: /* @__PURE__ */ jsxs("strong", {
					style: { fontSize: 16 },
					children: [
						"Q̇ = ",
						condRate.toFixed(condRate < 10 ? 2 : 0),
						" W"
					]
				})
			})
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8,
				padding: "8px 2px 0",
				fontSize: 13
			},
			children: [/* @__PURE__ */ jsx(Tex, {
				tex: "\\dot{Q} = \\dfrac{k\\,A\\,\\Delta T}{L}",
				block: true
			}), /* @__PURE__ */ jsxs("span", {
				style: { color: "var(--stage-muted)" },
				children: [
					"conduction = atom-to-atom through a solid. ",
					/* @__PURE__ */ jsx("strong", {
						style: { color: "var(--stage-fg)" },
						children: MATERIALS[material].label
					}),
					" has k = ",
					k,
					" W/m·K, metals conduct ~1000× better than wood."
				]
			})]
		})] });
	} else if (mode === "convection") {
		const cx = 360, potTop = 110, potBot = 285, potHW = 150;
		const loopPts = (sign) => {
			const pts = [];
			for (let i = 0; i <= 40; i++) {
				const u = i / 40;
				let x, y;
				if (u < .25) {
					x = cx + sign * 8;
					y = potBot - u / .25 * (potBot - potTop);
				} else if (u < .5) {
					x = cx + sign * ((u - .25) / .25) * (potHW - 16);
					y = 116;
				} else if (u < .75) {
					x = cx + sign * (potHW - 16);
					y = potTop + (u - .5) / .25 * (potBot - potTop);
				} else {
					x = cx + sign * (potHW - 16) * (1 - (u - .75) / .25);
					y = potBot - 6;
				}
				pts.push({
					x,
					y,
					h: (potBot - y) / (potBot - potTop)
				});
			}
			return pts;
		};
		const loops = [loopPts(-1), loopPts(1)];
		figure = /* @__PURE__ */ jsx(PlayWrap, {
			gate,
			children: /* @__PURE__ */ jsx("div", {
				style: fwrap,
				children: /* @__PURE__ */ jsxs("svg", {
					viewBox: `0 0 ${W} ${H}`,
					width: "100%",
					role: "img",
					"aria-label": "Convection currents in a heated fluid",
					children: [
						/* @__PURE__ */ jsx("rect", {
							x: cx - potHW,
							y: potTop,
							width: potHW * 2,
							height: potBot - potTop,
							rx: 6,
							fill: "color-mix(in oklab, var(--stage-accent) 16%, transparent)"
						}),
						loops.map((pts, li) => /* @__PURE__ */ jsx("polyline", {
							points: pts.map((p) => `${p.x},${p.y}`).join(" "),
							fill: "none",
							stroke: "var(--stage-grid)",
							strokeWidth: 1,
							strokeDasharray: "3 4"
						}, li)),
						loops.flatMap((pts, li) => Array.from({ length: 7 }, (_, i) => {
							const u = (t * .16 * (powerC / 140) + i / 7) % 1;
							const p = pts[Math.min(pts.length - 1, Math.floor(u * pts.length))];
							return /* @__PURE__ */ jsx("circle", {
								cx: p.x,
								cy: p.y,
								r: 6,
								fill: thermalColor(p.h),
								opacity: .92
							}, `${li}-${i}`);
						})),
						/* @__PURE__ */ jsx("text", {
							x: cx,
							y: 150,
							textAnchor: "middle",
							fontSize: 16,
							fill: "var(--stage-warn)",
							children: "↑"
						}),
						/* @__PURE__ */ jsx("text", {
							x: 228,
							y: potBot - 30,
							textAnchor: "middle",
							fontSize: 16,
							fill: "var(--stage-accent)",
							children: "↓"
						}),
						/* @__PURE__ */ jsx("text", {
							x: 492,
							y: potBot - 30,
							textAnchor: "middle",
							fontSize: 16,
							fill: "var(--stage-accent)",
							children: "↓"
						}),
						/* @__PURE__ */ jsx("path", {
							d: `M ${cx - potHW} ${potTop} L ${cx - potHW} ${potBot} L 510 ${potBot} L 510 ${potTop}`,
							fill: "none",
							stroke: "var(--stage-metal)",
							strokeWidth: 3,
							strokeLinejoin: "round"
						}),
						/* @__PURE__ */ jsx(BurnerGlyph, {
							cx,
							baseY: 291,
							w: 120,
							level: clamp(powerC / 200, .1, 1),
							phase: t
						})
					]
				})
			})
		});
		controls = /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
			label: "heat",
			value: `${powerC} W`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: powerC,
				min: 40,
				max: 200,
				step: 10,
				onChange: setPowerC,
				ariaLabel: "heating power"
			})
		}) });
		aside = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsx("span", {
				style: tnum,
				children: /* @__PURE__ */ jsxs("strong", {
					style: { fontSize: 16 },
					children: [
						"Q̇ ≈ ",
						convRate.toFixed(0),
						" W"
					]
				})
			})
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8,
				padding: "8px 2px 0",
				fontSize: 13
			},
			children: [/* @__PURE__ */ jsx(Tex, {
				tex: "\\dot{Q} = h\\,A\\,\\Delta T",
				block: true
			}), /* @__PURE__ */ jsxs("span", {
				style: { color: "var(--stage-muted)" },
				children: [
					"Heated fluid expands → less dense → ",
					/* @__PURE__ */ jsx("strong", {
						style: { color: "var(--stage-fg)" },
						children: "rises"
					}),
					"; it cools up top, grows denser and ",
					/* @__PURE__ */ jsx("strong", {
						style: { color: "var(--stage-fg)" },
						children: "sinks"
					}),
					", a rolling current that carries heat with the moving matter. (No solid needed; impossible in a vacuum.)"
				]
			})]
		})] });
	} else {
		const cx = 300, cy = 190;
		const tFrac = clamp((bodyK - surrK) / 700, 0, 1);
		const bodyR = 34;
		const glowR = bodyR + tFrac * 26;
		const nPhotons = Math.round(clamp((bodyK / surrK) ** 4 * 1.5, 2, 28)) * (.4 + emiss * .6);
		figure = /* @__PURE__ */ jsx(PlayWrap, {
			gate,
			children: /* @__PURE__ */ jsx("div", {
				style: fwrap,
				children: /* @__PURE__ */ jsxs("svg", {
					viewBox: `0 0 ${W} ${H}`,
					width: "100%",
					role: "img",
					"aria-label": `Radiation from a body at ${bodyK} kelvin, ${radP.toFixed(0)} watts`,
					children: [
						/* @__PURE__ */ jsxs("text", {
							x: 20,
							y: 26,
							textAnchor: "start",
							fontSize: 12,
							fill: "var(--stage-muted)",
							children: [
								"surroundings ",
								surrK,
								" K"
							]
						}),
						Array.from({ length: Math.round(nPhotons) }, (_, i) => {
							const ang = i / Math.round(nPhotons) * Math.PI * 2 + i * .7;
							const u = (t * (.4 + tFrac) + i * .13) % 1;
							const r = glowR + 6 + u * 150;
							const px = cx + Math.cos(ang) * r, py = cy + Math.sin(ang) * r;
							return /* @__PURE__ */ jsxs("g", {
								opacity: (1 - u) * (.4 + emiss * .6),
								children: [/* @__PURE__ */ jsx("circle", {
									cx: px,
									cy: py,
									r: 2.5,
									fill: thermalColor(tFrac)
								}), /* @__PURE__ */ jsx("line", {
									x1: cx + Math.cos(ang) * (r - 12),
									y1: cy + Math.sin(ang) * (r - 12),
									x2: px,
									y2: py,
									stroke: thermalColor(tFrac),
									strokeWidth: 1.5,
									opacity: .5
								})]
							}, i);
						}),
						/* @__PURE__ */ jsx("circle", {
							cx,
							cy,
							r: glowR,
							fill: thermalColor(tFrac),
							opacity: .18
						}),
						/* @__PURE__ */ jsx("circle", {
							cx,
							cy,
							r: bodyR,
							fill: emiss > .5 ? thermalColor(tFrac) : "color-mix(in oklab, var(--stage-metal) 60%, var(--stage-bg))",
							stroke: "var(--stage-metal)",
							strokeWidth: 2
						}),
						/* @__PURE__ */ jsxs("text", {
							x: cx,
							y: 195,
							textAnchor: "middle",
							fontSize: 13,
							fontWeight: 800,
							fill: "var(--stage-bg)",
							children: [bodyK, " K"]
						}),
						/* @__PURE__ */ jsx("text", {
							x: 520,
							y: 120,
							fontSize: 12,
							fill: "var(--stage-muted)",
							children: "power ∝ T⁴"
						}),
						/* @__PURE__ */ jsx("rect", {
							x: 520,
							y: 130,
							width: 160,
							height: 16,
							rx: 4,
							fill: "var(--stage-grid)"
						}),
						/* @__PURE__ */ jsx("rect", {
							x: 520,
							y: 130,
							width: clamp((bodyK / 1e3) ** 4 * 160, 2, 160),
							height: 16,
							rx: 4,
							fill: thermalColor(tFrac)
						})
					]
				})
			})
		});
		controls = /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "body temperature",
			value: `${bodyK} K`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: bodyK,
				min: surrK,
				max: 1e3,
				step: 10,
				onChange: setBodyK,
				ariaLabel: "body temperature (kelvin)"
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "surface",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [/* @__PURE__ */ jsx(Chip, {
					selected: emiss > .5,
					onClick: () => setEmiss(1),
					children: "matte black (ε≈1)"
				}), /* @__PURE__ */ jsx(Chip, {
					selected: emiss <= .5,
					onClick: () => setEmiss(.1),
					children: "shiny (ε≈0.1)"
				})]
			})
		})] });
		aside = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsx("span", {
				style: tnum,
				children: /* @__PURE__ */ jsxs("strong", {
					style: { fontSize: 16 },
					children: [
						"P = ",
						radP.toFixed(radP < 10 ? 1 : 0),
						" W"
					]
				})
			})
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8,
				padding: "8px 2px 0",
				fontSize: 13
			},
			children: [/* @__PURE__ */ jsx(Tex, {
				tex: "P = \\varepsilon\\,\\sigma\\,A\\,(T^4 - T_0^4)",
				block: true
			}), /* @__PURE__ */ jsxs("span", {
				style: { color: "var(--stage-muted)" },
				children: [
					"EM waves, needs ",
					/* @__PURE__ */ jsx("strong", {
						style: { color: "var(--stage-fg)" },
						children: "no medium"
					}),
					" (this is how the Sun reaches us). The T⁴ is fierce: double the kelvin temperature → ",
					/* @__PURE__ */ jsx("strong", {
						style: { color: "var(--stage-fg)" },
						children: "16×"
					}),
					" the power. A matte-black surface radiates far more than a shiny one."
				]
			})]
		})] });
	}
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside,
		controlConfig,
		controls: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 10
			},
			children: [/* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
				label: "mechanism",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [
						/* @__PURE__ */ jsx(Chip, {
							selected: mode === "conduction",
							onClick: () => setMode("conduction"),
							children: "conduction"
						}),
						/* @__PURE__ */ jsx(Chip, {
							selected: mode === "convection",
							onClick: () => setMode("convection"),
							children: "convection"
						}),
						/* @__PURE__ */ jsx(Chip, {
							selected: mode === "radiation",
							onClick: () => setMode("radiation"),
							children: "radiation"
						})
					]
				})
			}) }), controls]
		}),
		children: figure
	});
}
const fwrap = {
	borderRadius: 14,
	overflow: "hidden",
	background: "var(--stage-bg)",
	border: "1px solid var(--stage-grid)"
};
const tnum = { fontVariantNumeric: "tabular-nums" };

//#endregion
export { HeatTransferLab };