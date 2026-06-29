'use client';

import { Chip, LabStyles, Slider, StatusPill } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { CIRCUIT_NETWORK_ASSET } from "./asset.mjs";
import { useMemo } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Scene, controlsFromScene, isAssetGeom, registerAsset, resolve, useControlSurface, useEditor } from "@classytic/stage";

//#region src/circuits/circuit/preset.tsx
/**
* Circuit network, a SceneDoc FACTORY on @classytic/stage. A creator declares a
* battery + parallel BRANCHES (each a series chain of resistor/bulb/switch); the
* learner closes switches and tunes the battery to hit a goal (light a bulb /
* reach a target current / light them all). EMF + each switch are FREE scalars
* driven through the editor command stack, so a voice/agent ("close switch 1",
* "set battery to 9") drives the same path. The stage-based successor to the
* legacy canvas CircuitBuilder.
*/
registerAsset("circuit-network", CIRCUIT_NETWORK_ASSET);
const TYPE_CODE = {
	resistor: 1,
	bulb: 2,
	switch: 3
};
const DEFAULT_BRANCHES = [[{
	type: "switch",
	closed: false
}, {
	type: "bulb",
	ohms: 6
}]];
function flatten(branches) {
	const comps = [];
	const switches = [];
	branches.forEach((chain, b) => chain.forEach((c, p) => {
		comps.push({
			c,
			b,
			p
		});
		if (c.type === "switch") switches.push({
			id: `sw${switches.length}`,
			label: c.label ?? `switch ${switches.length + 1}`
		});
	}));
	return {
		comps,
		switches
	};
}
function circuitDoc({ emf = 6, emfRange = [
	1,
	12,
	1
], internalR = 0, branches = DEFAULT_BRANCHES, goal = { kind: "lightBulb" } }) {
	const { comps, switches } = flatten(branches);
	const nBranch = branches.length;
	const [emfMin, emfMax, emfStep] = emfRange;
	const elements = [{
		id: "emf",
		kind: "scalar",
		label: "battery",
		a11y: { label: "battery voltage" },
		free: {
			value: emf,
			min: emfMin,
			max: emfMax,
			step: emfStep
		}
	}];
	switches.forEach((s, j) => elements.push({
		id: s.id,
		kind: "scalar",
		a11y: { label: s.label },
		free: {
			value: branches.flat().filter((c) => c.type === "switch")[j].closed ? 1 : 0,
			min: 0,
			max: 1,
			step: 1
		}
	}));
	const params = {
		nComp: comps.length,
		nBranch,
		internalR,
		emf,
		goalType: goal.kind === "lightBulb" ? 0 : goal.kind === "targetCurrent" ? 1 : 2,
		goalComp: goal.comp ?? -1,
		goalVal: goal.value ?? (goal.kind === "targetCurrent" ? 1 : .1),
		goalTol: goal.tol ?? .05
	};
	const bind = { emf: { ref: "emf" } };
	let swIdx = 0;
	comps.forEach(({ c, b, p }, i) => {
		params[`t${i}`] = TYPE_CODE[c.type];
		params[`o${i}`] = c.type === "switch" ? 0 : c.ohms;
		params[`b${i}`] = b;
		params[`p${i}`] = p;
		if (c.type === "switch") {
			params[`sw${i}`] = swIdx;
			bind[`k${swIdx}`] = { ref: `sw${swIdx}` };
			swIdx++;
		} else params[`sw${i}`] = -1;
	});
	elements.push({
		id: "circuit",
		kind: "asset",
		def: {
			op: "asset",
			asset: "circuit-network",
			params,
			bind
		}
	});
	const vy = ((nBranch - 1) * 1.5 + 2.2) / 2 + 1;
	return {
		schemaVersion: 2,
		type: "stage-scene",
		view: {
			xMin: -4.6,
			xMax: 4.6,
			yMin: -vy,
			yMax: vy
		},
		elements,
		bindings: []
	};
}
function CircuitNetworkLab(props) {
	const { branches = DEFAULT_BRANCHES, emfRange = [
		1,
		12,
		1
	], controlId, height = 360, prompt = "Close the switch and power the circuit." } = props;
	const { editor, doc } = useEditor(useMemo(() => circuitDoc(props), [JSON.stringify({
		emf: props.emf,
		internalR: props.internalR,
		branches: props.branches,
		goal: props.goal
	})]));
	const resolved = resolve(doc);
	const { switches } = useMemo(() => flatten(branches), [branches]);
	const geom = resolved.values.get("circuit");
	const meta = isAssetGeom(geom) ? geom.meta : {
		solved: false,
		Itotal: 0,
		emf: 0
	};
	const emf = Number(resolved.values.get("emf") ?? 0);
	const [emfMin, emfMax, emfStep] = emfRange;
	useControlSurface(controlId, useMemo(() => controlsFromScene(editor, [{
		id: "emf",
		name: "battery",
		min: emfMin,
		max: emfMax,
		step: emfStep
	}]), [
		editor,
		emfMin,
		emfMax,
		emfStep
	]));
	const setEmf = (v) => {
		editor.dispatch({
			op: "mutate",
			id: "emf",
			patch: { free: { value: v } }
		});
	};
	const toggle = (id) => {
		const cur = Number(resolved.values.get(id) ?? 0);
		editor.dispatch({
			op: "mutate",
			id,
			patch: { free: { value: cur >= .5 ? 0 : 1 } }
		});
	};
	useCheckpoint({
		solved: meta.solved,
		activity: "circuit-network"
	});
	const switchSummary = switches.length ? switches.map((s) => `${s.label} ${Number(resolved.values.get(s.id) ?? 0) >= .5 ? "closed" : "open"}`).join(", ") : "no switches";
	const figureLabel = `Circuit diagram. ${meta.solved ? "Powered, goal reached" : "Not yet powered"}. Battery ${emf} volts. ${switchSummary}. ${prompt}`;
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsx(LabStyles, {}),
		/* @__PURE__ */ jsx(Scene, {
			doc,
			interactive: false,
			showGrid: false,
			showAxes: false,
			height,
			ariaLabel: figureLabel
		}),
		/* @__PURE__ */ jsx(LiveRegion, { children: meta.solved ? "Circuit powered, goal reached." : `Current ${(meta.Itotal * 1e3).toFixed(0)} milliamps.` })
	] });
	const controlsUi = /* @__PURE__ */ jsxs(ControlBar, { children: [switches.map((s) => {
		const closed = Number(resolved.values.get(s.id) ?? 0) >= .5;
		const flip = () => toggle(s.id);
		return /* @__PURE__ */ jsxs(Chip, {
			selected: closed,
			onClick: flip,
			role: "button",
			tabIndex: 0,
			"aria-pressed": closed,
			"aria-label": `toggle ${s.label} (currently ${closed ? "closed" : "open"})`,
			onKeyDown: (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					flip();
				}
			},
			children: [
				s.label,
				": ",
				closed ? "closed" : "open"
			]
		}, s.id);
	}), /* @__PURE__ */ jsx(Field, {
		label: "🔋 battery",
		value: `${emf} V`,
		children: /* @__PURE__ */ jsx(Slider, {
			value: emf,
			min: emfMin,
			max: emfMax,
			step: emfStep,
			onChange: setEmf,
			ariaLabel: `battery voltage, ${emf} volts`,
			style: { width: 120 }
		})
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title: "Power the circuit",
		prompt,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(StatusPill, {
			ok: meta.solved,
			children: meta.solved ? "✓ Powered!" : "Not yet"
		}), /* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [
				"I ≈ ",
				(meta.Itotal * 1e3).toFixed(0),
				" mA"
			]
		})] }),
		controls: controlsUi,
		children: figure
	});
}

//#endregion
export { CircuitNetworkLab, circuitDoc };