import { RegressionLab } from "../ml/regression/preset.mjs";
import { KMeansLab } from "../ml/kmeans/preset.mjs";
import { ClassifierThresholdLab } from "../ml/classifier/preset.mjs";
import { DecisionBoundaryLab } from "../ml/boundary/preset.mjs";
import { KNNBoundaryLab } from "../ml/knn/preset.mjs";
import { LabConfig } from "./lab-config.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/ml.tsx
/**
* @classytic/labs/blocks, machine-learning / data-analytics lab block specs.
*
* `defineBlock` editor adapters for the ML labs. REFERENCE for the schema-driven
* authoring panel: the editor config is just `<LabConfig schema={…}>`, one
* Zod-driven panel renders every prop, so there's no hand-built ConfigRow list to
* maintain. Hoist each block's schema to a const so it backs BOTH `defineBlock`
* and the panel. One domain per file; exported at `@classytic/labs/blocks/ml`.
*/
const regressionSchema = z.object({
	data: z.array(z.object({
		x: z.number(),
		y: z.number()
	})).optional(),
	showSquares: z.boolean().default(true),
	learnRate: z.number().default(.006),
	m0: z.number().default(.3),
	b0: z.number().default(3.2),
	span: z.number().default(10),
	title: z.string().optional(),
	prompt: z.string().optional()
});
const RegressionBlock = defineBlock({
	key: "regression",
	tag: "Regression",
	void: true,
	label: "Linear regression / gradient descent",
	description: "Least squares made tactile: drag the line’s ends and each point grows a square of its squared error while the MSE updates live; press Descend to watch gradient descent fit it automatically (a learning-rate slider can make it diverge). Author the dataset + starting line.",
	category: "interactive",
	schema: regressionSchema,
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(RegressionLab, {
			data: attributes.data,
			showSquares: attributes.showSquares,
			learnRate: attributes.learnRate,
			m0: attributes.m0,
			b0: attributes.b0,
			span: attributes.span,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(LabConfig, {
			schema: regressionSchema,
			value: attributes,
			onChange: updateAttributes
		}), widget] });
	}
});
const kmeansSchema = z.object({
	points: z.array(z.object({
		x: z.number(),
		y: z.number()
	})).optional(),
	k: z.number().int().min(1).max(5).default(3),
	seeds: z.array(z.object({
		x: z.number(),
		y: z.number()
	})).optional(),
	span: z.number().default(10),
	showLines: z.boolean().default(true),
	title: z.string().optional(),
	prompt: z.string().optional()
});
const KMeansBlock = defineBlock({
	key: "kmeans",
	tag: "KMeans",
	void: true,
	label: "k-means clustering",
	description: "Unsupervised clustering you watch converge: drag the k centroids to seed them, Step or Run Lloyd’s algorithm (points recolour to nearest centroid, centroids jump to their cluster mean), and the inertia drops. Bad seeds → a worse local minimum. Author the points + k.",
	category: "interactive",
	schema: kmeansSchema,
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(KMeansLab, {
			points: attributes.points,
			k: attributes.k,
			seeds: attributes.seeds,
			span: attributes.span,
			showLines: attributes.showLines,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(LabConfig, {
			schema: kmeansSchema,
			value: attributes,
			onChange: updateAttributes
		}), widget] });
	}
});
const classifierSchema = z.object({
	positives: z.array(z.number()).optional(),
	negatives: z.array(z.number()).optional(),
	threshold: z.number().default(5),
	span: z.number().default(10),
	title: z.string().optional(),
	prompt: z.string().optional()
});
const ClassifierThresholdBlock = defineBlock({
	key: "classifier-threshold",
	tag: "ClassifierThreshold",
	void: true,
	label: "Classification threshold (precision/recall)",
	description: "The precision–recall trade-off, draggable: positive and negative examples overlap on a score axis; slide the threshold and the 2×2 confusion matrix + precision/recall/accuracy/F1 update live, pushing precision up costs recall. Author the two score sets.",
	category: "interactive",
	schema: classifierSchema,
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(ClassifierThresholdLab, {
			positives: attributes.positives,
			negatives: attributes.negatives,
			threshold: attributes.threshold,
			span: attributes.span,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(LabConfig, {
			schema: classifierSchema,
			value: attributes,
			onChange: updateAttributes
		}), widget] });
	}
});
const boundarySchema = z.object({
	dataset: z.enum([
		"separable",
		"overlap",
		"xor"
	]).default("separable"),
	seed: z.number().int().default(11),
	title: z.string().optional(),
	prompt: z.string().optional()
});
const DecisionBoundaryBlock = defineBlock({
	key: "decision-boundary",
	tag: "DecisionBoundary",
	void: true,
	label: "Linear decision boundary (perceptron)",
	description: "A linear classifier you can see think: drag the boundary’s two handles to split two classes by hand (misclassified points get a red ring, accuracy updates live), then hit train and watch a perceptron nudge the line into place itself. The honest twist: the XOR dataset can’t be split by any straight line. Author the dataset + seed.",
	category: "interactive",
	schema: boundarySchema,
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(DecisionBoundaryLab, {
			dataset: attributes.dataset,
			seed: attributes.seed,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(LabConfig, {
			schema: boundarySchema,
			value: attributes,
			onChange: updateAttributes
		}), widget] });
	}
});
const knnSchema = z.object({
	dataset: z.enum([
		"blobs",
		"xor",
		"circles"
	]).default("circles"),
	k: z.number().int().min(1).max(15).default(5),
	seed: z.number().int().default(7),
	title: z.string().optional(),
	prompt: z.string().optional()
});
const KnnBoundaryBlock = defineBlock({
	key: "knn",
	tag: "KnnBoundary",
	void: true,
	label: "k-nearest neighbours boundary",
	description: "The answer to “a line can’t split XOR”: k-NN paints the whole plane by majority vote of each point’s k closest labelled neighbours, carving a curvy boundary that shrugs off XOR and concentric rings. Drag the test point to see its neighbours vote; slide k to feel overfit (k=1, jagged) vs oversmooth (big k). Author the dataset + k.",
	category: "interactive",
	schema: knnSchema,
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(KNNBoundaryLab, {
			dataset: attributes.dataset,
			k: attributes.k,
			seed: attributes.seed,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(LabConfig, {
			schema: knnSchema,
			value: attributes,
			onChange: updateAttributes
		}), widget] });
	}
});
/** This domain's block specs + tag→component render map. */
const mlBlocks = [
	RegressionBlock,
	KMeansBlock,
	ClassifierThresholdBlock,
	DecisionBoundaryBlock,
	KnnBoundaryBlock
];
const mlComponents = {
	Regression: RegressionLab,
	KMeans: KMeansLab,
	ClassifierThreshold: ClassifierThresholdLab,
	DecisionBoundary: DecisionBoundaryLab,
	KnnBoundary: KNNBoundaryLab
};

//#endregion
export { ClassifierThresholdBlock, DecisionBoundaryBlock, KMeansBlock, KnnBoundaryBlock, RegressionBlock, mlBlocks, mlComponents };