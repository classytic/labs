'use client';

import { AskBox, ChallengeCard, useChallenge, useCheckpoint } from "./pedagogy.mjs";
import { checkAnswer } from "./answer-check.mjs";
import { jsx } from "react/jsx-runtime";

//#region src/kit/ask.tsx
function McqAsk({ prompt, choices, answer, explain, activity }) {
	const qs = [{
		id: "q",
		prompt,
		choices,
		answer,
		explain
	}];
	const state = useChallenge(qs);
	useCheckpoint({
		solved: state.allCorrect,
		activity
	});
	return /* @__PURE__ */ jsx(ChallengeCard, {
		questions: qs,
		state,
		title: ""
	});
}
/** Render a lab's question, MCQ when `choices` is given, otherwise a typed box. */
function LabAsk({ ask, activity }) {
	if (ask.choices && ask.choices.length) return /* @__PURE__ */ jsx(McqAsk, {
		prompt: ask.prompt,
		choices: ask.choices,
		answer: ask.correct ?? "",
		explain: ask.explain,
		activity
	});
	if (ask.answer) return /* @__PURE__ */ jsx(AskBox, {
		prompt: ask.prompt,
		placeholder: ask.placeholder,
		check: (r) => checkAnswer(ask.answer, r),
		activity
	});
	return null;
}

//#endregion
export { LabAsk };