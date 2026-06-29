'use client';

import { Chip } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { thermalColor } from "../../kit/thermal.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/chem/periodic-trends/preset.tsx
/**
* PeriodicTrendsLab, the periodic table as a heatmap, so a trend you usually have to
* memorise becomes a colour gradient you can read at a glance. Pick a property
* (atomic radius, ionisation energy, electronegativity) and every tile recolours;
* hover an element for its value. The gradients make the rules obvious: radius grows
* DOWN and LEFT (toward caesium); ionisation energy and electronegativity grow UP and
* RIGHT (toward fluorine). Periods 1–5 (H–Xe); a curated dataset, not a formula , 
* which property is shown (and any highlighted element) is authorable, and a
* predict-first question ships with it.
*/
const ELEMENTS = [
	[
		1,
		"H",
		"Hydrogen",
		1,
		1,
		53,
		2.2,
		1312
	],
	[
		2,
		"He",
		"Helium",
		1,
		18,
		31,
		null,
		2372
	],
	[
		3,
		"Li",
		"Lithium",
		2,
		1,
		167,
		.98,
		520
	],
	[
		4,
		"Be",
		"Beryllium",
		2,
		2,
		112,
		1.57,
		899
	],
	[
		5,
		"B",
		"Boron",
		2,
		13,
		87,
		2.04,
		801
	],
	[
		6,
		"C",
		"Carbon",
		2,
		14,
		67,
		2.55,
		1086
	],
	[
		7,
		"N",
		"Nitrogen",
		2,
		15,
		56,
		3.04,
		1402
	],
	[
		8,
		"O",
		"Oxygen",
		2,
		16,
		48,
		3.44,
		1314
	],
	[
		9,
		"F",
		"Fluorine",
		2,
		17,
		42,
		3.98,
		1681
	],
	[
		10,
		"Ne",
		"Neon",
		2,
		18,
		38,
		null,
		2081
	],
	[
		11,
		"Na",
		"Sodium",
		3,
		1,
		190,
		.93,
		496
	],
	[
		12,
		"Mg",
		"Magnesium",
		3,
		2,
		145,
		1.31,
		738
	],
	[
		13,
		"Al",
		"Aluminium",
		3,
		13,
		118,
		1.61,
		578
	],
	[
		14,
		"Si",
		"Silicon",
		3,
		14,
		111,
		1.9,
		786
	],
	[
		15,
		"P",
		"Phosphorus",
		3,
		15,
		98,
		2.19,
		1012
	],
	[
		16,
		"S",
		"Sulfur",
		3,
		16,
		88,
		2.58,
		1e3
	],
	[
		17,
		"Cl",
		"Chlorine",
		3,
		17,
		79,
		3.16,
		1251
	],
	[
		18,
		"Ar",
		"Argon",
		3,
		18,
		71,
		null,
		1521
	],
	[
		19,
		"K",
		"Potassium",
		4,
		1,
		243,
		.82,
		419
	],
	[
		20,
		"Ca",
		"Calcium",
		4,
		2,
		194,
		1,
		590
	],
	[
		21,
		"Sc",
		"Scandium",
		4,
		3,
		184,
		1.36,
		633
	],
	[
		22,
		"Ti",
		"Titanium",
		4,
		4,
		176,
		1.54,
		659
	],
	[
		23,
		"V",
		"Vanadium",
		4,
		5,
		171,
		1.63,
		651
	],
	[
		24,
		"Cr",
		"Chromium",
		4,
		6,
		166,
		1.66,
		653
	],
	[
		25,
		"Mn",
		"Manganese",
		4,
		7,
		161,
		1.55,
		717
	],
	[
		26,
		"Fe",
		"Iron",
		4,
		8,
		156,
		1.83,
		762
	],
	[
		27,
		"Co",
		"Cobalt",
		4,
		9,
		152,
		1.88,
		760
	],
	[
		28,
		"Ni",
		"Nickel",
		4,
		10,
		149,
		1.91,
		737
	],
	[
		29,
		"Cu",
		"Copper",
		4,
		11,
		145,
		1.9,
		745
	],
	[
		30,
		"Zn",
		"Zinc",
		4,
		12,
		142,
		1.65,
		906
	],
	[
		31,
		"Ga",
		"Gallium",
		4,
		13,
		136,
		1.81,
		579
	],
	[
		32,
		"Ge",
		"Germanium",
		4,
		14,
		125,
		2.01,
		762
	],
	[
		33,
		"As",
		"Arsenic",
		4,
		15,
		114,
		2.18,
		947
	],
	[
		34,
		"Se",
		"Selenium",
		4,
		16,
		103,
		2.55,
		941
	],
	[
		35,
		"Br",
		"Bromine",
		4,
		17,
		94,
		2.96,
		1140
	],
	[
		36,
		"Kr",
		"Krypton",
		4,
		18,
		88,
		3,
		1351
	],
	[
		37,
		"Rb",
		"Rubidium",
		5,
		1,
		265,
		.82,
		403
	],
	[
		38,
		"Sr",
		"Strontium",
		5,
		2,
		219,
		.95,
		549
	],
	[
		39,
		"Y",
		"Yttrium",
		5,
		3,
		212,
		1.22,
		600
	],
	[
		40,
		"Zr",
		"Zirconium",
		5,
		4,
		206,
		1.33,
		640
	],
	[
		41,
		"Nb",
		"Niobium",
		5,
		5,
		198,
		1.6,
		652
	],
	[
		42,
		"Mo",
		"Molybdenum",
		5,
		6,
		190,
		2.16,
		684
	],
	[
		43,
		"Tc",
		"Technetium",
		5,
		7,
		183,
		1.9,
		702
	],
	[
		44,
		"Ru",
		"Ruthenium",
		5,
		8,
		178,
		2.2,
		710
	],
	[
		45,
		"Rh",
		"Rhodium",
		5,
		9,
		173,
		2.28,
		720
	],
	[
		46,
		"Pd",
		"Palladium",
		5,
		10,
		169,
		2.2,
		804
	],
	[
		47,
		"Ag",
		"Silver",
		5,
		11,
		165,
		1.93,
		731
	],
	[
		48,
		"Cd",
		"Cadmium",
		5,
		12,
		161,
		1.69,
		868
	],
	[
		49,
		"In",
		"Indium",
		5,
		13,
		156,
		1.78,
		558
	],
	[
		50,
		"Sn",
		"Tin",
		5,
		14,
		145,
		1.96,
		709
	],
	[
		51,
		"Sb",
		"Antimony",
		5,
		15,
		133,
		2.05,
		834
	],
	[
		52,
		"Te",
		"Tellurium",
		5,
		16,
		123,
		2.1,
		869
	],
	[
		53,
		"I",
		"Iodine",
		5,
		17,
		115,
		2.66,
		1008
	],
	[
		54,
		"Xe",
		"Xenon",
		5,
		18,
		108,
		2.6,
		1170
	]
];
const PROPS = {
	radius: {
		label: "Atomic radius",
		unit: "pm",
		idx: 5,
		trend: "grows ↓ and ←",
		corner: "biggest at the bottom-left (Rb, Cs)"
	},
	ie: {
		label: "Ionisation energy",
		unit: "kJ/mol",
		idx: 7,
		trend: "grows ↑ and →",
		corner: "highest at the top-right (F, Ne, He)"
	},
	en: {
		label: "Electronegativity",
		unit: "",
		idx: 6,
		trend: "grows ↑ and →",
		corner: "highest at the top-right (F)"
	}
};
const W = 600, CELL = 30, OX = 12, OY = 30;
const CHALLENGE = [{
	id: "period",
	prompt: "Going LEFT → RIGHT across a period, atomic radius…",
	choices: [
		{
			value: "down",
			label: "decreases"
		},
		{
			value: "up",
			label: "increases"
		},
		{
			value: "same",
			label: "stays the same"
		}
	],
	answer: "down",
	explain: "More protons pull the same shell of electrons in tighter, so atoms shrink across a period, even as electrons are added."
}, {
	id: "ie",
	prompt: "Ionisation energy is generally highest…",
	choices: [
		{
			value: "tr",
			label: "top-right (near fluorine / the noble gases)"
		},
		{
			value: "bl",
			label: "bottom-left (near caesium)"
		},
		{
			value: "mid",
			label: "in the middle (transition metals)"
		}
	],
	answer: "tr",
	explain: "Small, tightly-held atoms top-right cling hardest to their electrons, so they need the most energy to ionise."
}];
function PeriodicTrendsLab({ property: prop0 = "radius", highlight, title = "Periodic trends: read the table as a heatmap", prompt = "Colour every element by a property and the trend appears as a gradient. Hover an element for its value; switch the property to see the pattern flip.", objectives = [
	"Read periodic trends as colour gradients across the table",
	"Atomic radius grows down a group and shrinks across a period",
	"Ionisation energy & electronegativity grow up and to the right"
] } = {}) {
	const [prop, setProp] = useState(prop0);
	const [selZ, setSelZ] = useState(highlight ? ELEMENTS.find((e) => e[1] === highlight)?.[0] ?? null : null);
	const challenge = useChallenge(CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "periodic-trends"
	});
	const cfg = PROPS[prop];
	const vals = ELEMENTS.map((e) => e[cfg.idx]).filter((v) => v != null);
	const lo = Math.min(...vals), hi = Math.max(...vals);
	const norm = (v) => hi > lo ? (v - lo) / (hi - lo) : .5;
	const H = 236;
	const sel = selZ != null ? ELEMENTS.find((e) => e[0] === selZ) : void 0;
	const legY = 196;
	const figure = /* @__PURE__ */ jsx("div", {
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
			"aria-label": `Periodic table coloured by ${cfg.label}`,
			children: [
				/* @__PURE__ */ jsxs("text", {
					x: OX,
					y: 18,
					fontSize: 12,
					fontWeight: 700,
					fill: "var(--stage-fg)",
					children: [
						cfg.label,
						cfg.unit ? ` (${cfg.unit})` : "",
						", ",
						cfg.trend
					]
				}),
				ELEMENTS.map((e) => {
					const z = e[0], sym = e[1], period = e[3], group = e[4];
					const v = e[cfg.idx];
					const x = OX + (group - 1) * CELL, y = OY + (period - 1) * CELL;
					const t = v != null ? norm(v) : null;
					const fill = t != null ? thermalColor(t) : "var(--stage-grid)";
					const isSel = selZ === z;
					return /* @__PURE__ */ jsxs("g", {
						onPointerEnter: () => setSelZ(z),
						onClick: () => setSelZ(z),
						style: { cursor: "pointer" },
						children: [/* @__PURE__ */ jsx("rect", {
							x,
							y,
							width: CELL - 2,
							height: CELL - 2,
							rx: 3,
							fill,
							opacity: v != null ? .9 : .4,
							stroke: isSel ? "var(--stage-fg)" : "var(--stage-bg)",
							strokeWidth: isSel ? 2 : 1
						}), /* @__PURE__ */ jsx("text", {
							x: x + (CELL - 2) / 2,
							y: y + (CELL - 2) / 2 + 3.5,
							textAnchor: "middle",
							fontSize: 10.5,
							fontWeight: 700,
							fill: t != null && (t < .25 || t > .75) ? "#fff" : "var(--stage-fg)",
							children: sym
						})]
					}, z);
				}),
				/* @__PURE__ */ jsx("text", {
					x: OX,
					y: 207,
					fontSize: 10,
					fill: "var(--stage-muted)",
					children: "low"
				}),
				Array.from({ length: 40 }, (_, i) => /* @__PURE__ */ jsx("rect", {
					x: 38 + i * 5,
					y: legY,
					width: 5,
					height: 12,
					fill: thermalColor(i / 39)
				}, i)),
				/* @__PURE__ */ jsx("text", {
					x: 242,
					y: 207,
					fontSize: 10,
					fill: "var(--stage-muted)",
					children: "high"
				}),
				/* @__PURE__ */ jsxs("text", {
					x: 38,
					y: 222,
					fontSize: 9.5,
					fill: "var(--stage-muted)",
					children: [lo, cfg.unit ? ` ${cfg.unit}` : ""]
				}),
				/* @__PURE__ */ jsxs("text", {
					x: 238,
					y: 222,
					textAnchor: "end",
					fontSize: 9.5,
					fill: "var(--stage-muted)",
					children: [hi, cfg.unit ? ` ${cfg.unit}` : ""]
				})
			]
		})
	});
	const aside = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Callout, {
		tone: "result",
		children: sel ? /* @__PURE__ */ jsxs("span", {
			style: {
				display: "grid",
				gap: 2,
				fontVariantNumeric: "tabular-nums"
			},
			children: [/* @__PURE__ */ jsxs("span", {
				style: {
					fontWeight: 800,
					fontSize: 15
				},
				children: [
					sel[2],
					" (",
					sel[1],
					") · Z=",
					sel[0]
				]
			}), /* @__PURE__ */ jsxs("span", {
				style: {
					fontSize: 13,
					color: "var(--stage-muted)"
				},
				children: [
					cfg.label,
					": ",
					sel[cfg.idx] != null ? `${sel[cfg.idx]} ${cfg.unit}` : ", "
				]
			})]
		}) : /* @__PURE__ */ jsxs("span", {
			style: { fontSize: 13 },
			children: [
				"Hover any element to read its ",
				cfg.label.toLowerCase(),
				"."
			]
		})
	}), /* @__PURE__ */ jsx("div", {
		style: {
			display: "grid",
			gap: 6,
			padding: "8px 2px 0",
			fontSize: 13
		},
		children: /* @__PURE__ */ jsxs("span", {
			style: { color: "var(--stage-muted)" },
			children: [
				cfg.label,
				" ",
				/* @__PURE__ */ jsx("strong", {
					style: { color: "var(--stage-fg)" },
					children: cfg.trend
				}),
				", ",
				cfg.corner,
				". Switch the property and watch the gradient flip direction."
			]
		})
	})] });
	const footer = /* @__PURE__ */ jsx(ChallengeCard, {
		questions: CHALLENGE,
		state: challenge,
		title: "Predict first"
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside,
		controls: /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
			label: "colour by",
			children: /* @__PURE__ */ jsx("span", {
				className: "lab-field-row",
				style: { flexWrap: "wrap" },
				children: Object.keys(PROPS).map((p) => /* @__PURE__ */ jsx(Chip, {
					selected: prop === p,
					onClick: () => setProp(p),
					children: PROPS[p].label
				}, p))
			})
		}) }),
		footer,
		children: figure
	});
}

//#endregion
export { PeriodicTrendsLab };