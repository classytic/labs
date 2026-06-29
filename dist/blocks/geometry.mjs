import { GeometryBoard } from "../geometry/board/preset.mjs";
import { IntersectingCircles } from "../geometry/intersecting-circles.mjs";
import { GeometryBuilder } from "../geometry/builder.mjs";
import { ConfigPanel, ConfigRow, NumField, TextField } from "./authoring.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/geometry.tsx
/**
* @classytic/labs/blocks, geometry lab block specs.
*
* `defineBlock` editor adapters for the geometry labs (one domain per file; the
* registry is assembled in `./index.ts`). Each spec pairs a zod schema with a
* render `Component` that, in `mode === 'editing'`, shows the authoring kit
* (`./authoring`). `@classytic/cms-ui` + `zod` are optional peers touched only
* by the blocks layer.
*/
const DEFAULT_SCENE = [
	{
		type: "point",
		id: "A",
		x: 3,
		y: 0,
		draggable: true,
		label: "A"
	},
	{
		type: "point",
		id: "B",
		x: 6,
		y: 0,
		draggable: true,
		label: "B"
	},
	{
		type: "circle",
		id: "cA",
		center: "A",
		radius: 3
	},
	{
		type: "circle",
		id: "cB",
		center: "B",
		radius: 3
	},
	{
		type: "intersect",
		id: "P",
		of: ["cA", "cB"],
		pick: 0,
		label: "P"
	},
	{
		type: "intersect",
		id: "Q",
		of: ["cA", "cB"],
		pick: 1,
		label: "Q"
	},
	{
		type: "segment",
		from: "P",
		to: "Q",
		label: "chord"
	},
	{
		type: "measure",
		kind: "distance",
		of: ["P", "Q"],
		label: "|PQ|"
	}
];
const asScene = (raw) => Array.isArray(raw) && raw.length ? raw : DEFAULT_SCENE;
const GeometryBoardBlock = defineBlock({
	key: "geometry-board",
	void: true,
	label: "Geometry board",
	description: "Build a construction, points, circles, lines & computed intersections. Drag points live.",
	category: "interactive",
	schema: z.object({
		scene: z.array(z.record(z.string(), z.unknown())).optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const scene = asScene(attributes.scene);
		const title = attributes.title ?? "Geometry";
		if (mode !== "editing" || !updateAttributes) return /* @__PURE__ */ jsx(GeometryBoard, {
			scene,
			title
		});
		return /* @__PURE__ */ jsxs("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 text-xs",
				children: [/* @__PURE__ */ jsx("span", {
					className: "font-medium text-muted-foreground",
					children: "Title"
				}), /* @__PURE__ */ jsx(TextField, {
					value: title,
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})]
			}), /* @__PURE__ */ jsx(GeometryBuilder, {
				scene,
				title,
				onChange: (s) => updateAttributes({ scene: s })
			})]
		});
	}
});
const IntersectingCirclesBlock = defineBlock({
	key: "intersecting-circles",
	void: true,
	label: "Intersecting circles",
	description: "Common chord of two circles, drag the centres, chord length by Pythagoras.",
	category: "interactive",
	schema: z.object({
		r1: z.number().optional(),
		r2: z.number().optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const r1 = typeof attributes.r1 === "number" ? attributes.r1 : 3.2;
		const r2 = typeof attributes.r2 === "number" ? attributes.r2 : 2.8;
		const title = attributes.title ?? "Common chord of two circles";
		const widget = /* @__PURE__ */ jsx(IntersectingCircles, {
			r1,
			r2,
			title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [/* @__PURE__ */ jsx(ConfigRow, {
			label: "Title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: title,
				onChange: (v) => updateAttributes({ title: v }),
				className: "flex-1"
			})
		}), /* @__PURE__ */ jsxs(ConfigRow, {
			label: "r₁ / r₂",
			children: [/* @__PURE__ */ jsx(NumField, {
				value: r1,
				onChange: (v) => updateAttributes({ r1: v })
			}), /* @__PURE__ */ jsx(NumField, {
				value: r2,
				onChange: (v) => updateAttributes({ r2: v })
			})]
		})] }), widget] });
	}
});
const geometryBlocks = [GeometryBoardBlock, IntersectingCirclesBlock];
const geometryComponents = {
	GeometryBoard,
	IntersectingCircles
};

//#endregion
export { GeometryBoardBlock, IntersectingCirclesBlock, geometryBlocks, geometryComponents };