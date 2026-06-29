'use client';

import { CheckButton, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { Icon, normalizeIcon } from "../icon.mjs";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/language/preposition-scene/preset.tsx
/**
* PrepositionScene, pick the preposition that matches a spatial picture.
*
* Prepositions are inherently spatial, so each item shows a little scene (a
* thing in / on / under / beside a box) and the learner names the relation.
* The teaching point for Bangla speakers: English puts the preposition BEFORE
* the noun ("on the box"), where Bangla uses a postposition AFTER it, so the
* answer slots in front of the noun and the note makes that contrast explicit.
*/
const figAt = (left, top, scale = 1, opacity) => ({
	left,
	top,
	transform: `translate(-50%,-50%)${scale !== 1 ? ` scale(${scale})` : ""}`,
	...opacity != null ? { opacity } : {}
});
const FIGURE_POS = {
	over: figAt("50%", "20%"),
	above: figAt("50%", "20%"),
	on: figAt("50%", "34%"),
	in: figAt("50%", "56%", .6),
	under: figAt("50%", "84%"),
	below: figAt("50%", "84%"),
	beside: figAt("80%", "56%"),
	between: figAt("50%", "56%"),
	behind: figAt("60%", "44%", .85, .5),
	infront: figAt("42%", "64%", 1.1),
	at: figAt("74%", "82%")
};
/** Region landmarks the scene draws as a panel rather than an emoji. */
const BACKDROP_KEYS = [
	"sky",
	"water",
	"ground",
	"room"
];
function Backdrop({ kind }) {
	if (kind === "sky") return /* @__PURE__ */ jsx("div", {
		style: {
			position: "absolute",
			inset: 0,
			background: "linear-gradient(180deg,#bfe1ff,#eef7ff)"
		},
		children: /* @__PURE__ */ jsx("span", {
			style: {
				position: "absolute",
				top: 8,
				right: 14,
				fontSize: 24
			},
			"aria-hidden": true,
			children: "🌞"
		})
	});
	if (kind === "water") return /* @__PURE__ */ jsx("div", { style: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		height: "52%",
		background: "linear-gradient(180deg,#6aa6e6,#3f81cf)",
		borderTopLeftRadius: "30px 14px",
		borderTopRightRadius: "30px 14px"
	} });
	if (kind === "ground") return /* @__PURE__ */ jsx("div", { style: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		height: "32%",
		background: "linear-gradient(180deg,#86c06a,#5fa244)"
	} });
	if (kind === "room") return /* @__PURE__ */ jsx("div", { style: {
		position: "absolute",
		inset: 0,
		background: "linear-gradient(180deg,#f3eee4 62%,#d8c5a8 62%)"
	} });
	return null;
}
/** Figure placement over a backdrop (relative to the region, not a centred emoji).
*  Center-anchored at safe %s for the same no-clip reason as FIGURE_POS. */
function backdropFigPos(kind, rel) {
	const hi = rel === "over" || rel === "above";
	const lo = rel === "under" || rel === "below";
	if (kind === "water") return rel === "in" ? figAt("50%", "76%") : hi ? figAt("50%", "20%") : figAt("50%", "42%");
	if (kind === "sky") return figAt("50%", "38%");
	if (kind === "ground") return hi ? figAt("50%", "20%") : lo ? figAt("50%", "86%") : figAt("50%", "60%");
	return figAt("50%", "48%");
}
/** Plain-text label for an icon value (emoji char or IconRef.alt), for the
*  scene's aria-label, since the visuals themselves are decorative. */
function iconLabel(v) {
	const r = normalizeIcon(v);
	return r ? r.alt || (r.kind === "emoji" ? r.id ?? "" : "") : "";
}
function SceneView({ relation, figure = "🔵", landmark = "📦" }) {
	const isBackdrop = typeof landmark === "string" && BACKDROP_KEYS.includes(landmark);
	const behindLandmark = relation === "behind" && !isBackdrop;
	const fig = /* @__PURE__ */ jsx(Icon, {
		icon: figure,
		className: "lang-prepfig",
		style: isBackdrop ? backdropFigPos(landmark, relation) : FIGURE_POS[relation] ?? FIGURE_POS.on,
		decorative: true
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "lang-prepscene",
		role: "img",
		"aria-label": `${iconLabel(figure)} ${relation} ${iconLabel(landmark)}`.trim(),
		children: [
			isBackdrop && /* @__PURE__ */ jsx(Backdrop, { kind: landmark }),
			!isBackdrop && relation === "between" && /* @__PURE__ */ jsx(Icon, {
				icon: landmark,
				className: "lang-preplandmark",
				style: { left: "28%" },
				decorative: true
			}),
			behindLandmark && fig,
			!isBackdrop && /* @__PURE__ */ jsx(Icon, {
				icon: landmark,
				className: "lang-preplandmark",
				style: relation === "between" ? { left: "72%" } : void 0,
				decorative: true
			}),
			!behindLandmark && fig
		]
	});
}
function PrepositionSceneLab({ items, title = "Where is it?", prompt = "Pick the preposition: in English it comes BEFORE the noun." }) {
	const [idx, setIdx] = useState(0);
	const [picked, setPicked] = useState(null);
	const [solvedCount, setSolvedCount] = useState(0);
	useEffect(() => {
		setIdx(0);
		setPicked(null);
		setSolvedCount(0);
	}, [items]);
	const item = items[idx];
	const correct = picked !== null && item !== void 0 && picked === item.answer;
	const total = items.length;
	const allDone = solvedCount >= total && total > 0;
	useCheckpoint({
		solved: allDone,
		activity: "preposition",
		score: {
			raw: total,
			max: total
		}
	});
	if (!item) return null;
	const pick = (v) => {
		if (correct) return;
		setPicked(v);
		if (v === item.answer) setSolvedCount((s) => Math.min(total, s + 1));
	};
	const next = () => {
		setPicked(null);
		setIdx((i) => Math.min(total - 1, i + 1));
	};
	const isLast = idx === total - 1;
	const figure = /* @__PURE__ */ jsxs("div", {
		className: "lang-lab",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "lang-scene",
				children: /* @__PURE__ */ jsx(SceneView, {
					relation: item.scene,
					figure: item.figure,
					landmark: item.landmark
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "lang-sentence",
				"aria-label": "sentence",
				children: [
					/* @__PURE__ */ jsx("span", { children: item.before }),
					/* @__PURE__ */ jsx("span", {
						className: "lang-blank",
						"data-state": picked === null ? "idle" : correct ? "ok" : "no",
						children: picked ?? "▢"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "lang-noun",
						children: item.noun
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "lang-choices",
				role: "group",
				"aria-label": "prepositions",
				children: item.options.map((v) => /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "lang-choice",
					"data-state": picked === v ? correct ? "ok" : "no" : "idle",
					disabled: correct,
					onClick: () => pick(v),
					"aria-label": v,
					children: v
				}, v))
			}),
			picked !== null && /* @__PURE__ */ jsx("p", {
				className: "lang-why",
				"data-state": correct ? "ok" : "no",
				"aria-live": "polite",
				children: correct ? item.note ?? `English: "${item.answer} ${item.noun}", the preposition comes first.` : "Not quite, look at the picture."
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		aside: /* @__PURE__ */ jsx(StatusPill, {
			ok: allDone,
			children: allDone ? "✓ All correct" : `${solvedCount} / ${total}`
		}),
		controls: correct && !isLast ? /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(CheckButton, {
			onClick: next,
			children: "Next"
		}) }) : void 0,
		children: figure
	});
}

//#endregion
export { PrepositionSceneLab };