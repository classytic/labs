'use client';

import { Chip, Slider } from "../../kit/controls.mjs";
import { Callout, ControlBar, Field, LabFrame } from "../../kit/frame.mjs";
import { ChallengeCard, HintLadder, RevealSolution, useChallenge, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { bayes } from "../core/probability.mjs";
import { ProportionModel } from "../../kit/proportion.mjs";
import { FrequencyTree } from "../../kit/freq-tree.mjs";
import { StepNav, useSteps } from "../../kit/steps.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface, useFrameLoop, useInView } from "@classytic/stage";
import { SamplerCore } from "@classytic/stage/sim";

//#region src/discrete/bayes/preset.tsx
/**
* BayesLab, base-rate neglect, taught Brilliant-style: ONE idea at a time, big.
*   THEORY (default): a 4-step walkthrough, (1) the rare population, (2) the test
*   catches most sick people, (3) but also flags many healthy ones, (4) so a
*   positive is usually a false alarm. Each step reveals one more layer of a large
*   area model; the frequency tree + answer land on the last step.
*   SAMPLE: draw real people with SamplerCore and watch the empirical posterior
*   converge (capped so it stops; paused off-screen).
* Both render through the shared ProportionModel + FrequencyTree.
*/
const DISEASE = "var(--stage-danger, #e03131)";
const FALSEPOS = "var(--stage-warn, #e8a020)";
const MUTED = "var(--stage-muted)";
const pct = (x) => `${(x * 100).toFixed(x < .01 ? 2 : 1)}%`;
const r0 = (x) => Math.round(x);
function BayesLab({ prior = .01, sensitivity = .9, falsePositive = .09, population = 1e3, conditionLabels = ["disease", "healthy"], testLabels = ["test +", "test −"], predict = false, title = "Bayes: the base-rate trap", prompt, objectives, hints: hintList, controlId }) {
	const [p, setP] = useState(prior);
	const [s, setS] = useState(sensitivity);
	const [f, setF] = useState(falsePositive);
	const [revealed, setRevealed] = useState(!predict);
	const [mode, setMode] = useState("theory");
	const [perStep, setPerStep] = useState(50);
	const [resetN, setResetN] = useState(0);
	const [paused, setPaused] = useState(false);
	const hints = useHints(hintList);
	const steps = useSteps(4);
	const posterior = bayes(s, p, f);
	const [has, not] = conditionLabels, [pos] = testLabels;
	const posShort = pos.replace("test ", "");
	const predictQ = [{
		id: "bayes-posterior",
		prompt: `Of everyone who tests ${posShort}, roughly what fraction TRULY have the ${has}?`,
		choices: [
			{
				value: "most",
				label: "most of them"
			},
			{
				value: "about-half",
				label: "about half"
			},
			{
				value: "small",
				label: "only a small fraction"
			}
		],
		answer: "small",
		explain: `Base-rate neglect: the ${has} is rare (prior ${pct(p)}), so even an accurate test produces far more false alarms than true positives, the posterior stays small.`
	}];
	const ch = useChallenge(predictQ);
	if (predict && ch.allCorrect && !revealed) setRevealed(true);
	useCheckpoint({
		solved: ch.allCorrect,
		activity: "bayes:predict",
		hintsUsed: hints.count
	});
	const N = population;
	const tp = N * p * s, fn = N * p * (1 - s), fp = N * (1 - p) * f, tn = N * (1 - p) * (1 - f);
	const sampling = mode === "sample";
	const { ref: rootRef, inView } = useInView();
	const samp = useRef(null);
	const key = `${p}:${s}:${f}:${resetN}:${mode}`;
	const keyRef = useRef(key);
	const [sdone, setSdone] = useState(false);
	const [, setTick] = useState(0);
	if (keyRef.current !== key) {
		keyRef.current = key;
		samp.current = null;
		if (sdone) setSdone(false);
		if (paused) setPaused(false);
	}
	useFrameLoop((fr) => {
		if (!sampling) return;
		if (!samp.current) samp.current = SamplerCore.reset({
			weights: [
				p * s,
				p * (1 - s),
				(1 - p) * f,
				(1 - p) * (1 - f)
			],
			perStep,
			seed: 1 + resetN,
			maxDraws: 2e5
		});
		else if (!samp.current.done) {
			samp.current = SamplerCore.step({
				...samp.current,
				perStep
			}, Math.min(.05, fr.dtMs / 1e3));
			if (samp.current.done) setSdone(true);
		}
		setTick((t) => (t + 1) % 1e6);
	}, { running: sampling && inView && !sdone && !paused });
	const live = sampling && !!samp.current && samp.current.n > 0;
	const cc = live ? samp.current.counts : [
		tp,
		fn,
		fp,
		tn
	];
	const nTot = live ? samp.current.n : N;
	const dTP = cc[0], dFN = cc[1], dFP = cc[2], dTN = cc[3];
	const dDis = dTP + dFN, dHea = dFP + dTN, dPos = dTP + dFP;
	const dPost = dPos > 0 ? dTP / dPos : posterior;
	const level = sampling ? 3 : steps.step;
	const showResult = level >= 3 && (revealed || sampling);
	useControlSurface(controlId, {
		prevalence: {
			type: "number",
			label: "prior P(A): prevalence",
			min: .001,
			max: .5,
			step: .001,
			get: () => p,
			set: setP
		},
		sensitivity: {
			type: "number",
			label: "P(B|A): true-positive rate",
			min: .5,
			max: 1,
			step: .01,
			get: () => s,
			set: setS
		},
		falsePositive: {
			type: "number",
			label: "P(B|¬A): false-positive rate",
			min: 0,
			max: .5,
			step: .01,
			get: () => f,
			set: setF
		},
		reveal: {
			type: "action",
			label: "reveal the posterior",
			invoke: () => setRevealed(true)
		}
	});
	const diseaseRows = level >= 1 ? [{
		frac: dDis > 0 ? dTP / dDis : 0,
		color: DISEASE,
		lit: true,
		count: dTP
	}, {
		frac: dDis > 0 ? dFN / dDis : 0,
		color: DISEASE,
		opacity: .22,
		count: dFN
	}] : [{
		frac: 1,
		color: DISEASE,
		opacity: .6,
		count: dDis
	}];
	const healthyRows = level >= 2 ? [{
		frac: dHea > 0 ? dFP / dHea : 0,
		color: FALSEPOS,
		lit: true,
		count: dFP
	}, {
		frac: dHea > 0 ? dTN / dHea : 0,
		color: MUTED,
		opacity: .18,
		count: dTN
	}] : [{
		frac: 1,
		color: MUTED,
		opacity: .3,
		count: dHea
	}];
	const captions = [
		`Out of ${r0(N).toLocaleString()} people, only ${r0(tp + fn)} actually have the ${has}, it's rare (${pct(p)}).`,
		`The test is sensitive: of those ${r0(tp + fn)} sick people it catches ${r0(tp)} (and misses ${r0(fn)}).`,
		`But the same test also flags ${r0(fp)} of the ${r0(fp + tn)} healthy people, false alarms.`,
		`So ${r0(tp + fp)} test ${posShort}, yet only ${r0(tp)} are truly sick → a positive means just ${pct(posterior)}.`
	];
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsx("p", {
			className: "lab-step-caption",
			children: sampling ? `Sampling real people… ${r0(nTot).toLocaleString()} drawn. Empirical P(${has}|${posShort}) = ${pct(dPost)} → true ${pct(posterior)}.` : captions[steps.step]
		}),
		/* @__PURE__ */ jsx(ProportionModel, {
			size: 360,
			ariaLabel: `Bayes area model, step ${level + 1}`,
			columns: [{
				frac: dDis,
				label: has,
				rows: diseaseRows
			}, {
				frac: dHea,
				label: not,
				rows: healthyRows
			}],
			caption: level >= 2 ? `outlined bands = ${pos} (${r0(dPos)} of ${r0(nTot)}${live ? " sampled" : ""})` : void 0
		}),
		level >= 2 && /* @__PURE__ */ jsx(PositiveBar, {
			tp: dTP,
			fp: dFP,
			pos,
			has
		})
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: level >= 3 ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(FrequencyTree, {
			ariaLabel: `Of ${r0(nTot)} people, ${r0(dTP)} of ${r0(dPos)} positives truly have ${has}`,
			root: {
				label: live ? "sampled" : "people",
				count: nTot,
				children: [{
					label: has,
					count: dDis,
					color: DISEASE,
					children: [{
						label: posShort,
						count: dTP,
						color: DISEASE,
						lit: true
					}, {
						label: "miss",
						count: dFN
					}]
				}, {
					label: not,
					count: dHea,
					children: [{
						label: `false ${posShort}`,
						count: dFP,
						color: FALSEPOS,
						lit: true
					}, {
						label: "clear",
						count: dTN
					}]
				}]
			}
		}), showResult ? /* @__PURE__ */ jsxs(Callout, {
			tone: "result",
			children: [
				"prior P(",
				has,
				") = ",
				/* @__PURE__ */ jsx("b", { children: pct(p) }),
				/* @__PURE__ */ jsxs("span", {
					className: "lab-callout-big",
					children: [
						"P(",
						has,
						" | ",
						posShort,
						") = ",
						pct(dPost)
					]
				}),
				live && /* @__PURE__ */ jsxs("span", {
					style: {
						fontSize: 12,
						color: MUTED
					},
					children: [
						r0(nTot).toLocaleString(),
						" sampled → true ",
						pct(posterior)
					]
				})
			]
		}) : /* @__PURE__ */ jsx(ChallengeCard, {
			questions: predictQ,
			state: ch,
			title: "Predict first"
		})] }) : void 0,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Field, {
				label: "mode",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [/* @__PURE__ */ jsx(Chip, {
						selected: mode === "theory",
						onClick: () => setMode("theory"),
						children: "walk through"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: sampling,
						onClick: () => setMode("sample"),
						children: "sample it"
					})]
				})
			}),
			sampling && /* @__PURE__ */ jsx(Field, {
				label: "speed (people / frame)",
				children: /* @__PURE__ */ jsx("span", {
					className: "lab-field-row",
					children: [
						10,
						50,
						200
					].map((sp) => /* @__PURE__ */ jsxs(Chip, {
						selected: perStep === sp,
						onClick: () => setPerStep(sp),
						children: [sp, "×"]
					}, sp))
				})
			}),
			sampling && /* @__PURE__ */ jsx(Field, {
				label: "run",
				children: /* @__PURE__ */ jsxs("span", {
					className: "lab-field-row",
					children: [!sdone && /* @__PURE__ */ jsx(Chip, {
						selected: !paused,
						onClick: () => setPaused((v) => !v),
						children: paused ? "▶ resume" : "⏸ pause"
					}), /* @__PURE__ */ jsx(Chip, {
						selected: false,
						onClick: () => {
							setResetN((n) => n + 1);
							setPaused(false);
						},
						children: "↻ new sample"
					})]
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "prevalence",
				value: pct(p),
				children: /* @__PURE__ */ jsx(Slider, {
					value: p,
					min: .001,
					max: .5,
					step: .001,
					onChange: setP,
					ariaLabel: "prevalence"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "sensitivity",
				value: pct(s),
				children: /* @__PURE__ */ jsx(Slider, {
					value: s,
					min: .5,
					max: 1,
					step: .01,
					onChange: setS,
					ariaLabel: "sensitivity"
				})
			}),
			/* @__PURE__ */ jsx(Field, {
				label: "false positive",
				value: pct(f),
				children: /* @__PURE__ */ jsx(Slider, {
					value: f,
					min: 0,
					max: .5,
					step: .01,
					onChange: setF,
					ariaLabel: "false positive rate"
				})
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			!sampling && /* @__PURE__ */ jsx(StepNav, {
				steps,
				nextLabel: "Continue →",
				doneLabel: "✓ that's the trap"
			}),
			/* @__PURE__ */ jsx(RevealSolution, {
				available: !revealed && level >= 3 && !sampling,
				buttonLabel: "Show the answer",
				solution: /* @__PURE__ */ jsxs(Fragment$1, { children: [
					"P(",
					has,
					" | ",
					posShort,
					") = ",
					pct(posterior),
					", far below the test's accuracy, because the prior is only ",
					pct(p),
					"."
				] }),
				onReveal: () => setRevealed(true)
			}),
			/* @__PURE__ */ jsx(HintLadder, { hints })
		] }),
		rootRef,
		children: figure
	});
}
/** The answer as a picture: of everyone who tests +, what red share truly has it.
*  A bar of JUST the positive region (true-positive red | false-positive orange) , 
*  the posterior IS the red fraction, legible at any prior (unlike the 1%-wide
*  column the area model degenerates to). minWidth keeps the red sliver visible. */
function PositiveBar({ tp, fp, pos, has }) {
	const total = tp + fp;
	const frac = total > 0 ? tp / total : 0;
	return /* @__PURE__ */ jsxs("div", {
		style: { marginTop: 12 },
		children: [
			/* @__PURE__ */ jsxs("div", {
				style: {
					fontSize: 12,
					color: MUTED,
					marginBottom: 5
				},
				children: [
					"of the ",
					r0(total).toLocaleString(),
					" who ",
					pos,
					", only the red truly have it:"
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					height: 38,
					borderRadius: 9,
					overflow: "hidden",
					border: "1px solid var(--stage-grid)"
				},
				children: [/* @__PURE__ */ jsx("div", {
					style: {
						flexGrow: tp,
						flexBasis: 0,
						minWidth: tp > 0 ? 26 : 0,
						background: DISEASE,
						color: "var(--stage-bg)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontWeight: 800,
						fontSize: 13
					},
					children: r0(tp).toLocaleString()
				}), /* @__PURE__ */ jsx("div", {
					style: {
						flexGrow: fp,
						flexBasis: 0,
						background: FALSEPOS,
						color: "var(--stage-bg)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontWeight: 700,
						fontSize: 13
					},
					children: r0(fp).toLocaleString()
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					marginTop: 5,
					fontWeight: 800,
					color: DISEASE,
					fontSize: 15
				},
				children: [
					pct(frac),
					" truly ",
					has
				]
			})
		]
	});
}

//#endregion
export { BayesLab };