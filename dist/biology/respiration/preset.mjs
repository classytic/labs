'use client';

import { Chip } from "../../kit/controls.mjs";
import { ControlBar, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { ChallengeCard, useChallenge, useCheckpoint } from "../../kit/pedagogy.mjs";
import { ReactionFlow } from "../../kit/reaction.mjs";
import { useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/biology/respiration/preset.tsx
/**
* RespirationLab, photosynthesis ⇌ respiration: one runs the other backwards.
*
* Two reaction flows, stacked, drawn with the SHARED MoleculeGlyph + ReactionFlow
* engine: photosynthesis (6CO₂ + 6H₂O + light → glucose + 6O₂) and respiration
* (glucose + 6O₂ → 6CO₂ + 6H₂O + ATP). The products of one are literally the
* reactants of the other, the closed loop is impossible to forget. A day/night
* toggle shows the NET gas exchange: by day photosynthesis outpaces respiration
* (net O₂ out); at night only respiration runs (net CO₂ out).
*
* Reuses kit/reaction (single source of truth shared with chemistry). Tokenized.
*/
const PHOTO = {
	reactants: [
		{
			kind: "co2",
			coef: 6
		},
		{
			kind: "h2o",
			coef: 6
		},
		{ kind: "light" }
	],
	products: [{ kind: "glucose" }, {
		kind: "o2",
		coef: 6
	}]
};
const RESP = {
	reactants: [{ kind: "glucose" }, {
		kind: "o2",
		coef: 6
	}],
	products: [
		{
			kind: "co2",
			coef: 6
		},
		{
			kind: "h2o",
			coef: 6
		},
		{ kind: "atp" }
	]
};
const RESP_CHALLENGE = [{
	id: "night",
	prompt: "At NIGHT, only respiration runs. Which gas does the plant net RELEASE?",
	choices: [{
		value: "co2",
		label: "CO₂"
	}, {
		value: "o2",
		label: "O₂"
	}],
	answer: "co2",
	explain: "No photosynthesis in the dark, so respiration’s CO₂ output is not reabsorbed."
}, {
	id: "day",
	prompt: "By DAY, photosynthesis outpaces respiration. The net gas LEAVING the leaf is…",
	choices: [{
		value: "o2",
		label: "O₂"
	}, {
		value: "co2",
		label: "CO₂"
	}],
	answer: "o2",
	explain: "Photosynthesis fixes more CO₂ than respiration makes, and releases more O₂ than it uses."
}];
function RespirationLab({ mode = "day", title = "Photosynthesis ⇌ Respiration: one runs the other backwards", prompt = "The products of one are the reactants of the other. Flip day/night to see the net gas exchange.", objectives }) {
	const [when, setWhen] = useState(mode);
	const day = when === "day";
	const challenge = useChallenge(RESP_CHALLENGE);
	useCheckpoint({
		solved: challenge.allCorrect,
		activity: "respiration"
	});
	const photoActive = day;
	const net = day ? "Net exchange: O₂ OUT, CO₂ IN (photosynthesis outpaces respiration)" : "Net exchange: CO₂ OUT, O₂ IN (only respiration runs in the dark)";
	const flowCard = (label, organelle, flow, active, accent) => /* @__PURE__ */ jsxs("div", {
		style: {
			borderRadius: 12,
			border: `1px solid ${active ? accent : "var(--stage-grid)"}`,
			background: active ? `color-mix(in oklab, ${accent} 8%, var(--stage-bg))` : "var(--stage-bg)",
			opacity: active ? 1 : .5,
			padding: "8px 10px",
			transition: "opacity 0.2s"
		},
		children: [/* @__PURE__ */ jsxs("p", {
			style: {
				margin: "0 0 2px",
				fontSize: 12,
				fontWeight: 700,
				color: accent
			},
			children: [
				label,
				" ",
				/* @__PURE__ */ jsxs("span", {
					style: {
						color: "var(--stage-muted)",
						fontWeight: 400
					},
					children: ["· ", organelle]
				})
			]
		}), /* @__PURE__ */ jsx(ReactionFlow, {
			reactants: flow.reactants,
			products: flow.products,
			ariaLabel: label
		})]
	});
	const figure = /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 10
		},
		children: [
			flowCard("Photosynthesis", "chloroplast (day)", PHOTO, photoActive, "var(--stage-good)"),
			/* @__PURE__ */ jsx("p", {
				style: {
					textAlign: "center",
					margin: 0,
					fontSize: 11,
					color: "var(--stage-muted)",
					fontWeight: 600
				},
				children: "↑ products feed ↓ reactants, the same six molecules loop ↑"
			}),
			flowCard("Respiration", "mitochondrion (always)", RESP, true, "var(--stage-accent-2)")
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [
			/* @__PURE__ */ jsx(Chip, {
				selected: day,
				onClick: () => setWhen("day"),
				children: "☀ Day"
			}),
			/* @__PURE__ */ jsx(Chip, {
				selected: !day,
				onClick: () => setWhen("night"),
				children: "🌙 Night"
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					fontWeight: 600,
					color: day ? "var(--stage-good)" : "var(--stage-accent-2)"
				},
				children: net
			})
		] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(ChallengeCard, {
			questions: RESP_CHALLENGE,
			state: challenge,
			title: "Predict the net gas exchange"
		}), /* @__PURE__ */ jsx(LiveRegion, { children: `${day ? "Day" : "Night"}. ${net}.` })] }),
		children: figure
	});
}

//#endregion
export { RespirationLab };