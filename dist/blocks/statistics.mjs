import { CenterSpreadLab } from "../statistics/center-spread/preset.mjs";
import { SequenceLab } from "../statistics/sequence/preset.mjs";
import { GaltonBoardLab } from "../statistics/galton/preset.mjs";
import { HistogramBoxLab } from "../statistics/histogram/preset.mjs";
import { NormalDistributionLab } from "../statistics/normal/preset.mjs";
import { ZTableLab } from "../statistics/z-table/preset.mjs";
import { SamplingDistributionLab } from "../statistics/sampling/preset.mjs";
import { LabConfig } from "./lab-config.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/statistics.tsx
const common = {
	title: z.string().optional(),
	prompt: z.string().optional(),
	objectives: z.array(z.string()).optional(),
	hints: z.array(z.string()).optional(),
	controlId: z.string().optional()
};
function lab(key, tag, label, description, schema, Comp) {
	return defineBlock({
		key,
		tag,
		void: true,
		label,
		description,
		category: "interactive",
		schema,
		Component: ({ attributes, mode, updateAttributes }) => {
			const widget = Comp(attributes);
			if (mode !== "editing" || !updateAttributes) return widget;
			return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(LabConfig, {
				schema,
				value: attributes,
				onChange: updateAttributes
			}), widget] });
		}
	});
}
const centerSchema = z.object({
	data: z.array(z.number()).optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	step: z.number().optional(),
	showSigma: z.boolean().optional(),
	challenge: z.object({
		stat: z.enum(["mean", "median"]),
		target: z.number()
	}).optional(),
	...common
});
const CenterSpreadBlock = lab("center-spread", "CenterSpread", "Centre & spread (mean as balance point)", "Drag data points on a number line: the mean rides as a balance-point fulcrum, the median holds, the mode lights up, and a σ band breathes. Outliers move the mean, not the median.", centerSchema, (a) => /* @__PURE__ */ jsx(CenterSpreadLab, { ...a }));
const seqSchema = z.object({
	kind: z.enum(["arithmetic", "geometric"]).optional(),
	first: z.number().optional(),
	step: z.number().optional(),
	count: z.number().optional(),
	...common
});
const SeriesBlock = lab("series", "Series", "Sequences & series", "Arithmetic / geometric sequences as bars with a running-total line; for |r|<1 the total converges onto the dashed S∞ guide.", seqSchema, (a) => /* @__PURE__ */ jsx(SequenceLab, { ...a }));
const galtonSchema = z.object({
	rows: z.number().optional(),
	seed: z.number().optional(),
	showCurve: z.boolean().optional(),
	...common
});
const GaltonBlock = lab("galton", "GaltonBoard", "Galton board (central limit theorem)", "Balls bounce through pegs (each a coin-flip) and pile into a bell curve hugging the theoretical normal, the CLT made visible.", galtonSchema, (a) => /* @__PURE__ */ jsx(GaltonBoardLab, { ...a }));
const histoSchema = z.object({
	data: z.array(z.number()).optional(),
	bins: z.number().optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	...common
});
const HistogramBlock = lab("histogram", "HistogramBox", "Histogram & box plot", "The shape of data: a binned histogram + a box-and-whisker on a shared axis. Click to drop points; symmetric/skewed/bimodal presets; outliers beyond 1.5·IQR.", histoSchema, (a) => /* @__PURE__ */ jsx(HistogramBoxLab, { ...a }));
const normalSchema = z.object({
	mu: z.number().optional(),
	sigma: z.number().optional(),
	a: z.number().optional(),
	b: z.number().optional(),
	mode: z.enum(["area", "rule"]).optional(),
	...common
});
const NormalBlock = lab("normal", "NormalDistribution", "Normal curve, area & z-scores", "Drag the shaded bounds → P(a≤X≤b) as area, with z-scores; or the 68-95-99.7 rule view. Slide μ and σ to reshape it.", normalSchema, (a) => /* @__PURE__ */ jsx(NormalDistributionLab, { ...a }));
const ztableSchema = z.object({
	x: z.number().optional(),
	mu: z.number().optional(),
	sigma: z.number().optional(),
	tail: z.enum(["left", "right"]).optional(),
	...common
});
const ZTableBlock = lab("z-table", "ZTable", "z-table (standardize & look up)", "Standardize x → z, and the live Φ(z) grid highlights the row/column/cell (auto-scrolled) while a mini curve shades the tail. Negative z via symmetry.", ztableSchema, (a) => /* @__PURE__ */ jsx(ZTableLab, { ...a }));
const samplingSchema = z.object({
	mu: z.number().optional(),
	sigma: z.number().optional(),
	n: z.number().optional(),
	confidence: z.number().optional(),
	mode: z.enum(["sampling", "ci"]).optional(),
	...common
});
const SamplingBlock = lab("sampling", "SamplingDistribution", "Sampling distribution & confidence intervals", "Stack confidence intervals → ~C% capture μ (what \"95% confident\" means), or watch sample means pile into Normal(μ, σ/√n).", samplingSchema, (a) => /* @__PURE__ */ jsx(SamplingDistributionLab, { ...a }));
const statisticsBlocks = [
	CenterSpreadBlock,
	SeriesBlock,
	GaltonBlock,
	HistogramBlock,
	NormalBlock,
	ZTableBlock,
	SamplingBlock
];
const statisticsComponents = {
	CenterSpread: CenterSpreadLab,
	Series: SequenceLab,
	GaltonBoard: GaltonBoardLab,
	HistogramBox: HistogramBoxLab,
	NormalDistribution: NormalDistributionLab,
	ZTable: ZTableLab,
	SamplingDistribution: SamplingDistributionLab
};

//#endregion
export { CenterSpreadBlock, GaltonBlock, HistogramBlock, NormalBlock, SamplingBlock, SeriesBlock, ZTableBlock, statisticsBlocks, statisticsComponents };