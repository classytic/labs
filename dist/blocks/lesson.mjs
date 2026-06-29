'use client';

import { ChallengeCard, useChallenge, useCheckpoint } from "../kit/pedagogy.mjs";
import { ConfigPanel, ConfigRow, RowsEditor, TextField } from "./authoring.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/lesson.tsx
/**
* @classytic/labs/blocks, lesson / pedagogy blocks (domain-neutral).
*
* `PredictBlock` is the missing primitive that lets a CREATOR, not a developer , 
* author a predict-first lesson: a multiple-choice question the learner commits to
* before the reveal. A correct pick shows the "why" and reports completion through
* the learner/step seam, so dropping one between or after any lab turns a sequence
* of widgets into a gated, guided lesson. The creator authors the prompt, the
* choices (mark the correct one), and the explanation, entirely in the editor.
*
* This is the authorable version of the predict-first card that the "Why ice floats"
* reference lesson used in code: same ChallengeCard + useCheckpoint underneath, now
* exposed as a block so creators bring their own questions.
*/
const DEFAULT_CHOICES = [{
	label: "Option A",
	correct: true
}, {
	label: "Option B",
	correct: false
}];
/** Render a predict-first question and report completion when answered correctly. */
function PredictWidget({ prompt, choices, explain, title }) {
	const list = Array.isArray(choices) && choices.length ? choices : DEFAULT_CHOICES;
	const answerIdx = Math.max(0, list.findIndex((c) => c.correct));
	return /* @__PURE__ */ jsx(PredictRunner, {
		q: {
			id: "q",
			prompt: prompt ?? "What do you predict?",
			choices: list.map((c, i) => ({
				value: String(i),
				label: c.label
			})),
			answer: String(answerIdx),
			explain
		},
		title
	});
}
function PredictRunner({ q, title }) {
	const ch = useChallenge([q]);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: "predict"
	});
	return /* @__PURE__ */ jsx(ChallengeCard, {
		questions: [q],
		state: ch,
		title: title ?? "Predict first"
	});
}
const PredictBlock = defineBlock({
	key: "predict",
	tag: "Predict",
	void: true,
	label: "Predict / quiz question",
	description: "A predict-first multiple-choice question. The learner commits to an answer; a correct pick reveals the explanation and completes the step (so it can gate a guided lesson). Author your own prompt, choices and explanation, drop it before or after any lab.",
	category: "interactive",
	schema: z.object({
		prompt: z.string().default("What do you predict?"),
		choices: z.array(z.object({
			label: z.string(),
			correct: z.boolean()
		})).default(DEFAULT_CHOICES),
		explain: z.string().optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const choices = Array.isArray(attributes.choices) && attributes.choices.length ? attributes.choices : DEFAULT_CHOICES;
		const widget = /* @__PURE__ */ jsx(PredictWidget, {
			prompt: attributes.prompt,
			choices,
			explain: attributes.explain,
			title: attributes.title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [
			/* @__PURE__ */ jsxs(ConfigPanel, { children: [
				/* @__PURE__ */ jsx(ConfigRow, {
					label: "prompt",
					children: /* @__PURE__ */ jsx(TextField, {
						value: attributes.prompt ?? "",
						onChange: (v) => updateAttributes({ prompt: v }),
						placeholder: "What do you predict?"
					})
				}),
				/* @__PURE__ */ jsx(ConfigRow, {
					label: "card title",
					children: /* @__PURE__ */ jsx(TextField, {
						value: attributes.title ?? "",
						onChange: (v) => updateAttributes({ title: v }),
						placeholder: "Predict first"
					})
				}),
				/* @__PURE__ */ jsx(ConfigRow, {
					label: "explain (on correct)",
					children: /* @__PURE__ */ jsx(TextField, {
						value: attributes.explain ?? "",
						onChange: (v) => updateAttributes({ explain: v }),
						placeholder: "Why it's right…"
					})
				})
			] }),
			/* @__PURE__ */ jsx(RowsEditor, {
				rows: choices,
				onChange: (rows) => updateAttributes({ choices: rows }),
				columns: [{
					key: "label",
					label: "choice",
					type: "text",
					grow: true
				}, {
					key: "correct",
					label: "correct",
					type: "bool"
				}],
				newRow: () => ({
					label: "",
					correct: false
				}),
				addLabel: "choice"
			}),
			widget
		] });
	}
});
const lessonBlocks = [PredictBlock];
const lessonComponents = { Predict: PredictWidget };

//#endregion
export { PredictBlock, PredictWidget, lessonBlocks, lessonComponents };