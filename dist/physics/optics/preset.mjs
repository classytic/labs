'use client';

import { Callout, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { OPTICS_RAY_ASSET } from "./asset.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Scene, isAssetGeom, registerAsset, resolve } from "@classytic/stage";

//#region src/physics/optics/preset.tsx
/**
* Optics flagship, drag the source, the aim point, or the mirrors so the light
* ray reflects into the target. A general tool built on @classytic/stage:
* creators place any mirrors + target.
*/
registerAsset("optics-ray", OPTICS_RAY_ASSET);
const MIRROR = { hidden: true };
function opticsDoc() {
	return {
		schemaVersion: 2,
		type: "stage-scene",
		view: {
			xMin: -8,
			xMax: 8,
			yMin: -5,
			yMax: 5
		},
		elements: [
			{
				id: "S",
				kind: "point",
				label: "source",
				a11y: { label: "light source" },
				style: { color: "var(--stage-warn)" },
				free: {
					at: {
						x: -6,
						y: -3
					},
					draggable: true
				}
			},
			{
				id: "aim",
				kind: "point",
				label: "aim",
				style: { color: "var(--stage-warn)" },
				free: {
					at: {
						x: -3.4,
						y: -1.2
					},
					draggable: true
				}
			},
			{
				id: "T",
				kind: "point",
				label: "target",
				style: { color: "var(--stage-good)" },
				free: { at: {
					x: 6,
					y: 3
				} }
			},
			{
				id: "M1a",
				kind: "point",
				style: { color: "var(--stage-metal)" },
				free: {
					at: {
						x: -1,
						y: 4
					},
					draggable: true
				}
			},
			{
				id: "M1b",
				kind: "point",
				style: { color: "var(--stage-metal)" },
				free: {
					at: {
						x: 2,
						y: -2
					},
					draggable: true
				}
			},
			{
				id: "m1",
				kind: "segment",
				style: MIRROR,
				def: {
					op: "segment",
					from: { ref: "M1a" },
					to: { ref: "M1b" }
				}
			},
			{
				id: "M2a",
				kind: "point",
				style: { color: "var(--stage-metal)" },
				free: {
					at: {
						x: 3,
						y: 4
					},
					draggable: true
				}
			},
			{
				id: "M2b",
				kind: "point",
				style: { color: "var(--stage-metal)" },
				free: {
					at: {
						x: 6,
						y: -1
					},
					draggable: true
				}
			},
			{
				id: "m2",
				kind: "segment",
				style: MIRROR,
				def: {
					op: "segment",
					from: { ref: "M2a" },
					to: { ref: "M2b" }
				}
			},
			{
				id: "ray",
				kind: "asset",
				def: {
					op: "asset",
					asset: "optics-ray",
					params: {
						maxBounces: 8,
						targetR: .6,
						far: 60
					},
					bind: {
						source: { ref: "S" },
						aim: { ref: "aim" },
						target: { ref: "T" },
						m0: { ref: "m1" },
						m1: { ref: "m2" }
					}
				}
			}
		],
		bindings: []
	};
}
function OpticsLab({ height = 380 }) {
	const [doc, setDoc] = useState(() => opticsDoc());
	const geom = useMemo(() => resolve(doc), [doc]).values.get("ray");
	const hit = isAssetGeom(geom) && geom.meta?.hit === true;
	const bounces = isAssetGeom(geom) ? Number(geom.meta?.bounces ?? 0) : 0;
	useCheckpoint({
		solved: hit,
		activity: "optics-light-target"
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title: "Reflect the beam into the target",
		prompt: "Drag the source, the aim point, or the mirrors so the ray reflects into the target.",
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsxs("span", {
				style: {
					display: "grid",
					gap: 4
				},
				children: [/* @__PURE__ */ jsxs("span", {
					style: { opacity: .8 },
					children: ["bounces: ", bounces]
				}), /* @__PURE__ */ jsx("span", {
					style: {
						color: hit ? "var(--stage-good)" : "var(--stage-warn)",
						fontWeight: 600
					},
					children: hit ? "✓ Target lit!" : "not yet, keep adjusting"
				})]
			})
		}),
		children: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Scene, {
			doc,
			onChange: setDoc,
			interactive: true,
			showGrid: false,
			showAxes: false,
			height,
			ariaLabel: "Optics: reflect the light ray into the target"
		}), /* @__PURE__ */ jsx(LiveRegion, { children: hit ? "The light ray reaches the target." : "The ray misses the target." })] })
	});
}

//#endregion
export { OpticsLab, opticsDoc };