'use client';

import { CheckButton, Chip } from "../kit/controls.mjs";
import { Callout, ControlBar, LabFrame } from "../kit/frame.mjs";
import { useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Label, Segment, Stage, fmt, useCoords, useFrameLoop, useInView } from "@classytic/stage";

//#region src/physics/gravity-drop.tsx
/**
* GravityDrop, drop identical balls on three worlds; stronger gravity wins.
* On the @classytic/stage engine (SVG): three lanes in a fixed coordinate box,
* the balls fall on the engine clock, landing times appear as they hit.
*/
const num = (v, fb) => {
	const n = typeof v === "string" ? parseFloat(v) : v;
	return Number.isFinite(n) ? n : fb;
};
/**
* A falling ball: a shaded sphere (tone fill + top-left specular) with a motion
* trail whose length scales with speed, so the eye reads Jupiter's ball as
* genuinely faster than the Moon's. Drawn in pixels (project the math centre
* first); the trail and highlight are constant-quality regardless of zoom.
*/
function PlanetBall({ cx, y, rPx, tone, vNorm }) {
	const [px, py] = useCoords().toPx(cx, y);
	const rp = rPx;
	const trail = Math.min(1, vNorm) * rp * 5.5;
	return /* @__PURE__ */ jsxs("g", { children: [
		trail > 2 && /* @__PURE__ */ jsx("line", {
			x1: fmt(px),
			y1: fmt(py - rp * .4),
			x2: fmt(px),
			y2: fmt(py - rp * .4 - trail),
			stroke: tone,
			strokeWidth: rp * 1.3,
			strokeLinecap: "round",
			opacity: .16
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: fmt(px),
			cy: fmt(py),
			r: rp,
			fill: tone
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: fmt(px - rp * .32),
			cy: fmt(py - rp * .32),
			r: rp * .4,
			fill: "var(--stage-sheen)",
			opacity: .55
		})
	] });
}
const WORLDS = [
	{
		name: "Moon",
		g: 1.6,
		tone: "var(--stage-fg)"
	},
	{
		name: "Earth",
		g: 9.8,
		tone: "var(--stage-accent)"
	},
	{
		name: "Jupiter",
		g: 24.8,
		tone: "var(--stage-accent-2)"
	}
];
const TOP = 10;
function GravityDrop(props) {
	const fallH = num(props.height, 50);
	const [running, setRunning] = useState(false);
	const [t, setT] = useState(0);
	const startRef = useRef(null);
	const { ref: viewRef, inView } = useInView();
	const maxT = Math.max(...WORLDS.map((wd) => Math.sqrt(2 * fallH / wd.g)));
	useFrameLoop((f) => {
		if (startRef.current === null) startRef.current = f.timeMs;
		const tt = (f.timeMs - startRef.current) / 1e3;
		setT(tt);
		if (tt >= maxT + .4) setRunning(false);
	}, { running: running && inView });
	const drop = () => {
		startRef.current = null;
		setT(0);
		setRunning(true);
	};
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		children: /* @__PURE__ */ jsxs(Stage, {
			view: {
				xMin: 0,
				xMax: WORLDS.length,
				yMin: -2.5,
				yMax: 13.5
			},
			height: 280,
			preserveAspect: false,
			ariaLabel: "Identical balls falling on the Moon, Earth, and Jupiter",
			children: [
				WORLDS.map((_world, i) => /* @__PURE__ */ jsx(Segment, {
					from: {
						x: i + .5 - .4,
						y: 0
					},
					to: {
						x: i + .5 + .4,
						y: 0
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 1.5
				}, `g-${i}`)),
				WORLDS.map((world, i) => {
					const cx = i + .5;
					const tLand = Math.sqrt(2 * fallH / world.g);
					const tt = Math.min(t, tLand);
					const ballY = TOP - Math.min(.5 * world.g * tt * tt / fallH, 1) * TOP;
					const refV = Math.sqrt(2 * fallH * Math.max(...WORLDS.map((w) => w.g)));
					const vNorm = tt < tLand ? world.g * tt / refV : 0;
					return /* @__PURE__ */ jsx(PlanetBall, {
						cx,
						y: ballY,
						rPx: 14,
						tone: world.tone,
						vNorm
					}, `b-${i}`);
				}),
				WORLDS.map((world, i) => /* @__PURE__ */ jsx(Label, {
					x: i + .5,
					y: 0,
					text: world.name,
					color: "var(--stage-fg)",
					size: 13,
					dy: 18
				}, `l-${i}`)),
				WORLDS.map((world, i) => /* @__PURE__ */ jsx(Label, {
					x: i + .5,
					y: TOP,
					text: `g=${world.g}`,
					color: "var(--stage-fg)",
					size: 10,
					dy: -22
				}, `g-l-${i}`)),
				WORLDS.map((world, i) => {
					const tLand = Math.sqrt(2 * fallH / world.g);
					return t >= tLand ? /* @__PURE__ */ jsx(Label, {
						x: i + .5,
						y: 1.2,
						text: `${tLand.toFixed(1)}s`,
						color: "var(--stage-good)",
						size: 11
					}, `t-${i}`) : null;
				})
			]
		})
	});
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(CheckButton, {
		onClick: drop,
		children: "Drop"
	}), /* @__PURE__ */ jsx(Chip, {
		selected: false,
		onClick: () => {
			startRef.current = null;
			setRunning(false);
			setT(0);
		},
		children: "Reset"
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title: "Gravity Drop",
		prompt: `Drop identical balls from ${fallH} m on three worlds, stronger gravity wins.`,
		aside: /* @__PURE__ */ jsxs(Callout, { children: [
			"Same mass, same height, only ",
			/* @__PURE__ */ jsx("strong", { children: "g" }),
			" differs."
		] }),
		controls,
		children: figure
	});
}

//#endregion
export { GravityDrop };