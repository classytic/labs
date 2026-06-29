import { CYCLE_PRESETS } from "../geography/cycles.mjs";
import { CycleLab } from "../geography/cycle-lab/preset.mjs";
import { ChipToggle, ConfigPanel, ConfigRow, JsonArea, TextField } from "./authoring.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/geography.tsx
/**
* @classytic/labs/blocks, geography lab block specs.
*
* `defineBlock` editor adapter for the general CycleLab. A creator/agent picks a
* canned cycle (water / rock / carbon) OR pastes their own nodes + edges JSON, and
* chooses the challenge. One domain per file; assembled in `./index.ts` and
* exported at `@classytic/labs/blocks/geography`.
*/
const CycleBlock = defineBlock({
	key: "cycle",
	tag: "Cycle",
	void: true,
	label: "Cycle diagram (water / rock / carbon / custom)",
	description: "A general directed-cycle lab: stages laid around a ring with process-labelled arrows. Trace mode lights a stage’s outgoing processes (great for branched rock/carbon cycles); label-process mode strips the process names into a tray to match back onto the arrows. Pick a preset or author your own nodes + edges.",
	category: "interactive",
	schema: z.object({
		preset: z.enum([
			"water",
			"rock",
			"carbon",
			"custom"
		]).default("water"),
		challenge: z.enum(["trace", "label-process"]).default("label-process"),
		nodes: z.array(z.object({
			id: z.string(),
			label: z.string(),
			tone: z.string().optional()
		})).optional(),
		edges: z.array(z.object({
			from: z.string(),
			to: z.string(),
			label: z.string().optional()
		})).optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const preset = attributes.preset ?? "water";
		const spec = preset === "custom" ? {
			nodes: attributes.nodes ?? [],
			edges: attributes.edges ?? []
		} : CYCLE_PRESETS[preset];
		const widget = /* @__PURE__ */ jsx(CycleLab, {
			nodes: spec.nodes,
			edges: spec.edges,
			challenge: attributes.challenge,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const cyclePreset = () => {
			const order = [
				"water",
				"rock",
				"carbon",
				"custom"
			];
			updateAttributes({ preset: order[(order.indexOf(preset) + 1) % order.length] });
		};
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "The water cycle"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "cycle",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: true,
					onClick: cyclePreset,
					children: preset
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "trace mode",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: attributes.challenge === "trace",
					onClick: () => updateAttributes({ challenge: attributes.challenge === "trace" ? "label-process" : "trace" }),
					children: "trace"
				})
			}),
			preset === "custom" && /* @__PURE__ */ jsx(ConfigRow, {
				label: "nodes",
				children: /* @__PURE__ */ jsx(JsonArea, {
					value: attributes.nodes ?? [],
					onChange: (v) => updateAttributes({ nodes: v })
				})
			}),
			preset === "custom" && /* @__PURE__ */ jsx(ConfigRow, {
				label: "edges",
				children: /* @__PURE__ */ jsx(JsonArea, {
					value: attributes.edges ?? [],
					onChange: (v) => updateAttributes({ edges: v })
				})
			})
		] }), widget] });
	}
});
/** This domain's block specs + tag→component render map. */
const geographyBlocks = [CycleBlock];
const geographyComponents = { Cycle: CycleLab };

//#endregion
export { CycleBlock, geographyBlocks, geographyComponents };