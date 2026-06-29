import { SentenceBuilderLab } from "../language/sentence-builder/preset.mjs";
import { WordMatchLab } from "../language/word-match/preset.mjs";
import { ArticleLensLab } from "../language/article-lens/preset.mjs";
import { AgreementLab } from "../language/agreement/preset.mjs";
import { TransformLab } from "../language/transform/preset.mjs";
import { PrepositionSceneLab } from "../language/preposition-scene/preset.mjs";
import { ChipToggle, ConfigPanel, ConfigRow, RowsEditor, TagsField, TextField, coerceArray } from "./authoring.mjs";
import { agreementItemSchema, articleItemSchema, deckSchema, prepItemSchema, sentenceTileSchema, transformTileSchema } from "../schemas/index.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/language.tsx
/**
* @classytic/labs/blocks, language lab block specs.
*
* `defineBlock` editor adapters for the language labs (one domain per file; the
* registry is assembled in `./index.ts`). Each spec pairs a real zod schema
* (`../schemas`) with a render `Component` that, in `mode === 'editing'`, shows
* the row-based authoring kit (`./authoring`). `@classytic/cms-ui` + `zod` are
* optional peers touched only by the blocks layer.
*/
const DEMO_SENTENCE = [
	{
		text: "She",
		pos: "pronoun",
		gloss: "সে"
	},
	{
		text: "reads",
		pos: "verb",
		gloss: "পড়ে"
	},
	{
		text: "a",
		pos: "article"
	},
	{
		text: "book",
		pos: "noun",
		gloss: "বই"
	}
];
const DEMO_DECK = {
	termLang: "en-US",
	transLang: "bn-BD",
	items: [
		{
			term: "water",
			translation: "পানি",
			icon: "💧"
		},
		{
			term: "book",
			translation: "বই",
			icon: "📖"
		},
		{
			term: "fish",
			translation: "মাছ",
			icon: "🐟"
		},
		{
			term: "rice",
			translation: "ভাত",
			icon: "🍚"
		}
	]
};
const SentenceBuilderBlock = defineBlock({
	key: "sentence-builder",
	tag: "SentenceBuilder",
	void: true,
	label: "Sentence builder (word order)",
	description: "Order colour-coded word tiles into a correct sentence, visualizes word order (great for SOV→SVO).",
	category: "interactive",
	schema: z.object({
		tiles: z.array(sentenceTileSchema).default(DEMO_SENTENCE),
		prompt: z.string().optional(),
		promptDir: z.enum(["ltr", "rtl"]).default("ltr"),
		targetDir: z.enum(["ltr", "rtl"]).default("ltr"),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const tiles = coerceArray(attributes.tiles, DEMO_SENTENCE);
		const widget = /* @__PURE__ */ jsx(SentenceBuilderLab, {
			tiles,
			prompt: attributes.prompt,
			promptDir: attributes.promptDir,
			targetDir: attributes.targetDir,
			title: attributes.title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "prompt",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.prompt ?? "",
					onChange: (v) => updateAttributes({ prompt: v }),
					placeholder: "meaning / L1 sentence"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "prompt dir",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: attributes.promptDir === "rtl",
					onClick: () => updateAttributes({ promptDir: attributes.promptDir === "rtl" ? "ltr" : "rtl" }),
					children: "RTL"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "tiles",
				children: /* @__PURE__ */ jsx(RowsEditor, {
					rows: tiles,
					onChange: (v) => updateAttributes({ tiles: v }),
					columns: [
						{
							key: "text",
							label: "word",
							grow: true
						},
						{
							key: "pos",
							label: "part",
							type: "pos"
						},
						{
							key: "gloss",
							label: "gloss",
							grow: true
						}
					],
					newRow: () => ({
						text: "",
						pos: "other"
					}),
					addLabel: "word"
				})
			})
		] }), widget] });
	}
});
const WordMatchBlock = defineBlock({
	key: "word-match",
	tag: "WordMatch",
	void: true,
	label: "Word match (vocab pairs)",
	description: "Tap to pair each word with its meaning, or its picture (kids/concrete). Reads a vocab deck.",
	category: "interactive",
	schema: z.object({
		deck: deckSchema.default(DEMO_DECK),
		count: z.number().optional(),
		show: z.enum(["translation", "icon"]).default("translation"),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		let rawDeck = attributes.deck;
		if (typeof rawDeck === "string") try {
			rawDeck = JSON.parse(rawDeck);
		} catch {}
		const deck = rawDeck && typeof rawDeck === "object" && Array.isArray(rawDeck.items) && rawDeck.items.length ? rawDeck : DEMO_DECK;
		const widget = /* @__PURE__ */ jsx(WordMatchLab, {
			deck,
			count: attributes.count,
			show: attributes.show,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "languages",
				children: [/* @__PURE__ */ jsx(TextField, {
					value: deck.termLang,
					onChange: (v) => updateAttributes({ deck: {
						...deck,
						termLang: v
					} }),
					placeholder: "en-US"
				}), /* @__PURE__ */ jsx(TextField, {
					value: deck.transLang,
					onChange: (v) => updateAttributes({ deck: {
						...deck,
						transLang: v
					} }),
					placeholder: "bn-BD"
				})]
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "show",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: attributes.show === "icon",
					onClick: () => updateAttributes({ show: attributes.show === "icon" ? "translation" : "icon" }),
					children: "pictures"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "words",
				children: /* @__PURE__ */ jsx(RowsEditor, {
					rows: deck.items,
					onChange: (items) => updateAttributes({ deck: {
						...deck,
						items
					} }),
					columns: [
						{
							key: "term",
							label: "word",
							grow: true
						},
						{
							key: "translation",
							label: "meaning",
							grow: true
						},
						{
							key: "icon",
							label: "icon",
							type: "icon"
						},
						{
							key: "transliteration",
							label: "rom."
						}
					],
					newRow: () => ({
						term: "",
						translation: ""
					}),
					addLabel: "word"
				})
			})
		] }), widget] });
	}
});
const DEMO_ARTICLES = [
	{
		before: "I saw",
		noun: "cat",
		after: "on the wall.",
		answer: "a",
		why: "a → any one (new), before a consonant sound"
	},
	{
		before: "She is",
		noun: "engineer.",
		answer: "an",
		why: "an → before a vowel sound (engineer)"
	},
	{
		before: "Please open",
		noun: "door.",
		answer: "the",
		why: "the → the specific door we both mean"
	},
	{
		before: "I like",
		noun: "tea.",
		answer: ", ",
		why: "no article → tea in general (uncountable)"
	}
];
const DEMO_AGREE = [
	{
		subject: "She",
		options: ["go", "goes"],
		correct: "goes",
		tail: "to school.",
		note: "he / she / it → add -s: goes"
	},
	{
		subject: "They",
		options: ["is", "are"],
		correct: "are",
		tail: "happy.",
		note: "plural subject → are"
	},
	{
		subject: "He",
		options: [
			"is",
			"are",
			"am"
		],
		correct: "is",
		tail: "a doctor.",
		note: "English needs \"is\", Bangla drops the present copula"
	}
];
const ArticleLensBlock = defineBlock({
	key: "article-lens",
	tag: "ArticleLens",
	void: true,
	label: "Article lens (a / an / the)",
	description: "Pick the right article (a/an/the/none), built for the \"Bangla has no articles\" gap.",
	category: "interactive",
	schema: z.object({
		items: z.array(articleItemSchema).default(DEMO_ARTICLES),
		objectives: z.array(z.string()).optional(),
		hints: z.array(z.string()).optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const items = coerceArray(attributes.items, DEMO_ARTICLES);
		const widget = /* @__PURE__ */ jsx(ArticleLensLab, {
			items,
			objectives: attributes.objectives,
			hints: attributes.hints,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "items",
				children: /* @__PURE__ */ jsx(RowsEditor, {
					rows: items,
					onChange: (v) => updateAttributes({ items: v }),
					columns: [
						{
							key: "before",
							label: "before",
							grow: true
						},
						{
							key: "noun",
							label: "noun",
							grow: true
						},
						{
							key: "after",
							label: "after",
							grow: true
						},
						{
							key: "answer",
							label: "answer",
							type: "select",
							options: [
								"a",
								"an",
								"the",
								", "
							]
						},
						{
							key: "why",
							label: "why",
							grow: true
						}
					],
					newRow: () => ({
						before: "",
						noun: "",
						answer: "a"
					}),
					addLabel: "item"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "objectives",
				children: /* @__PURE__ */ jsx(TagsField, {
					value: attributes.objectives ?? [],
					onChange: (v) => updateAttributes({ objectives: v }),
					placeholder: "comma-separated goals"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "hints",
				children: /* @__PURE__ */ jsx(TagsField, {
					value: attributes.hints ?? [],
					onChange: (v) => updateAttributes({ hints: v }),
					placeholder: "comma-separated hints"
				})
			})
		] }), widget] });
	}
});
const AgreementBlock = defineBlock({
	key: "agreement",
	tag: "Agreement",
	void: true,
	label: "Agreement (subject ↔ verb)",
	description: "Pick the verb form that matches the subject, covers 3rd-sg -s and the dropped copula.",
	category: "interactive",
	schema: z.object({
		items: z.array(agreementItemSchema).default(DEMO_AGREE),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const items = coerceArray(attributes.items, DEMO_AGREE);
		const widget = /* @__PURE__ */ jsx(AgreementLab, {
			items,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(ConfigPanel, { children: /* @__PURE__ */ jsx(ConfigRow, {
			label: "items",
			children: /* @__PURE__ */ jsx(RowsEditor, {
				rows: items,
				onChange: (v) => updateAttributes({ items: v }),
				columns: [
					{
						key: "subject",
						label: "subject",
						grow: true
					},
					{
						key: "options",
						label: "options (comma)",
						type: "tags",
						grow: true
					},
					{
						key: "correct",
						label: "correct"
					},
					{
						key: "tail",
						label: "tail",
						grow: true
					},
					{
						key: "note",
						label: "note",
						grow: true
					}
				],
				newRow: () => ({
					subject: "",
					options: [],
					correct: ""
				}),
				addLabel: "item"
			})
		}) }), widget] });
	}
});
const DEMO_TRANSFORM_FROM = [
	{
		text: "You",
		pos: "pronoun",
		gloss: "তুমি"
	},
	{
		text: "like",
		pos: "verb",
		gloss: "পছন্দ করো"
	},
	{
		text: "tea",
		pos: "noun",
		gloss: "চা"
	}
];
const DEMO_TRANSFORM_TO = [
	{
		text: "Do",
		pos: "verb"
	},
	{
		text: "you",
		pos: "pronoun",
		gloss: "তুমি"
	},
	{
		text: "like",
		pos: "verb",
		gloss: "পছন্দ করো"
	},
	{
		text: "tea",
		pos: "noun",
		gloss: "চা"
	},
	{
		text: "?",
		pos: "other"
	}
];
const DEMO_PREP = [
	{
		before: "The bird is",
		noun: "the tree.",
		answer: "above",
		options: [
			"above",
			"in",
			"under"
		],
		scene: "above",
		figure: "🐦",
		landmark: "🌳",
		note: "\"above the tree\", the word comes BEFORE the noun (Bangla puts it after)."
	},
	{
		before: "The fish is",
		noun: "the water.",
		answer: "in",
		options: [
			"in",
			"on",
			"over"
		],
		scene: "in",
		figure: "🐟",
		landmark: "water",
		note: "\"in the water\", preposition first."
	},
	{
		before: "The cat is",
		noun: "the table.",
		answer: "under",
		options: [
			"on",
			"under",
			"beside"
		],
		scene: "under",
		figure: "🐱",
		landmark: "🪑",
		note: "\"under the table\", preposition first."
	}
];
const PREP_RELATIONS = [
	"in",
	"on",
	"over",
	"above",
	"under",
	"below",
	"beside",
	"between",
	"behind",
	"infront",
	"at"
];
const TransformBlock = defineBlock({
	key: "transform",
	tag: "Transform",
	void: true,
	label: "Transform (statement → question / tense)",
	description: "Rebuild a sentence into its transformed form; the changed words are highlighted (do-support, tense…).",
	category: "interactive",
	schema: z.object({
		from: z.array(transformTileSchema).default(DEMO_TRANSFORM_FROM),
		to: z.array(transformTileSchema).default(DEMO_TRANSFORM_TO),
		instruction: z.string().optional(),
		note: z.string().optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const from = coerceArray(attributes.from, DEMO_TRANSFORM_FROM);
		const to = coerceArray(attributes.to, DEMO_TRANSFORM_TO);
		const widget = /* @__PURE__ */ jsx(TransformLab, {
			from,
			to,
			instruction: attributes.instruction,
			note: attributes.note,
			title: attributes.title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "instruction",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.instruction ?? "",
					onChange: (v) => updateAttributes({ instruction: v }),
					placeholder: "e.g. Make it a question"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "note",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.note ?? "",
					onChange: (v) => updateAttributes({ note: v }),
					placeholder: "what changed + why"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "from (given)",
				children: /* @__PURE__ */ jsx(RowsEditor, {
					rows: from,
					onChange: (v) => updateAttributes({ from: v }),
					columns: [
						{
							key: "text",
							label: "word",
							grow: true
						},
						{
							key: "pos",
							label: "part",
							type: "pos"
						},
						{
							key: "gloss",
							label: "gloss",
							grow: true
						}
					],
					newRow: () => ({
						text: "",
						pos: "other"
					}),
					addLabel: "word"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "to (answer)",
				children: /* @__PURE__ */ jsx(RowsEditor, {
					rows: to,
					onChange: (v) => updateAttributes({ to: v }),
					columns: [
						{
							key: "text",
							label: "word",
							grow: true
						},
						{
							key: "pos",
							label: "part",
							type: "pos"
						},
						{
							key: "gloss",
							label: "gloss",
							grow: true
						}
					],
					newRow: () => ({
						text: "",
						pos: "other"
					}),
					addLabel: "word"
				})
			})
		] }), widget] });
	}
});
const PrepositionBlock = defineBlock({
	key: "preposition",
	tag: "Preposition",
	void: true,
	label: "Preposition scene (in / on / at)",
	description: "Pick the preposition that matches a spatial picture, teaches \"before the noun\" vs Bangla postpositions.",
	category: "interactive",
	schema: z.object({
		items: z.array(prepItemSchema).default(DEMO_PREP),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const items = coerceArray(attributes.items, DEMO_PREP);
		const widget = /* @__PURE__ */ jsx(PrepositionSceneLab, {
			items,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(ConfigPanel, { children: /* @__PURE__ */ jsx(ConfigRow, {
			label: "items",
			children: /* @__PURE__ */ jsx(RowsEditor, {
				rows: items,
				onChange: (v) => updateAttributes({ items: v }),
				columns: [
					{
						key: "before",
						label: "before",
						grow: true
					},
					{
						key: "noun",
						label: "noun",
						grow: true
					},
					{
						key: "answer",
						label: "answer"
					},
					{
						key: "options",
						label: "options (comma)",
						type: "tags",
						grow: true
					},
					{
						key: "figure",
						label: "figure",
						type: "icon"
					},
					{
						key: "landmark",
						label: "landmark",
						type: "icon"
					},
					{
						key: "scene",
						label: "relation",
						type: "select",
						options: PREP_RELATIONS
					},
					{
						key: "note",
						label: "note",
						grow: true
					}
				],
				newRow: () => ({
					before: "The bird is",
					noun: "the tree.",
					answer: "above",
					options: [
						"above",
						"in",
						"under"
					],
					scene: "above",
					figure: "🐦",
					landmark: "🌳"
				}),
				addLabel: "item"
			})
		}) }), widget] });
	}
});
/** This domain's block specs (slash-menu order) + tag→component render map. */
const languageBlocks = [
	SentenceBuilderBlock,
	WordMatchBlock,
	ArticleLensBlock,
	AgreementBlock,
	TransformBlock,
	PrepositionBlock
];
const languageComponents = {
	SentenceBuilder: SentenceBuilderLab,
	WordMatch: WordMatchLab,
	ArticleLens: ArticleLensLab,
	Agreement: AgreementLab,
	Transform: TransformLab,
	Preposition: PrepositionSceneLab
};

//#endregion
export { AgreementBlock, ArticleLensBlock, PrepositionBlock, SentenceBuilderBlock, TransformBlock, WordMatchBlock, languageBlocks, languageComponents };