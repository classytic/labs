'use client';

import { Tex } from "../../core/tex.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { thermalColor } from "../../kit/thermal.mjs";
import { useId, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/physics/expansion/preset.tsx
/**
* ThermalExpansionLab, heat a solid and it grows. Drag the temperature and watch:
*
*   • LENGTH  ΔL = α·L·ΔT          (a rod stretches, why rails and bridges leave gaps)
*   • AREA    ΔA = 2α·A·ΔT          (a plate grows in both directions)
*   • VOLUME  ΔV = 3α·V·ΔT          (a ball swells in all three)
*   • BIMETALLIC STRIP, two metals with different α bonded back-to-back: the one
*     that expands more (brass) ends up on the OUTSIDE of the curve, so the strip
*     bends. Heat it enough and it closes a contact, that's a thermostat.
*
* Real expansion is tiny (α ~ 10⁻⁵ /°C), so the drawing is MAGNIFIED for visibility
* (the on-screen note says by how much) while the readout shows the TRUE ΔL/ΔA/ΔV.
* Interactive, recomputes as you drag, no simulation loop. Pure SVG, themed.
*/
const W = 720, H = 360;
const MAG = 120;
const METALS = {
	aluminium: {
		a: 23e-6,
		label: "aluminium"
	},
	brass: {
		a: 19e-6,
		label: "brass"
	},
	copper: {
		a: 17e-6,
		label: "copper"
	},
	steel: {
		a: 12e-6,
		label: "steel"
	},
	invar: {
		a: 12e-7,
		label: "Invar"
	}
};
function ThermalExpansionLab({ mode: mode0 = "length", title = "Thermal expansion: heat it, it grows", prompt = "Solids expand when heated as their atoms jiggle further apart. Drag the temperature: length, area and volume each grow, and two bonded metals bend.", objectives = [
	"Use ΔL = αLΔT, and that area grows by 2α and volume by 3α",
	"See expansion is tiny but real, why rails, bridges and pipes need gaps",
	"Explain a bimetallic strip / thermostat: unequal α → it bends"
], controlConfig } = {}) {
	const [mode, setMode] = useState(mode0);
	const [material, setMaterial] = useState("aluminium");
	const [dT, setDT] = useState(100);
	const gid = useId().replace(/:/g, "");
	const frac = METALS[material].a * dT;
	const tCol = thermalColor(Math.max(0, Math.min(1, dT / 200)));
	const cold = thermalColor(0);
	let figure;
	let aside;
	if (mode === "length") {
		const x0 = 110, y = 180, h = 44, L0 = 320;
		const L1 = L0 * (1 + frac * MAG);
		const dLmm = 1e3 * frac;
		figure = expansionWrap(/* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			width: "100%",
			role: "img",
			"aria-label": `Rod expands by ${dLmm.toFixed(2)} millimetres`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: x0,
					y: y - h / 2,
					width: L0,
					height: h,
					rx: 4,
					fill: "none",
					stroke: cold,
					strokeWidth: 2,
					strokeDasharray: "6 4"
				}),
				/* @__PURE__ */ jsx("rect", {
					x: x0,
					y: y - h / 2,
					width: L1,
					height: h,
					rx: 4,
					fill: tCol,
					opacity: .85,
					stroke: "var(--stage-metal)",
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("line", {
					x1: 430,
					y1: y - h / 2 - 14,
					x2: 430,
					y2: 216,
					stroke: "var(--stage-muted)",
					strokeWidth: 1,
					strokeDasharray: "3 3"
				}),
				/* @__PURE__ */ jsx("line", {
					x1: x0 + L1,
					y1: y - h / 2 - 14,
					x2: x0 + L1,
					y2: 216,
					stroke: "var(--stage-good)",
					strokeWidth: 1.5
				}),
				L1 > 322 && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("line", {
					x1: 430,
					y1: 224,
					x2: x0 + L1,
					y2: 224,
					stroke: "var(--stage-good)",
					strokeWidth: 2
				}), /* @__PURE__ */ jsx("text", {
					x: (540 + L1) / 2,
					y: 240,
					textAnchor: "middle",
					fontSize: 11,
					fontWeight: 700,
					fill: "var(--stage-good)",
					children: "ΔL"
				})] }),
				/* @__PURE__ */ jsx("rect", {
					x: x0 - 12,
					y: y - h / 2 - 8,
					width: 12,
					height: 60,
					fill: "var(--stage-metal)"
				}),
				/* @__PURE__ */ jsxs("text", {
					x: 270,
					y: y - h / 2 - 16,
					textAnchor: "middle",
					fontSize: 11,
					fill: "var(--stage-muted)",
					children: [
						"drawing ×",
						MAG,
						" (real ΔL = ",
						dLmm.toFixed(2),
						" mm for a 1 m rod)"
					]
				})
			]
		}));
		aside = expansionAside(/* @__PURE__ */ jsx(Tex, {
			tex: "\\Delta L = \\alpha\\,L\\,\\Delta T",
			block: true
		}), `ΔL = ${dLmm.toFixed(2)} mm`, /* @__PURE__ */ jsxs(Fragment$1, { children: [
			"A 1 m ",
			METALS[material].label,
			" rod warmed ",
			dT,
			" °C grows just ",
			/* @__PURE__ */ jsxs("strong", {
				style: { color: "var(--stage-fg)" },
				children: [dLmm.toFixed(2), " mm"]
			}),
			", tiny, but a 100 m bridge would grow ",
			(dLmm * 100).toFixed(0),
			" mm, so it needs expansion joints."
		] }));
	} else if (mode === "area") {
		const cx = W / 2, cy = 186, s0 = 210;
		const s1 = s0 * (1 + frac * MAG);
		const dAcm2 = 1e4 * 2 * frac;
		figure = expansionWrap(/* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			width: "100%",
			role: "img",
			"aria-label": `Plate area grows by ${dAcm2.toFixed(1)} square centimetres`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: cx - s0 / 2,
					y: cy - s0 / 2,
					width: s0,
					height: s0,
					fill: "none",
					stroke: cold,
					strokeWidth: 2,
					strokeDasharray: "6 4"
				}),
				/* @__PURE__ */ jsx("rect", {
					x: cx - s1 / 2,
					y: cy - s1 / 2,
					width: s1,
					height: s1,
					fill: tCol,
					opacity: .55,
					stroke: "var(--stage-metal)",
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("text", {
					x: cx,
					y: cy + s1 / 2 + 20,
					textAnchor: "middle",
					fontSize: 15,
					fill: "var(--stage-good)",
					children: "↔"
				}),
				/* @__PURE__ */ jsx("text", {
					x: cx - s1 / 2 - 16,
					y: 191,
					textAnchor: "middle",
					fontSize: 15,
					fill: "var(--stage-good)",
					children: "↕"
				}),
				/* @__PURE__ */ jsxs("text", {
					x: cx,
					y: cy - s1 / 2 - 12,
					textAnchor: "middle",
					fontSize: 11,
					fill: "var(--stage-muted)",
					children: [
						"drawing ×",
						MAG,
						", grows in BOTH directions (2α)"
					]
				})
			]
		}));
		aside = expansionAside(/* @__PURE__ */ jsx(Tex, {
			tex: "\\Delta A = 2\\alpha\\,A\\,\\Delta T",
			block: true
		}), `ΔA = ${dAcm2.toFixed(1)} cm²`, /* @__PURE__ */ jsxs(Fragment$1, { children: [
			"A plate expands along its width AND its length, so the area coefficient is ",
			/* @__PURE__ */ jsx("strong", {
				style: { color: "var(--stage-fg)" },
				children: "2α"
			}),
			". A 1 m² ",
			METALS[material].label,
			" sheet warmed ",
			dT,
			" °C gains ",
			dAcm2.toFixed(1),
			" cm²."
		] }));
	} else if (mode === "volume") {
		const cx = W / 2, cy = 186, r0 = 96;
		const r1 = r0 * (1 + frac * MAG);
		const dVcm3 = 1e3 * 3 * frac;
		figure = expansionWrap(/* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			width: "100%",
			role: "img",
			"aria-label": `Volume grows by ${dVcm3.toFixed(1)} cubic centimetres`,
			children: [
				/* @__PURE__ */ jsxs("defs", { children: [/* @__PURE__ */ jsxs("radialGradient", {
					id: `${gid}-rim`,
					cx: "50%",
					cy: "50%",
					r: "50%",
					children: [/* @__PURE__ */ jsx("stop", {
						offset: "62%",
						stopColor: "rgba(0,0,0,0)"
					}), /* @__PURE__ */ jsx("stop", {
						offset: "100%",
						stopColor: "rgba(0,0,0,0.42)"
					})]
				}), /* @__PURE__ */ jsxs("radialGradient", {
					id: `${gid}-spec`,
					cx: "33%",
					cy: "29%",
					r: "44%",
					children: [
						/* @__PURE__ */ jsx("stop", {
							offset: "0%",
							stopColor: "rgba(255,255,255,0.6)"
						}),
						/* @__PURE__ */ jsx("stop", {
							offset: "60%",
							stopColor: "rgba(255,255,255,0.12)"
						}),
						/* @__PURE__ */ jsx("stop", {
							offset: "100%",
							stopColor: "rgba(255,255,255,0)"
						})
					]
				})] }),
				/* @__PURE__ */ jsx("ellipse", {
					cx,
					cy: cy + r1 + 16,
					rx: r1 * .82,
					ry: r1 * .13,
					fill: "rgba(0,0,0,0.16)"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx,
					cy,
					r: r1,
					fill: tCol
				}),
				/* @__PURE__ */ jsx("circle", {
					cx,
					cy,
					r: r1,
					fill: `url(#${gid}-rim)`
				}),
				/* @__PURE__ */ jsx("ellipse", {
					cx,
					cy,
					rx: r1,
					ry: r1 * .34,
					fill: "none",
					stroke: "rgba(0,0,0,0.16)",
					strokeWidth: 1.2
				}),
				/* @__PURE__ */ jsx("ellipse", {
					cx,
					cy,
					rx: r1 * .34,
					ry: r1,
					fill: "none",
					stroke: "rgba(0,0,0,0.10)",
					strokeWidth: 1.2
				}),
				/* @__PURE__ */ jsx("circle", {
					cx,
					cy,
					r: r1,
					fill: `url(#${gid}-spec)`
				}),
				/* @__PURE__ */ jsx("circle", {
					cx,
					cy,
					r: r1,
					fill: "none",
					stroke: "var(--stage-metal)",
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("circle", {
					cx,
					cy,
					r: r0,
					fill: "none",
					stroke: "var(--stage-bg)",
					strokeWidth: 2.5,
					strokeDasharray: "6 5",
					opacity: .85
				}),
				/* @__PURE__ */ jsxs("text", {
					x: cx,
					y: cy - r1 - 14,
					textAnchor: "middle",
					fontSize: 11,
					fill: "var(--stage-muted)",
					children: [
						"drawing ×",
						MAG,
						", grows in ALL three directions (3α)"
					]
				})
			]
		}));
		aside = expansionAside(/* @__PURE__ */ jsx(Tex, {
			tex: "\\Delta V = 3\\alpha\\,V\\,\\Delta T",
			block: true
		}), `ΔV = ${dVcm3.toFixed(1)} cm³`, /* @__PURE__ */ jsxs(Fragment$1, { children: [
			"A solid swells in all three directions, so the volume coefficient is ",
			/* @__PURE__ */ jsx("strong", {
				style: { color: "var(--stage-fg)" },
				children: "3α"
			}),
			". A 1 L ",
			METALS[material].label,
			" block warmed ",
			dT,
			" °C gains ",
			dVcm3.toFixed(1),
			" cm³."
		] }));
	} else {
		const x0 = 150, y0 = 120, L = 320, thick = 9;
		const aHi = METALS.brass.a, aLo = METALS.steel.a;
		const theta = Math.max(0, Math.min(1.15, (aHi - aLo) * dT * 1700));
		const R = theta > .001 ? L / theta : 1e6;
		const N = 36;
		const center = [];
		for (let i = 0; i <= N; i++) {
			const al = theta * (i / N);
			center.push({
				x: x0 + R * Math.sin(al),
				y: y0 + R * (1 - Math.cos(al)),
				tx: Math.cos(al),
				ty: Math.sin(al)
			});
		}
		const off = (sign) => center.map((p) => {
			const al = Math.atan2(p.ty, p.tx);
			return `${(p.x + sign * (thick / 2) * Math.sin(al)).toFixed(1)},${(p.y - sign * (thick / 2) * Math.cos(al)).toFixed(1)}`;
		}).join(" ");
		const tip = center[N];
		const contactY = 270, on = tip.y >= contactY - 6;
		figure = expansionWrap(/* @__PURE__ */ jsxs("svg", {
			viewBox: `0 0 ${W} ${H}`,
			width: "100%",
			role: "img",
			"aria-label": `Bimetallic strip bent ${(theta * 57).toFixed(0)} degrees, contact ${on ? "closed" : "open"}`,
			children: [
				/* @__PURE__ */ jsx("rect", {
					x: x0 - 16,
					y: y0 - 14,
					width: 16,
					height: 28,
					fill: "var(--stage-metal)"
				}),
				/* @__PURE__ */ jsx("polyline", {
					points: off(1),
					fill: "none",
					stroke: "#c9912f",
					strokeWidth: thick,
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ jsx("polyline", {
					points: off(-1),
					fill: "none",
					stroke: "color-mix(in oklab, var(--stage-metal) 70%, var(--stage-fg))",
					strokeWidth: thick,
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: tip.x,
					cy: contactY,
					r: 7,
					fill: on ? "var(--stage-good)" : "var(--stage-grid)",
					stroke: "var(--stage-metal)",
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("line", {
					x1: tip.x,
					y1: contactY,
					x2: tip.x,
					y2: 300,
					stroke: "var(--stage-metal)",
					strokeWidth: 2
				}),
				/* @__PURE__ */ jsx("text", {
					x: tip.x + 16,
					y: 274,
					fontSize: 12,
					fontWeight: 800,
					fill: on ? "var(--stage-good)" : "var(--stage-muted)",
					children: on ? "ON" : "off"
				}),
				/* @__PURE__ */ jsxs("g", {
					fontSize: 11,
					children: [
						/* @__PURE__ */ jsx("rect", {
							x: 470,
							y: 70,
							width: 12,
							height: 12,
							fill: "#c9912f"
						}),
						/* @__PURE__ */ jsx("text", {
							x: 488,
							y: 80,
							fill: "var(--stage-fg)",
							children: "brass (α high), outside"
						}),
						/* @__PURE__ */ jsx("rect", {
							x: 470,
							y: 90,
							width: 12,
							height: 12,
							fill: "color-mix(in oklab, var(--stage-metal) 70%, var(--stage-fg))"
						}),
						/* @__PURE__ */ jsx("text", {
							x: 488,
							y: 100,
							fill: "var(--stage-fg)",
							children: "steel (α low), inside"
						})
					]
				})
			]
		}));
		aside = expansionAside(/* @__PURE__ */ jsx(Tex, {
			tex: "\\text{brass } \\alpha > \\text{steel } \\alpha",
			block: true
		}), on ? "contact CLOSED" : "contact open", /* @__PURE__ */ jsxs(Fragment$1, { children: [
			"Brass expands more than steel, so when heated it must take the ",
			/* @__PURE__ */ jsx("strong", {
				style: { color: "var(--stage-fg)" },
				children: "longer, outer"
			}),
			" edge of the curve, the strip bends toward the steel. Drag the temperature up until it closes the contact: that's how a ",
			/* @__PURE__ */ jsx("strong", {
				style: { color: "var(--stage-fg)" },
				children: "thermostat"
			}),
			" works."
		] }));
	}
	const controls = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 10
		},
		children: [/* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
			label: "what expands",
			children: /* @__PURE__ */ jsxs("span", {
				className: "lab-field-row",
				children: [
					/* @__PURE__ */ jsx(Chip, {
						selected: mode === "length",
						onClick: () => setMode("length"),
						children: "length"
					}),
					/* @__PURE__ */ jsx(Chip, {
						selected: mode === "area",
						onClick: () => setMode("area"),
						children: "area"
					}),
					/* @__PURE__ */ jsx(Chip, {
						selected: mode === "volume",
						onClick: () => setMode("volume"),
						children: "volume"
					}),
					/* @__PURE__ */ jsx(Chip, {
						selected: mode === "bimetallic",
						onClick: () => setMode("bimetallic"),
						children: "bimetallic strip"
					})
				]
			})
		}) }), /* @__PURE__ */ jsxs(ControlBar, { children: [mode !== "bimetallic" && /* @__PURE__ */ jsx(Field, {
			label: "material",
			children: /* @__PURE__ */ jsx("span", {
				className: "lab-field-row",
				children: Object.entries(METALS).map(([key, m]) => /* @__PURE__ */ jsxs(Chip, {
					selected: material === key,
					onClick: () => setMaterial(key),
					children: [
						m.label,
						" (α=",
						(m.a * 1e6).toFixed(1),
						"×10⁻⁶)"
					]
				}, key))
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "temperature rise ΔT",
			value: `+${dT} °C`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: dT,
				min: 0,
				max: 200,
				step: 5,
				onChange: setDT,
				ariaLabel: "temperature rise (Celsius)"
			})
		})] })]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside,
		controls,
		controlConfig,
		children: figure
	});
}
function expansionWrap(svg) {
	return /* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: svg
	});
}
function expansionAside(formula, result, note) {
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
		tone: "result",
		children: /* @__PURE__ */ jsx("span", {
			style: {
				fontVariantNumeric: "tabular-nums",
				fontWeight: 800,
				fontSize: 16
			},
			children: result
		})
	}), /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 8,
			padding: "8px 2px 0",
			fontSize: 13
		},
		children: [formula, /* @__PURE__ */ jsx("span", {
			style: { color: "var(--stage-muted)" },
			children: note
		})]
	})] });
}

//#endregion
export { ThermalExpansionLab };