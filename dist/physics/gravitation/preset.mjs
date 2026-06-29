'use client';

import { clamp } from "../../core/util.mjs";
import { Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { EarthGlyph, SatelliteGlyph } from "../../kit/space.mjs";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Circle, Dot, Label, MovableDot, Polyline, Segment, Stage, Vector } from "@classytic/stage";

//#region src/physics/gravitation/preset.tsx
/**
* GravitationLab, "Inverse-square", how gravity fades with distance.
*
* Newton's law of universal gravitation: F = G·M·m / r². Drag the satellite and
* the pull on it tracks 1/r², DOUBLE the distance and the force drops to a
* QUARTER (not a half), the defining surprise of an inverse-square law. The same
* rule is why weight shrinks with altitude (g = GM/r²). A live F-vs-r curve marks
* where you are on the steep 1/r² fall-off.
*
* Interactive (drag the satellite), no timed loop. Tokenized SVG.
*/
const GRAVITATION_CHALLENGE = [{
	id: "double-r",
	prompt: "Double the distance between two masses, the gravitational force becomes…",
	choices: [
		{
			value: "quarter",
			label: "one-quarter"
		},
		{
			value: "half",
			label: "one-half"
		},
		{
			value: "double",
			label: "twice as strong"
		}
	],
	answer: "quarter",
	explain: "Force goes as 1/r², so doubling r divides the pull by 2² = 4."
}, {
	id: "altitude",
	prompt: "Why does your weight shrink as you climb higher above the Earth?",
	choices: [
		{
			value: "farther",
			label: "you are farther from the centre, so g = GM/r² falls"
		},
		{
			value: "lighter-air",
			label: "the air is thinner up there"
		},
		{
			value: "mass",
			label: "your mass decreases"
		}
	],
	answer: "farther",
	explain: "The same inverse-square law: g = GM/r² weakens as r grows; your mass is unchanged."
}];
const R_MIN = 2.4, R_MAX = 9;
const K_BASE = 60;
function GravitationLab({ planetMass = 5, satMass = 1, title = "Inverse-square gravity: double the distance, quarter the pull", prompt = "Newton’s law: F = G·M·m / r². Drag the satellite in and out, the pull follows 1/r², so moving twice as far drops the force to a quarter, not a half. It’s the same law that thins your weight with altitude (g = GM/r²).", objectives, controlConfig }) {
	const [M, setM] = useState(planetMass);
	const [m, setm] = useState(satMass);
	const [sat, setSat] = useState({
		x: 4,
		y: 2.2
	});
	const challenge = useChallenge(GRAVITATION_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "gravitation"
	});
	const r = Math.hypot(sat.x, sat.y);
	const K = K_BASE * M * m;
	const F = K / (r * r);
	const dirToStar = {
		x: -sat.x / r,
		y: -sat.y / r
	};
	const onMove = (p) => {
		const rr = clamp(Math.hypot(p.x, p.y), R_MIN, R_MAX);
		const ang = Math.atan2(p.y, p.x);
		setSat({
			x: rr * Math.cos(ang),
			y: rr * Math.sin(ang)
		});
	};
	const arrowLen = clamp(F * .02, .5, 4.5);
	const view = {
		xMin: -10,
		xMax: 10,
		yMin: -10,
		yMax: 10
	};
	const curve = [];
	for (let i = 0; i <= 80; i++) {
		const rr = R_MIN + i / 80 * (R_MAX - R_MIN);
		curve.push({
			x: rr,
			y: K / (rr * rr)
		});
	}
	const Fmax = K / (R_MIN * R_MIN);
	const figure = /* @__PURE__ */ jsx("div", {
		className: "lab-playwrap",
		children: /* @__PURE__ */ jsxs(Stage, {
			view,
			height: 300,
			preserveAspect: true,
			ariaLabel: `Satellite at distance ${r.toFixed(1)}, gravitational pull ${F.toFixed(1)}`,
			children: [
				[
					3,
					6,
					9
				].map((rr) => /* @__PURE__ */ jsx(Circle, {
					center: {
						x: 0,
						y: 0
					},
					r: rr,
					color: "var(--stage-fg)",
					opacity: .12,
					weight: 1,
					fill: "none"
				}, rr)),
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: 0,
						y: 0
					},
					to: sat,
					color: "var(--stage-fg)",
					opacity: .35,
					weight: 1,
					dashed: true
				}),
				/* @__PURE__ */ jsx(Label, {
					x: sat.x / 2,
					y: sat.y / 2,
					text: `r = ${r.toFixed(1)}`,
					color: "var(--stage-fg)",
					size: 11,
					dy: -4
				}),
				/* @__PURE__ */ jsx(EarthGlyph, {
					center: {
						x: 0,
						y: 0
					},
					r: .6 + M * .12
				}),
				/* @__PURE__ */ jsx(Vector, {
					tail: sat,
					tip: {
						x: sat.x + dirToStar.x * arrowLen,
						y: sat.y + dirToStar.y * arrowLen
					},
					color: "var(--stage-warn)",
					weight: 3
				}),
				/* @__PURE__ */ jsx(Label, {
					x: sat.x + dirToStar.x * arrowLen,
					y: sat.y + dirToStar.y * arrowLen,
					text: "F",
					color: "var(--stage-warn)",
					size: 12,
					dy: -4
				}),
				/* @__PURE__ */ jsx(SatelliteGlyph, {
					center: sat,
					size: .5
				}),
				/* @__PURE__ */ jsx(MovableDot, {
					value: sat,
					onMove,
					color: "var(--stage-accent)",
					ariaLabel: "satellite, drag to change distance"
				})
			]
		})
	});
	const graph = /* @__PURE__ */ jsxs(Stage, {
		view: {
			xMin: 0,
			xMax: R_MAX,
			yMin: 0,
			yMax: Fmax
		},
		height: 120,
		preserveAspect: false,
		ariaLabel: "Force versus distance, an inverse-square curve",
		children: [
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: 0,
					y: 0
				},
				to: {
					x: R_MAX,
					y: 0
				},
				color: "var(--stage-fg)",
				opacity: .5,
				weight: 1.2
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: 0,
					y: 0
				},
				to: {
					x: 0,
					y: Fmax
				},
				color: "var(--stage-fg)",
				opacity: .5,
				weight: 1.2
			}),
			/* @__PURE__ */ jsx(Label, {
				x: 0,
				y: Fmax,
				text: "F",
				color: "var(--stage-fg)",
				size: 10,
				anchor: "start",
				dy: -2
			}),
			/* @__PURE__ */ jsx(Label, {
				x: R_MAX,
				y: 0,
				text: "r →",
				color: "var(--stage-fg)",
				size: 10,
				anchor: "end",
				dy: 14
			}),
			/* @__PURE__ */ jsx(Polyline, {
				points: curve,
				color: "var(--stage-accent)",
				weight: 2.5
			}),
			/* @__PURE__ */ jsx(Segment, {
				from: {
					x: clamp(r, R_MIN, R_MAX),
					y: 0
				},
				to: {
					x: clamp(r, R_MIN, R_MAX),
					y: F
				},
				color: "var(--stage-warn)",
				opacity: .6,
				weight: 1,
				dashed: true
			}),
			/* @__PURE__ */ jsx(Dot, {
				x: clamp(r, R_MIN, R_MAX),
				y: F,
				r: 4,
				color: "var(--stage-warn)"
			})
		]
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
							/* @__PURE__ */ jsxs("span", { children: ["distance r = ", /* @__PURE__ */ jsx("strong", { children: r.toFixed(1) })] }),
							/* @__PURE__ */ jsxs("span", { children: ["pull F = GMm/r² = ", /* @__PURE__ */ jsx("strong", { children: F.toFixed(1) })] }),
							/* @__PURE__ */ jsxs("span", { children: [
								"at 2r the pull would be ",
								/* @__PURE__ */ jsx("strong", { children: (F / 4).toFixed(1) }),
								" (¼)"
							] })
						]
					})
				}),
				graph,
				/* @__PURE__ */ jsx("p", {
					style: {
						fontSize: 12,
						opacity: .75,
						margin: 0
					},
					children: "The curve falls as 1/r², steeply near the planet, then a long faint tail. Same maths gives orbital speed v = √(GM/r) and ties straight into the Kepler lab."
				}),
				/* @__PURE__ */ jsx(LiveRegion, { children: `Distance ${r.toFixed(1)}, pull ${F.toFixed(1)}. Doubling the distance quarters the force.` })
			]
		}),
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
			label: "planet mass M",
			value: `${M}`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: M,
				min: 1,
				max: 9,
				step: 1,
				onChange: setM,
				ariaLabel: "planet mass"
			})
		}), /* @__PURE__ */ jsx(Field, {
			label: "satellite mass m",
			value: `${m}`,
			children: /* @__PURE__ */ jsx(Slider, {
				value: m,
				min: 1,
				max: 5,
				step: 1,
				onChange: setm,
				ariaLabel: "satellite mass"
			})
		})] }),
		controlConfig,
		footer: /* @__PURE__ */ jsx(ChallengeCard, {
			questions: GRAVITATION_CHALLENGE,
			state: challenge,
			title: "Predict"
		}),
		children: figure
	});
}

//#endregion
export { GravitationLab };