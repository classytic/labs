import { MarketEquilibriumLab } from "../commerce/economics/market-equilibrium.mjs";
import { ElasticityRevenueLab } from "../commerce/economics/elasticity-revenue.mjs";
import { DemandShiftVsMoveLab } from "../commerce/economics/demand-shift-vs-move.mjs";
import { ChipToggle, ConfigPanel, ConfigRow, NumField, TextField } from "./authoring.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/economics.tsx
/**
* @classytic/labs/blocks, economics (commerce) lab block specs.
*
* `defineBlock` editor adapters for the economics labs. A creator/agent authors
* the curve parameters + which controls are on. One domain per file; assembled in
* `./index.ts` and exported at `@classytic/labs/blocks/economics`.
*/
const MarketEquilibriumBlock = defineBlock({
	key: "market-equilibrium",
	tag: "MarketEquilibrium",
	void: true,
	label: "Supply & demand equilibrium",
	description: "Drag the price across fixed demand + supply lines; the lab shades the surplus (amber, above eq) or shortage (red, below eq) gap and marks where the market clears. Shift sliders move both P* and Q*. Author the curve parameters.",
	category: "interactive",
	schema: z.object({
		demandIntercept: z.number().default(9),
		demandSlope: z.number().default(.8),
		supplyIntercept: z.number().default(1),
		supplySlope: z.number().default(.7),
		shiftDemand: z.boolean().default(true),
		shiftSupply: z.boolean().default(true),
		goodLabel: z.string().optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(MarketEquilibriumLab, {
			demand: {
				intercept: attributes.demandIntercept ?? 9,
				slope: attributes.demandSlope ?? .8
			},
			supply: {
				intercept: attributes.supplyIntercept ?? 1,
				slope: attributes.supplySlope ?? .7
			},
			shiftControls: {
				demand: attributes.shiftDemand,
				supply: attributes.shiftSupply
			},
			goodLabel: attributes.goodLabel,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "Where the market clears"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "demand intercept",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.demandIntercept ?? 9,
					onChange: (v) => updateAttributes({ demandIntercept: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "demand slope",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.demandSlope ?? .8,
					onChange: (v) => updateAttributes({ demandSlope: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "supply intercept",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.supplyIntercept ?? 1,
					onChange: (v) => updateAttributes({ supplyIntercept: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "supply slope",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.supplySlope ?? .7,
					onChange: (v) => updateAttributes({ supplySlope: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "shift sliders",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: attributes.shiftDemand !== false,
					onClick: () => updateAttributes({
						shiftDemand: attributes.shiftDemand === false,
						shiftSupply: attributes.shiftDemand === false
					}),
					children: "on"
				})
			})
		] }), widget] });
	}
});
const ElasticityRevenueBlock = defineBlock({
	key: "elasticity-revenue",
	tag: "ElasticityRevenue",
	void: true,
	label: "Elasticity & total revenue",
	description: "Rotate the demand line (substitutes) from steep (inelastic) to flat (elastic); drag the price and watch the total-revenue rectangle + the point-elasticity flip elastic→unit→inelastic down a single straight line.",
	category: "interactive",
	schema: z.object({
		pivotP: z.number().default(5),
		pivotQ: z.number().default(5),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(ElasticityRevenueLab, {
			pivot: {
				p: attributes.pivotP ?? 5,
				q: attributes.pivotQ ?? 5
			},
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "The stretch test"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "pivot price",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.pivotP ?? 5,
					onChange: (v) => updateAttributes({ pivotP: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "pivot quantity",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.pivotQ ?? 5,
					onChange: (v) => updateAttributes({ pivotQ: v })
				})
			})
		] }), widget] });
	}
});
const DemandShiftVsMoveBlock = defineBlock({
	key: "demand-shift-vs-move",
	tag: "DemandShiftVsMove",
	void: true,
	label: "Shift vs movement along (demand)",
	description: "Dragging price slides a dot ALONG a fixed demand curve (Δ quantity demanded); clicking a non-price TRIBE factor SHIFTS the whole curve (Δ demand) → new equilibrium. Predict-then-check the P/Q direction.",
	category: "interactive",
	schema: z.object({
		askPrediction: z.boolean().default(true),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(DemandShiftVsMoveLab, {
			askPrediction: attributes.askPrediction,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [/* @__PURE__ */ jsx(ConfigRow, {
			label: "title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: attributes.title ?? "",
				onChange: (v) => updateAttributes({ title: v }),
				placeholder: "Shift or move along?"
			})
		}), /* @__PURE__ */ jsx(ConfigRow, {
			label: "ask prediction",
			children: /* @__PURE__ */ jsx(ChipToggle, {
				active: attributes.askPrediction !== false,
				onClick: () => updateAttributes({ askPrediction: attributes.askPrediction === false }),
				children: "predict-then-check"
			})
		})] }), widget] });
	}
});
/** This domain's block specs + tag→component render map. */
const economicsBlocks = [
	MarketEquilibriumBlock,
	ElasticityRevenueBlock,
	DemandShiftVsMoveBlock
];
const economicsComponents = {
	MarketEquilibrium: MarketEquilibriumLab,
	ElasticityRevenue: ElasticityRevenueLab,
	DemandShiftVsMove: DemandShiftVsMoveLab
};

//#endregion
export { DemandShiftVsMoveBlock, ElasticityRevenueBlock, MarketEquilibriumBlock, economicsBlocks, economicsComponents };