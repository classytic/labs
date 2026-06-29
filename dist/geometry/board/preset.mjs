'use client';

import { LabFrame } from "../../kit/frame.mjs";
import { useEffect, useMemo, useState } from "react";
import { jsx } from "react/jsx-runtime";
import { Scene } from "@classytic/stage";

//#region src/geometry/board/preset.tsx
/**
* GeometryBoard, a declarative interactive-geometry engine, now on the
* @classytic/stage scene model. A creator describes a CONSTRUCTION as a list of
* `GeoElement`s; we convert it to a portable SceneDoc and let stage's resolver
* do the dependency math (circle/line intersection, midpoints) + dragging +
* a11y. The canvas geometry math is gone, stage already owns it.
*
*   <GeometryBoard scene={[
*     { type:'point', id:'A', x:3, y:0, draggable:true },
*     { type:'circle', id:'cA', center:'A', radius:3.2 },
*     { type:'intersect', id:'P', of:['cA','cB'], pick:0 },
*   ]} />
*/
const DEFAULT_VIEW = {
	xMin: -1,
	xMax: 11,
	yMin: -5,
	yMax: 5
};
/** Convert a declarative geometry construction into a portable SceneDoc. Stable
*  ids (index-based for unnamed segments/lines/measures) keep resolve continuity. */
function geoSceneToDoc(scene, view) {
	return {
		schemaVersion: 2,
		type: "stage-scene",
		view,
		elements: scene.map((el, i) => {
			switch (el.type) {
				case "point": return {
					id: el.id,
					kind: "point",
					label: el.label,
					style: { color: el.color },
					free: {
						at: {
							x: el.x,
							y: el.y
						},
						draggable: el.draggable
					}
				};
				case "circle": return {
					id: el.id,
					kind: "circle",
					style: { color: el.color },
					def: {
						op: "circle",
						center: { ref: el.center },
						...el.radius != null ? { radius: el.radius } : {},
						...el.through ? { through: { ref: el.through } } : {}
					}
				};
				case "line": return {
					id: el.id ?? `l${i}`,
					kind: "line",
					style: {
						color: el.color,
						dashed: el.dashed
					},
					def: {
						op: "line",
						through: [{ ref: el.through[0] }, { ref: el.through[1] }]
					}
				};
				case "segment": return {
					id: el.id ?? `s${i}`,
					kind: "segment",
					label: el.label,
					style: {
						color: el.color,
						dashed: el.dashed
					},
					def: {
						op: "segment",
						from: { ref: el.from },
						to: { ref: el.to }
					}
				};
				case "intersect": return {
					id: el.id,
					kind: "point",
					label: el.label,
					style: { color: el.color },
					def: {
						op: "intersect",
						of: [{ ref: el.of[0] }, { ref: el.of[1] }],
						pick: el.pick ?? 0
					}
				};
				case "midpoint": return {
					id: el.id,
					kind: "point",
					label: el.label,
					style: { color: el.color },
					def: {
						op: "midpoint",
						of: [{ ref: el.of[0] }, { ref: el.of[1] }]
					}
				};
				case "measure": return {
					id: `d${i}`,
					kind: "measure",
					label: el.label,
					def: {
						op: "distance",
						of: [{ ref: el.of[0] }, { ref: el.of[1] }]
					}
				};
			}
		}),
		bindings: []
	};
}
function GeometryBoard({ scene = [], view = DEFAULT_VIEW, title = "Geometry construction", prompt = "Drag the points to explore the construction.", height = 360 }) {
	const initial = useMemo(() => geoSceneToDoc(scene, view), [scene, view]);
	const [doc, setDoc] = useState(initial);
	useEffect(() => {
		setDoc(initial);
	}, [initial]);
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		children: /* @__PURE__ */ jsx(Scene, {
			doc,
			onChange: setDoc,
			interactive: true,
			showGrid: true,
			showAxes: true,
			height,
			ariaLabel: title
		})
	});
}

//#endregion
export { GeometryBoard, geoSceneToDoc };