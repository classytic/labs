'use client';

import { Chip, Slider } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { AC_DC_ASSET } from "./asset.mjs";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Scene, registerAsset } from "@classytic/stage";

//#region src/circuits/ac-dc/preset.tsx
/**
* AcDcLab, "AC or DC?", now the STANDARD data-driven way: a SceneDoc with one
* `wave` sim (meta.sims) and one `ac-dc` asset that reads the sim live via simBind.
* `<Scene>` steps the sim each frame and the pure resolver re-evaluates, so the
* whole lab is data, the glowing lamp, flowing electrons, water-pipe analogy and
* live scope are all one sim → three synced skins (see ./asset). Controls write the
* sim's params; the runtime merges them without restarting the wave (time persists).
*/
registerAsset("ac-dc", AC_DC_ASSET);
function AcDcLab({ startMode = "dc", volts: volts0 = 9, freqHz: freq0 = 1 } = {}) {
	const [mode, setMode] = useState(startMode);
	const [volts, setVolts] = useState(volts0);
	const [freqHz, setFreqHz] = useState(freq0);
	const doc = useMemo(() => ({
		schemaVersion: 2,
		type: "stage-scene",
		view: {
			xMin: 0,
			xMax: 720,
			yMin: 0,
			yMax: 540
		},
		elements: [{
			id: "fig",
			kind: "asset",
			def: {
				op: "asset",
				asset: "ac-dc",
				params: {},
				bind: {},
				simBind: {
					v: {
						sim: "src",
						field: "v"
					},
					charge: {
						sim: "src",
						field: "charge"
					},
					samples: {
						sim: "src",
						field: "samples"
					},
					mode: {
						sim: "src",
						field: "mode"
					},
					volts: {
						sim: "src",
						field: "volts"
					}
				}
			}
		}],
		bindings: [],
		meta: { sims: [{
			id: "src",
			core: "wave",
			params: {
				mode,
				volts,
				freqHz
			},
			drives: {}
		}] }
	}), [
		mode,
		volts,
		freqHz
	]);
	return /* @__PURE__ */ jsx(LabFrame, {
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "source",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: mode === "dc",
						onClick: () => setMode("dc"),
						children: "DC"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: mode === "ac",
						onClick: () => setMode("ac"),
						children: "AC"
					})]
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "voltage",
				value: `${volts} V`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: volts,
					min: 1,
					max: 12,
					step: 1,
					onChange: setVolts,
					ariaLabel: "Voltage"
				})
			}),
			mode === "ac" && /* @__PURE__ */ jsx(Field, {
				label: "frequency",
				value: `${freqHz.toFixed(1)} Hz`,
				children: /* @__PURE__ */ jsx(Slider, {
					value: freqHz,
					min: .2,
					max: 5,
					step: .1,
					onChange: setFreqHz,
					ariaLabel: "Frequency"
				})
			})
		] }),
		children: /* @__PURE__ */ jsx(Scene, {
			doc,
			interactive: false,
			showGrid: false,
			showAxes: false,
			ariaLabel: "AC versus DC: source, wire, lamp, water analogy and a live scope, all driven by one signal"
		})
	});
}

//#endregion
export { AcDcLab };