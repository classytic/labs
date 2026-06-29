'use client';

import { Callout, LabFrame } from "../../kit/frame.mjs";
import { Feedback, useCheckpoint } from "../../kit/pedagogy.mjs";
import { useReducedMotion } from "../../kit/anim.mjs";
import { LabAsk } from "../../kit/ask.mjs";
import { PredictPlot } from "../../kit/predict.mjs";
import { Vessel } from "../../kit/vessel.mjs";
import { getScene } from "../../kit/scenes.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/math/linear-model/preset.tsx
/**
* LinearModelLab, the "concrete → graph" proportion/rate lab. A quantity rises in a
* vessel on one side and is a point on the graph on the other; the learner PLOTS the
* value for the next input by dragging a point. Discover the rule y = slope·x + intercept
* from data, then (optionally) answer a follow-up.
*
* It is NOT the marble lab wearing different hats: the concrete scene is configurable so a
* creator builds their OWN idea. `scene='vessel'` is a glass that fills (water pours in on
* load, the level rises smoothly as you read it); `vesselObjects` decides whether discrete
* things drop in (marbles for "marbles → volume") or it's just liquid (a bottle filling at
* a steady rate, savings growing, charge over time). `scene='none'` drops the twin entirely.
* Swap the labels, units, colours and objects and the same engine is a dozen different labs.
*/
const num = (n) => String(Math.round(n * 100) / 100);
function LinearModelLab(props = {}) {
	const { slope = 5, intercept = 10, given = [0, 1], predictX = 2, xMax = 6, yMax = 40, xStep = 1, yStep = 5, xLabel = "Marbles", yLabel = "Volume", unit = "mL", scene = "vessel", extraScenes = [], vesselObjects = false, vesselBinds = "guess", objectLabel, liquidColor = "var(--stage-accent)", objectColor = "#e85aa6", height = 340, title = "Find the volume", prompt = `Each step adds the same amount. Drag the point to the ${yLabel.toLowerCase()} at ${predictX} ${(objectLabel ?? xLabel).toLowerCase()}.`, activity = "linear-model", ask } = props;
	const rule = (x) => slope * x + intercept;
	const target = rule(predictX);
	const tol = props.tolerance ?? yStep * .5;
	const data = given.map((x) => ({
		x,
		y: rule(x)
	}));
	const [guess, setGuess] = useState({
		x: predictX,
		y: 0
	});
	const solved = Math.abs(guess.y - target) <= tol;
	const moved = guess.y > .001;
	const tone = solved ? "ok" : moved ? "no" : "idle";
	const reduce = useReducedMotion();
	const [filled, setFilled] = useState(false);
	useEffect(() => {
		const t = setTimeout(() => setFilled(true), reduce ? 0 : 80);
		return () => clearTimeout(t);
	}, [reduce]);
	useCheckpoint({
		solved,
		activity,
		response: `${xLabel}=${predictX} → ${num(guess.y)} ${unit}`
	});
	const figure = /* @__PURE__ */ jsx(PredictPlot, {
		data,
		guess,
		onGuess: (p) => setGuess(p),
		tone,
		xMax,
		yMax,
		xStep,
		yStep,
		xLabel,
		yLabel,
		height,
		rule: solved ? {
			slope,
			intercept
		} : null
	});
	const readout = /* @__PURE__ */ jsx(Callout, {
		tone: "result",
		children: /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 6,
				fontSize: 13,
				fontVariantNumeric: "tabular-nums"
			},
			children: [
				/* @__PURE__ */ jsxs("span", { children: ["Your reading: ", /* @__PURE__ */ jsxs("strong", {
					style: { color: `var(--stage-${solved ? "good" : moved ? "warn" : "fg"})` },
					children: [
						num(guess.y),
						" ",
						unit
					]
				})] }),
				/* @__PURE__ */ jsx(Feedback, {
					ok: solved,
					okText: `Spot on, ${num(target)} ${unit}.`,
					tryText: "Read the pattern off the given points."
				}),
				solved && /* @__PURE__ */ jsxs("span", { children: [
					"Rule: ",
					/* @__PURE__ */ jsxs("strong", { children: [
						"+",
						num(slope),
						" ",
						unit
					] }),
					" per ",
					(objectLabel ?? xLabel).toLowerCase().replace(/s$/, ""),
					"."
				] })
			]
		})
	});
	const sceneLabel = `${predictX} ${(objectLabel ?? xLabel).toLowerCase()}`;
	const truthFrac = (filled ? target : 0) / yMax;
	const guessFrac = guess.y / yMax;
	const live = vesselBinds === "guess";
	const levelFrac = live ? guessFrac : truthFrac;
	const readingFrac = live ? void 0 : guessFrac;
	const levelColor = solved ? "var(--stage-good)" : liquidColor;
	const names = scene === "none" ? [] : [scene, ...extraScenes];
	const multi = names.length > 1;
	const dim = multi ? Math.round((height - 8) / names.length) - 6 : height - 8;
	const twins = names.map((name, i) => {
		return /* @__PURE__ */ jsx("div", { children: name === "vessel" ? /* @__PURE__ */ jsx(Vessel, {
			width: multi ? 110 : 132,
			height: dim,
			fillFrac: levelFrac,
			guessFrac: readingFrac,
			guessTone: tone,
			objects: vesselObjects ? predictX : 0,
			liquidColor: levelColor,
			objectColor,
			label: multi ? void 0 : sceneLabel,
			scaleMax: multi ? void 0 : yMax,
			scaleStep: yStep * 2,
			unit
		}) : getScene(name)?.render({
			frac: levelFrac,
			guessFrac: readingFrac,
			guessTone: tone,
			color: levelColor,
			label: multi ? void 0 : sceneLabel,
			width: multi ? 118 : 138,
			height: dim
		}) }, i);
	}).filter((t) => t.props.children);
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		aside: twins.length ? /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 10,
				justifyItems: "center"
			},
			children: [twins, readout]
		}) : readout,
		footer: ask ? /* @__PURE__ */ jsx(LabAsk, {
			ask,
			activity: `${activity}-followup`
		}) : void 0,
		children: figure
	});
}

//#endregion
export { LinearModelLab };