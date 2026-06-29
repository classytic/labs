'use client';

import { clamp } from "../../core/util.mjs";
import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, Control, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useFrameTick } from "../../kit/anim.mjs";
import { PlayWrap, usePlayGate } from "../../kit/play.mjs";
import { EarthGlyph, SunGlyph } from "../../kit/space.mjs";
import { useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Dot, Label, Polygon, Polyline, Segment, Stage } from "@classytic/stage";

//#region src/physics/kepler/preset.tsx
/**
* KeplerLab, "Equal areas, equal time", the shape and rhythm of orbits.
*
* A planet on a true ellipse with the star at one FOCUS (Kepler 1). It moves by
* solving Kepler's equation M = E − e·sinE, so it genuinely speeds up at
* perihelion and dawdles at aphelion, and the wedges swept in equal time slices
* (shaded alternately) come out EQUAL in area (Kepler 2): fat-and-short near the
* star, thin-and-long far away. The period follows T² ∝ a³ (Kepler 3), so a wider
* orbit takes disproportionately longer.
*
* Drag eccentricity from a circle to a stretched ellipse; drag the semi-major
* axis and watch the period balloon. Ambient PlayWrap. Tokenized SVG.
*/
const N_WEDGE = 12;
/** Solve Kepler's equation M = E − e·sinE for the eccentric anomaly E. */
function solveE(M, e) {
	let E = M;
	for (let i = 0; i < 6; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
	return E;
}
function KeplerLab({ semiMajor = 4, eccentricity = .5, wedges = true, title = "Kepler: equal areas in equal time", prompt = "The planet rides a true ellipse with the star at a focus. It speeds up near the star and slows far away, yet the wedge it sweeps in each equal time-slice has the SAME area (Kepler’s 2nd law). Stretch the orbit, and the period grows as T² ∝ a³.", objectives, controlConfig }) {
	const [a, setA] = useState(semiMajor);
	const [e, setE] = useState(eccentricity);
	const [showWedge, setShowWedge] = useState(wedges);
	const gate = usePlayGate();
	const tRef = useRef(0);
	const c = a * e;
	const b = a * Math.sqrt(1 - e * e);
	const T = Math.pow(a, 1.5) * 1.6;
	useFrameTick(gate.running, (f) => {
		tRef.current += Math.min(.05, f.dtMs / 1e3);
	});
	const pos = (M) => {
		const E = solveE(M, e);
		return {
			x: -c + a * Math.cos(E),
			y: b * Math.sin(E)
		};
	};
	const planet = pos(2 * Math.PI * (tRef.current / T) % (2 * Math.PI));
	const outline = [];
	for (let i = 0; i <= 96; i++) {
		const E = i / 96 * 2 * Math.PI;
		outline.push({
			x: -c + a * Math.cos(E),
			y: b * Math.sin(E)
		});
	}
	const wedgePts = [];
	for (let i = 0; i <= N_WEDGE; i++) wedgePts.push(pos(2 * Math.PI * i / N_WEDGE));
	const peri = a * (1 - e), apo = a * (1 + e);
	const figure = /* @__PURE__ */ jsx(PlayWrap, {
		gate,
		children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(Stage, {
			view: {
				xMin: -(a + c) - 1,
				xMax: a - c + 1,
				yMin: -b - 1,
				yMax: b + 1
			},
			height: 300,
			preserveAspect: true,
			ariaLabel: `Elliptical orbit, eccentricity ${e.toFixed(2)}, star at a focus`,
			children: [
				showWedge && wedgePts.slice(0, N_WEDGE).map((p, i) => /* @__PURE__ */ jsx(Polygon, {
					points: [
						{
							x: 0,
							y: 0
						},
						p,
						wedgePts[i + 1]
					],
					color: "none",
					fill: i % 2 === 0 ? "var(--stage-accent)" : "var(--stage-accent-2)",
					fillOpacity: .22,
					weight: 0
				}, i)),
				/* @__PURE__ */ jsx(Polyline, {
					points: outline,
					color: "var(--stage-fg)",
					opacity: .45,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: -(a + c),
						y: 0
					},
					to: {
						x: a - c,
						y: 0
					},
					color: "var(--stage-fg)",
					opacity: .25,
					weight: 1,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Dot, {
					x: -2 * c,
					y: 0,
					r: 3,
					color: "var(--stage-muted)"
				}),
				/* @__PURE__ */ jsx(SunGlyph, {
					center: {
						x: 0,
						y: 0
					},
					r: .5
				}),
				/* @__PURE__ */ jsx(Label, {
					x: a - c,
					y: 0,
					text: "perihelion",
					color: "var(--stage-muted)",
					size: 9,
					dy: -6,
					anchor: "end"
				}),
				/* @__PURE__ */ jsx(Label, {
					x: -(a + c),
					y: 0,
					text: "aphelion",
					color: "var(--stage-muted)",
					size: 9,
					dy: -6,
					anchor: "start"
				}),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: 0
					},
					to: planet,
					color: "var(--stage-accent)",
					opacity: .7,
					weight: 1.2
				}),
				/* @__PURE__ */ jsx(EarthGlyph, {
					center: planet,
					r: .34,
					atmosphere: false
				})
			]
		}) })
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 10
			},
			children: [
				/* @__PURE__ */ jsx(Callout, {
					tone: "result",
					children: /* @__PURE__ */ jsxs("span", {
						style: {
							display: "grid",
							gap: 4,
							fontVariantNumeric: "tabular-nums"
						},
						children: [
							/* @__PURE__ */ jsxs("span", { children: [
								"eccentricity e = ",
								/* @__PURE__ */ jsx("strong", { children: e.toFixed(2) }),
								" ",
								e < .02 ? "(circle)" : ""
							] }),
							/* @__PURE__ */ jsxs("span", { children: [
								"perihelion ",
								peri.toFixed(1),
								" · aphelion ",
								apo.toFixed(1)
							] }),
							/* @__PURE__ */ jsxs("span", { children: [
								"period T ∝ a^1.5 = ",
								/* @__PURE__ */ jsx("strong", { children: T.toFixed(1) }),
								" · T²/a³ = ",
								/* @__PURE__ */ jsx("strong", { children: (T * T / (a * a * a)).toFixed(2) })
							] })
						]
					})
				}),
				/* @__PURE__ */ jsxs("p", {
					style: {
						fontSize: 12,
						opacity: .75,
						margin: 0
					},
					children: [
						"Each shaded wedge is one equal time-slice, they look different but enclose the ",
						/* @__PURE__ */ jsx("strong", { children: "same area" }),
						"(Kepler’s 2nd law), so the planet must move fastest at perihelion. T²/a³ stays constant as you widen the orbit (Kepler’s 3rd law)."
					]
				}),
				/* @__PURE__ */ jsx(LiveRegion, { children: `Eccentricity ${e.toFixed(2)}, period ${T.toFixed(1)}. Equal-time wedges have equal area.` })
			]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Control, {
				name: "equal-area wedges",
				children: /* @__PURE__ */ jsx(Chip, {
					selected: showWedge,
					onClick: () => setShowWedge((w) => !w),
					children: "equal-area wedges"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "eccentricity",
				value: e.toFixed(2),
				children: /* @__PURE__ */ jsx(Slider, {
					value: e,
					min: 0,
					max: .7,
					step: .05,
					onChange: setE,
					ariaLabel: "eccentricity"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "semi-major a",
				value: a.toFixed(1),
				children: /* @__PURE__ */ jsx(Slider, {
					value: a,
					min: 2.5,
					max: 5,
					step: .5,
					onChange: (n) => setA(clamp(n, 2.5, 5)),
					ariaLabel: "semi-major axis"
				})
			})
		] }),
		controlConfig,
		children: figure
	});
}

//#endregion
export { KeplerLab };