'use client';

import { clamp, num } from "../core/util.mjs";
import { Slider } from "../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../kit/frame.mjs";
import { PlayWrap, usePlayGate } from "../kit/play.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Circle, Dot, Label, Stage, useFrameLoop } from "@classytic/stage";

//#region src/chem/bohr-atom.tsx
/**
* BohrAtom, the classic shell model of an atom, animated.
*
* Nucleus (Z protons) ringed by electron shells filled 2, 8, 8, 18…; electrons
* orbit at a steady clip via the engine clock. Drag the proton count to walk the
* first 20 elements and watch shells fill and close.
*
* Now on the @classytic/stage engine (SVG, accessible, themed), shells are
* Circles, electrons are Dots, the nucleus is a labelled Circle.
*/
const SYMBOLS = [
	"",
	"H",
	"He",
	"Li",
	"Be",
	"B",
	"C",
	"N",
	"O",
	"F",
	"Ne",
	"Na",
	"Mg",
	"Al",
	"Si",
	"P",
	"S",
	"Cl",
	"Ar",
	"K",
	"Ca"
];
const SHELL_CAP = [
	2,
	8,
	8,
	18
];
const NUCLEONS = [
	{
		dx: 0,
		dy: 0,
		p: true
	},
	{
		dx: .6,
		dy: .25,
		p: false
	},
	{
		dx: -.55,
		dy: .35,
		p: true
	},
	{
		dx: .3,
		dy: -.55,
		p: false
	},
	{
		dx: -.4,
		dy: -.5,
		p: true
	},
	{
		dx: .7,
		dy: -.25,
		p: true
	},
	{
		dx: -.7,
		dy: -.1,
		p: false
	},
	{
		dx: .1,
		dy: .6,
		p: false
	}
];
function shellsFor(z) {
	const shells = [];
	let left = z;
	for (const cap of SHELL_CAP) {
		if (left <= 0) break;
		const n = Math.min(cap, left);
		shells.push(n);
		left -= n;
	}
	return shells;
}
const VIEW = {
	xMin: -10,
	xMax: 10,
	yMin: -10,
	yMax: 10
};
function BohrAtom({ protons, title = "Bohr model of the atom", height = 340 } = {}) {
	const [z, setZ] = useState(clamp(Math.round(num(protons, 6)), 1, 20));
	const [spin, setSpin] = useState(0);
	const gate = usePlayGate();
	useEffect(() => {
		setZ(clamp(Math.round(num(protons, 6)), 1, 20));
	}, [protons]);
	useFrameLoop((f) => setSpin((s) => s + f.dtMs / 1e3 * Math.PI), { running: gate.running });
	const shells = shellsFor(z);
	const baseR = 2.6;
	const gap = shells.length > 1 ? (9 - baseR) / (shells.length - 1) : 0;
	const figure = /* @__PURE__ */ jsx(PlayWrap, {
		gate,
		children: /* @__PURE__ */ jsxs(Stage, {
			view: VIEW,
			height,
			ariaLabel: `Bohr model of ${SYMBOLS[z] ?? z} (Z=${z}), configuration ${shells.join(", ")}`,
			children: [
				shells.map((_count, i) => /* @__PURE__ */ jsx(Circle, {
					center: {
						x: 0,
						y: 0
					},
					r: shells.length === 1 ? 4.800000000000001 : baseR + i * gap,
					color: "var(--stage-fg)",
					opacity: .25,
					weight: 1,
					fill: "none"
				}, `s-${i}`)),
				shells.flatMap((count, i) => {
					const r = shells.length === 1 ? 4.800000000000001 : baseR + i * gap;
					const dir = i % 2 === 0 ? 1 : -1;
					const speed = .6 / (i + 1);
					return Array.from({ length: count }, (_, e) => {
						const a = e / count * Math.PI * 2 + dir * spin * speed;
						return /* @__PURE__ */ jsx(Dot, {
							x: r * Math.cos(a),
							y: r * Math.sin(a),
							r: 4,
							color: "var(--stage-accent)"
						}, `e-${i}-${e}`);
					});
				}),
				NUCLEONS.map((nuc, i) => /* @__PURE__ */ jsx(Circle, {
					center: {
						x: nuc.dx,
						y: nuc.dy
					},
					r: .62,
					color: "none",
					fill: nuc.p ? "var(--stage-warn)" : "var(--stage-muted)",
					fillOpacity: 1,
					weight: 0
				}, `nuc-${i}`)),
				/* @__PURE__ */ jsx(Label, {
					x: 0,
					y: 0,
					text: SYMBOLS[z] ?? String(z),
					color: "var(--stage-fg)",
					size: 15,
					weight: 700
				})
			]
		})
	});
	const controls = /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
		label: "protons (Z)",
		value: z,
		children: /* @__PURE__ */ jsx(Slider, {
			value: z,
			min: 1,
			max: 20,
			step: 1,
			onChange: (v) => setZ(Math.round(v)),
			ariaLabel: "proton count",
			style: { width: 130 }
		})
	}) });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: "Drag the proton count to walk the first 20 elements, watch the shells fill (2, 8, 8, …).",
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "grid",
					gap: 4,
					fontVariantNumeric: "tabular-nums"
				},
				children: [
					/* @__PURE__ */ jsxs("span", { children: ["element ", SYMBOLS[z] ?? ", "] }),
					/* @__PURE__ */ jsxs("span", { children: ["Z ", z] }),
					/* @__PURE__ */ jsxs("span", { children: ["config ", shells.join(", ")] })
				]
			})
		}),
		controls,
		children: figure
	});
}

//#endregion
export { BohrAtom };