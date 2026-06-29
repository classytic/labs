'use client';

import { LabConfig } from "./lab-config.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/lab-block.tsx
/**
* labBlock, wrap a plain lab component into a CMS block "on call", with ZERO
* per-lab boilerplate. The host passes the lab component + its zod prop-schema; this
* returns a `defineBlock` spec whose Component:
*   • in render mode  → spreads the block attributes straight into the lab, and
*   • in editing mode → shows the generic, zod-driven `LabConfig` panel above it
*     (one field per prop, derived from the schema, no hand-written ConfigPanel).
* The MDX tag is auto-derived (PascalCase of the key) by `defineBlock`.
*
* This is the ONE shared factory for every domain (`./physics`, `./chem`, …), a
* domain file just declares `labBlock({ key, label, description, schema, Component })`
* per lab instead of re-implementing the defineBlock + attribute-spread + editor
* wiring each time. `commonLabProps` are the title/prompt/objectives/hints/controlId
* fields every lab accepts; spread them into a lab's schema with `...commonLabProps`.
*/
/** The authoring props every lab accepts. Spread into a lab schema: `{ ...commonLabProps }`. */
const commonLabProps = {
	title: z.string().optional(),
	prompt: z.string().optional(),
	objectives: z.array(z.string()).optional(),
	hints: z.array(z.string()).optional(),
	controlId: z.string().optional()
};
/** PascalCase MDX tag from a kebab key, mirrors `defineBlock`'s default, for building a components map. */
const pascalTag = (key) => key.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
function labBlock({ key, label, description, schema, Component, tag, omit }) {
	const block = defineBlock({
		key,
		void: true,
		...tag ? { tag } : {},
		label,
		description,
		category: "interactive",
		schema,
		Component: ({ attributes, mode, updateAttributes }) => {
			const widget = Component(attributes);
			if (mode !== "editing" || !updateAttributes) return widget;
			return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(LabConfig, {
				schema,
				value: attributes,
				onChange: updateAttributes,
				omit
			}), widget] });
		}
	});
	return Object.assign(block, {
		tag: tag ?? pascalTag(key),
		lab: Component
	});
}
/**
* Derive the tag→component MDX render map from a domain's blocks, ONE source of truth.
* Only `labBlock`-created blocks carry `.lab`; bespoke `defineBlock` blocks (custom editor
* UI) are merged into the map by hand alongside this.
*/
function buildComponents(blocks) {
	const map = {};
	for (const b of blocks) {
		const lb = b;
		if (typeof lb.tag === "string" && typeof lb.lab === "function") map[lb.tag] = lb.lab;
	}
	return map;
}

//#endregion
export { buildComponents, commonLabProps, labBlock };