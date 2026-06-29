'use client';

import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useLearner } from "@classytic/stage";

//#region src/kit/pedagogy.tsx
/**
* Pedagogy/assessment kit, the formative-feedback layer every lab shares.
*
* `LabMeta` (objectives, hints, misconceptions, successCriteria) was authored
* but never rendered. This turns it into the Brilliant-style loop:
*   • `useCheckpoint`, the ONE assessment seam: report once on first solve,
*     with a hint penalty folded into the score. Kills the per-lab
*     `if (x === answer) report(...)` + done-ref boilerplate.
*   • `useHints` + `<HintLadder>`, progressive reveal; each hint taken docks
*     the score (pass `hints.count` to useCheckpoint).
*   • `<Objectives>`, the learner-visible goal banner.
*   • `<Feedback>`, unifies success / try-again / misconception note (the
*     misconception is a boolean the lab computes from resolved state).
*   • `<RevealSolution>`, the shared "Show answer" escape hatch every lab gets:
*     a button → a warned solution panel, firing `onReveal` once so the lab can
*     dock the score (peeking ≠ solving). No more dead-end "wrong/right".
*
* Domain glue over stage's learner seam, stays in labs so stage is a pure
* engine; imports only `useLearner` from @classytic/stage.
*/
/** Report completion once, the first time `solved` becomes true. */
function useCheckpoint({ solved, activity, score, hintsUsed = 0, hintPenalty = .1, response }) {
	const learner = useLearner();
	const done = useRef(false);
	const [reported, setReported] = useState(false);
	useEffect(() => {
		if (solved && !done.current) {
			done.current = true;
			setReported(true);
			const base = score ?? {
				raw: 1,
				max: 1
			};
			const factor = Math.max(.1, 1 - hintsUsed * hintPenalty);
			learner?.report({
				activity,
				correct: true,
				completion: true,
				response,
				score: {
					raw: Math.round(base.raw * factor * 100) / 100,
					max: base.max
				}
			});
		}
		if (!solved && done.current) {
			done.current = false;
			setReported(false);
		}
	}, [
		solved,
		activity,
		hintsUsed,
		hintPenalty,
		score?.raw,
		score?.max,
		response,
		learner
	]);
	return {
		solved,
		reported
	};
}
/** Progressive hint state, reveal one at a time. */
function useHints(hints = []) {
	const [n, setN] = useState(0);
	return {
		revealed: hints.slice(0, n),
		count: n,
		hasMore: n < hints.length,
		reveal: () => setN((v) => Math.min(hints.length, v + 1)),
		reset: () => setN(0)
	};
}
/** Learner-visible goal banner ("You'll be able to …"). */
function Objectives({ items }) {
	if (!items?.length) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "lab-objectives",
		children: [/* @__PURE__ */ jsx("span", {
			className: "lab-objectives-h",
			children: "You'll be able to"
		}), /* @__PURE__ */ jsx("ul", { children: items.map((o, i) => /* @__PURE__ */ jsx("li", { children: o }, i)) })]
	});
}
/** The hint ladder, revealed hints + a "need a hint?" button while more remain. */
function HintLadder({ hints }) {
	if (hints.revealed.length === 0 && !hints.hasMore) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "lab-hints",
		children: [hints.revealed.map((h, i) => /* @__PURE__ */ jsxs("p", {
			className: "lab-hint",
			children: [
				/* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					children: "💡"
				}),
				" ",
				h
			]
		}, i)), hints.hasMore && /* @__PURE__ */ jsx("button", {
			type: "button",
			className: "lab-hint-btn",
			onClick: hints.reveal,
			children: hints.count === 0 ? "Need a hint?" : "Another hint"
		})]
	});
}
/** State for a small set of predict/classify questions. */
function useChallenge(questions) {
	const [picks, setPicks] = useState({});
	const total = questions.length;
	const solvedCount = questions.filter((q) => picks[q.id] === q.answer).length;
	return {
		picks,
		pick: (id, value) => setPicks((p) => ({
			...p,
			[id]: value
		})),
		allCorrect: total > 0 && solvedCount === total,
		answeredAll: questions.every((q) => picks[q.id] != null),
		solvedCount,
		total,
		reset: () => setPicks({})
	};
}
/** Renders the challenge questions as choice chips with per-question feedback. */
function ChallengeCard({ questions, state, title = "Predict first" }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "lab-challenge",
		children: [title && /* @__PURE__ */ jsxs("span", {
			className: "lab-challenge-h",
			children: [title, state.total > 1 && /* @__PURE__ */ jsxs("span", {
				className: "lab-challenge-count",
				children: [
					" · ",
					state.solvedCount,
					"/",
					state.total
				]
			})]
		}), questions.map((q, i) => {
			const picked = state.picks[q.id];
			const answered = picked != null;
			const correct = picked === q.answer;
			return /* @__PURE__ */ jsxs("div", {
				className: "lab-challenge-q",
				children: [
					/* @__PURE__ */ jsxs("span", {
						className: "lab-challenge-prompt",
						children: [questions.length > 1 && /* @__PURE__ */ jsx("span", {
							className: "lab-challenge-num",
							"aria-hidden": true,
							children: i + 1
						}), /* @__PURE__ */ jsx("span", { children: q.prompt })]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "lab-choices",
						role: "group",
						"aria-label": typeof q.prompt === "string" ? q.prompt : "choices",
						children: q.choices.map((c) => {
							const isPicked = picked === c.value;
							const tone = !answered ? void 0 : c.value === q.answer ? "correct" : isPicked ? "wrong" : void 0;
							return /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "lab-choice",
								"data-picked": isPicked || void 0,
								"data-tone": tone,
								"aria-pressed": isPicked,
								onClick: () => state.pick(q.id, c.value),
								children: c.label
							}, c.value);
						})
					}),
					answered && (correct ? /* @__PURE__ */ jsxs("span", {
						className: "lab-pill",
						"data-state": "ok",
						role: "status",
						children: ["✓ ", q.explain ?? "Correct"]
					}) : /* @__PURE__ */ jsx("span", {
						className: "lab-pill",
						"data-state": "no",
						role: "status",
						children: "Not yet, try again"
					}))
				]
			}, q.id);
		})]
	});
}
function AskBox({ prompt, placeholder = "your answer", check, activity }) {
	const [raw, setRaw] = useState("");
	const [verdict, setVerdict] = useState(null);
	const [solved, setSolved] = useState(false);
	useCheckpoint({
		solved,
		activity
	});
	const run = () => {
		const ok = check(raw);
		setVerdict(ok);
		if (ok) setSolved(true);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "lab-challenge",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "lab-challenge-prompt",
				children: prompt
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "lab-ask-row",
				children: [
					/* @__PURE__ */ jsx("input", {
						className: "lab-input",
						value: raw,
						placeholder,
						"aria-label": "answer",
						onChange: (e) => {
							setRaw(e.currentTarget.value);
							setVerdict(null);
						},
						onKeyDown: (e) => {
							if (e.key === "Enter") run();
						}
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "lab-btn",
						onClick: run,
						children: "Check"
					}),
					verdict === true && /* @__PURE__ */ jsx("span", {
						className: "lab-pill",
						"data-state": "ok",
						role: "status",
						children: "✓ Correct"
					}),
					verdict === false && /* @__PURE__ */ jsx("span", {
						className: "lab-pill",
						"data-state": "no",
						role: "status",
						children: "Not yet, try again"
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				"aria-live": "polite",
				style: {
					position: "absolute",
					width: 1,
					height: 1,
					overflow: "hidden",
					clipPath: "inset(50%)"
				},
				children: verdict === true ? "Correct." : verdict === false ? "Not yet." : ""
			})
		]
	});
}
/** Unified success / misconception / try-again feedback. */
function Feedback({ ok, misconception, okText = "Correct", tryText = "Not yet, keep going" }) {
	if (ok) return /* @__PURE__ */ jsxs("span", {
		className: "lab-pill",
		"data-state": "ok",
		children: ["✓ ", okText]
	});
	if (misconception) return /* @__PURE__ */ jsxs("span", {
		className: "lab-misconception",
		role: "status",
		children: [
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": true,
				children: "⚠"
			}),
			" ",
			misconception
		]
	});
	return /* @__PURE__ */ jsx("span", {
		className: "lab-pill",
		"data-state": "no",
		children: tryText
	});
}
/**
* The shared "Show answer" escape hatch, so no lab is a dead-end "wrong/right".
* Manages its own shown/hidden; `key` it (e.g. per step/event) to reset between
* questions. Revealing is a deliberate peek: it warns and reports via `onReveal`.
*/
function RevealSolution({ solution, available = true, onReveal, buttonLabel = "Show answer", note = "Peeking, this one won’t count as solved on your own." }) {
	const [shown, setShown] = useState(false);
	if (shown) return /* @__PURE__ */ jsxs("div", {
		className: "lab-solution",
		role: "status",
		children: [
			/* @__PURE__ */ jsxs("span", {
				className: "lab-solution-h",
				children: [/* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					children: "🔑"
				}), " Solution"]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "lab-solution-body",
				children: solution
			}),
			note && /* @__PURE__ */ jsx("p", {
				className: "lab-solution-note",
				children: note
			})
		]
	});
	if (!available) return null;
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		className: "lab-reveal-btn",
		onClick: () => {
			setShown(true);
			onReveal?.();
		},
		children: buttonLabel
	});
}

//#endregion
export { AskBox, ChallengeCard, Feedback, HintLadder, Objectives, RevealSolution, useChallenge, useCheckpoint, useHints };