'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { galvanicCell } from "@classytic/stage/chem";

//#region src/chem/electrochem/preset.tsx
/**
* ElectrochemLab, a galvanic (voltaic) cell with a live voltmeter, on the shared
* `@classytic/stage/chem` Nernst engine. Two metal/metal-ion half-cells joined by a
* salt bridge: the metal that's easier to oxidise (lower E°) becomes the ANODE (−),
* the other the CATHODE (+), and electrons stream anode→cathode through the wire.
*
* The voltmeter reads the Nernst EMF  E = E°cell − (RT/nF)·ln Q, so dragging an ion
* concentration moves the needle in real time, dilute the cathode ion and the
* voltage drops; pick the SAME metal both sides for a concentration cell (E° = 0,
* driven purely by the concentration difference). Pick the two electrodes (Daniell
* Zn/Cu by default), fully authorable. Play-gated electron flow; pure SVG.
*/
const METALS = {
	Mg: {
		z: 2,
		E0: -2.37,
		ion: "Mg²⁺",
		color: "rgba(140,150,170,0.18)"
	},
	Al: {
		z: 3,
		E0: -1.66,
		ion: "Al³⁺",
		color: "rgba(140,150,170,0.18)"
	},
	Zn: {
		z: 2,
		E0: -.76,
		ion: "Zn²⁺",
		color: "rgba(150,160,180,0.16)"
	},
	Fe: {
		z: 2,
		E0: -.44,
		ion: "Fe²⁺",
		color: "rgba(120,170,110,0.30)"
	},
	Ni: {
		z: 2,
		E0: -.25,
		ion: "Ni²⁺",
		color: "rgba(80,180,120,0.32)"
	},
	Pb: {
		z: 2,
		E0: -.13,
		ion: "Pb²⁺",
		color: "rgba(150,160,180,0.18)"
	},
	Cu: {
		z: 2,
		E0: .34,
		ion: "Cu²⁺",
		color: "rgba(40,110,210,0.40)"
	},
	Ag: {
		z: 1,
		E0: .8,
		ion: "Ag⁺",
		color: "rgba(150,160,180,0.14)"
	}
};
const ORDER = [
	"Mg",
	"Al",
	"Zn",
	"Fe",
	"Ni",
	"Pb",
	"Cu",
	"Ag"
];
const W = 720, H = 380;
const hc = (m, conc) => ({
	metal: m,
	z: METALS[m].z,
	E0: METALS[m].E0,
	conc
});
function ElectrochemLab({ metalA = "Zn", metalB = "Cu", concA = 1, concB = 1, title = "Galvanic cell: the voltage from a reaction", prompt = "Two metals in their salt solutions, joined by a wire and a salt bridge. The voltmeter reads the cell EMF from the Nernst equation, change a concentration and watch it move.", objectives = [
	"Identify the anode (oxidation, −) and cathode (reduction, +) from E°",
	"Read the standard cell EMF E°cell = E°cathode − E°anode",
	"Use the Nernst equation E = E°cell − (RT/nF)·ln Q to see concentration shift the voltage"
] } = {}) {
	const [mA, setMA] = useState(metalA);
	const [mB, setMB] = useState(metalB);
	const [cA, setCA] = useState(concA);
	const [cB, setCB] = useState(concB);
	const tRef = useRef(0);
	const gate = usePlayGate();
	useFrameTick(gate.running, (f) => {
		tRef.current += Math.min(.05, f.dtMs / 1e3);
	});
	const t = tRef.current;
	const { anode, cathode, E0cell, n, Q, E } = galvanicCell(hc(mA, cA), hc(mB, cB));
	const aMetal = METALS[anode.metal], cMetal = METALS[cathode.metal];
	const wireY = 44, Vx = 360, Vy = 60, Vr = 30;
	const Lx = 175, Rx = 545, elecTopY = 120, beakTop = 175, beakBot = 330;
	const path = [
		[Lx, elecTopY],
		[Lx, wireY],
		[Vx - Vr - 4, wireY],
		[394, wireY],
		[Rx, wireY],
		[Rx, elecTopY]
	];
	const segLen = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
	const totLen = segLen.reduce((a, b) => a + b, 0);
	const posAt = (u) => {
		let d = u * totLen;
		for (let i = 0; i < segLen.length; i++) {
			if (d <= segLen[i]) {
				const f = d / segLen[i];
				return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f];
			}
			d -= segLen[i];
		}
		return path[path.length - 1];
	};
	const wirePts = path.map((p) => p.join(",")).join(" ");
	const beaker = (x, metal, m, conc, role) => {
		return /* @__PURE__ */ jsxs("g", { children: [
			/* @__PURE__ */ jsx("rect", {
				x: x - 95,
				y: beakTop,
				width: 190,
				height: beakBot - beakTop,
				rx: 6,
				fill: m.color,
				stroke: "var(--stage-metal)",
				strokeWidth: 2
			}),
			/* @__PURE__ */ jsx("rect", {
				x: x - 9,
				y: elecTopY,
				width: 18,
				height: beakBot - elecTopY - 16,
				rx: 2,
				fill: "var(--stage-metal)"
			}),
			/* @__PURE__ */ jsx("text", {
				x,
				y: elecTopY - 8,
				textAnchor: "middle",
				fontSize: 14,
				fontWeight: 800,
				fill: "var(--stage-fg)",
				children: metal
			}),
			/* @__PURE__ */ jsxs("text", {
				x,
				y: 348,
				textAnchor: "middle",
				fontSize: 11,
				fill: "var(--stage-muted)",
				children: [
					m.ion,
					" · ",
					conc.toFixed(conc < .1 ? 3 : 2),
					" M"
				]
			}),
			/* @__PURE__ */ jsx("text", {
				x,
				y: 193,
				textAnchor: "middle",
				fontSize: 11,
				fontWeight: 700,
				fill: role === "anode" ? "var(--stage-danger, #e03131)" : "var(--stage-good, #16a34a)",
				children: role === "anode" ? "anode −" : "cathode +"
			}),
			/* @__PURE__ */ jsx("text", {
				x,
				y: 208,
				textAnchor: "middle",
				fontSize: 9.5,
				fill: "var(--stage-muted)",
				children: role === "anode" ? "oxidation" : "reduction"
			})
		] });
	};
	const figure = /* @__PURE__ */ jsx(PlayWrap, {
		gate,
		children: /* @__PURE__ */ jsx("div", {
			style: {
				borderRadius: 14,
				overflow: "hidden",
				background: "var(--stage-bg)",
				border: "1px solid var(--stage-grid)"
			},
			children: /* @__PURE__ */ jsxs("svg", {
				viewBox: `0 0 ${W} ${H}`,
				width: "100%",
				role: "img",
				"aria-label": `${anode.metal} ${cathode.metal} galvanic cell, EMF ${E.toFixed(2)} volts`,
				children: [
					/* @__PURE__ */ jsx("polyline", {
						points: wirePts,
						fill: "none",
						stroke: "var(--stage-metal)",
						strokeWidth: 2.5
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: Vx,
						cy: Vy,
						r: Vr,
						fill: "var(--stage-bg)",
						stroke: "var(--stage-fg)",
						strokeWidth: 2
					}),
					/* @__PURE__ */ jsx("text", {
						x: Vx,
						y: Vy - 4,
						textAnchor: "middle",
						fontSize: 15,
						fontWeight: 800,
						fill: E > 0 ? "var(--stage-good, #16a34a)" : "var(--stage-danger,#e03131)",
						style: { fontVariantNumeric: "tabular-nums" },
						children: E.toFixed(2)
					}),
					/* @__PURE__ */ jsx("text", {
						x: Vx,
						y: 70,
						textAnchor: "middle",
						fontSize: 9,
						fill: "var(--stage-muted)",
						children: "volts"
					}),
					/* @__PURE__ */ jsx("path", {
						d: `M 245 183 C 245 ${beakTop - 40}, ${Rx - 70} ${beakTop - 40}, ${Rx - 70} 183`,
						fill: "none",
						stroke: "color-mix(in oklab, var(--stage-warn) 50%, var(--stage-bg))",
						strokeWidth: 10,
						strokeLinecap: "round",
						opacity: .7
					}),
					/* @__PURE__ */ jsx("text", {
						x: Vx,
						y: beakTop - 30,
						textAnchor: "middle",
						fontSize: 10,
						fill: "var(--stage-muted)",
						children: "salt bridge"
					}),
					gate.playing && Array.from({ length: 9 }, (_, i) => {
						const [px, py] = posAt((t * .35 + i / 9) % 1);
						return /* @__PURE__ */ jsx("circle", {
							cx: px,
							cy: py,
							r: 3.4,
							fill: "var(--stage-warn)"
						}, i);
					}),
					/* @__PURE__ */ jsx("text", {
						x: Vx,
						y: wireY - 8,
						textAnchor: "middle",
						fontSize: 9.5,
						fill: "var(--stage-warn)",
						children: "e⁻ →"
					}),
					beaker(Lx, anode.metal, aMetal, anode.conc, "anode"),
					beaker(Rx, cathode.metal, cMetal, cathode.conc, "cathode")
				]
			})
		})
	});
	const sameMetal = mA === mB;
	const aside = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
		tone: E > 0 ? "result" : "info",
		children: /* @__PURE__ */ jsxs("span", {
			style: {
				display: "grid",
				gap: 2,
				fontVariantNumeric: "tabular-nums"
			},
			children: [/* @__PURE__ */ jsxs("span", {
				style: {
					fontWeight: 800,
					fontSize: 20
				},
				children: [
					"E = ",
					E.toFixed(3),
					" V"
				]
			}), /* @__PURE__ */ jsxs("span", {
				style: {
					fontSize: 13,
					color: "var(--stage-muted)"
				},
				children: [
					"E°cell ",
					E0cell.toFixed(2),
					" V · n = ",
					n,
					" · Q = ",
					Q < .01 || Q > 99 ? Q.toExponential(1) : Q.toFixed(2)
				]
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
			tex: "E = E^\\circ_{cell} - \\dfrac{RT}{nF}\\ln Q",
			block: true
		}), /* @__PURE__ */ jsxs("span", {
			style: { color: "var(--stage-muted)" },
			children: [
				/* @__PURE__ */ jsx("strong", {
					style: { color: "var(--stage-danger, #e03131)" },
					children: anode.metal
				}),
				" is the anode (oxidised, loses e⁻); ",
				/* @__PURE__ */ jsx("strong", {
					style: { color: "var(--stage-good, #16a34a)" },
					children: cathode.metal
				}),
				" is the cathode (reduced). ",
				sameMetal ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
					"Same metal both sides ⇒ E°cell = 0, this is a ",
					/* @__PURE__ */ jsx("strong", {
						style: { color: "var(--stage-fg)" },
						children: "concentration cell"
					}),
					", driven only by the concentration difference."
				] }) : /* @__PURE__ */ jsx(Fragment$1, { children: "Diluting the cathode ion raises Q and lowers E; concentrating it raises E." })
			]
		})]
	})] });
	const picker = (val, set) => /* @__PURE__ */ jsx("span", {
		className: "lab-field-row",
		style: { flexWrap: "wrap" },
		children: ORDER.map((m) => /* @__PURE__ */ jsx(Chip, {
			selected: val === m,
			onClick: () => set(m),
			children: m
		}, m))
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside,
		controls: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 10
			},
			children: [/* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
				label: "electrode 1",
				children: picker(mA, setMA)
			}), /* @__PURE__ */ jsx(Field, {
				label: `[${METALS[mA].ion}]`,
				value: `${cA.toFixed(2)} M`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: cA,
					min: .001,
					max: 2,
					step: .01,
					onChange: setCA,
					ariaLabel: "electrode 1 ion concentration"
				})
			})] }), /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
				label: "electrode 2",
				children: picker(mB, setMB)
			}), /* @__PURE__ */ jsx(Field, {
				label: `[${METALS[mB].ion}]`,
				value: `${cB.toFixed(2)} M`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: cB,
					min: .001,
					max: 2,
					step: .01,
					onChange: setCB,
					ariaLabel: "electrode 2 ion concentration"
				})
			})] })]
		}),
		children: figure
	});
}

//#endregion
export { ElectrochemLab };