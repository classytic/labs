import { Grapher } from "../math/grapher/preset.mjs";
import { DerivativeExplorer } from "../math/derivative-explorer/preset.mjs";
import { IntegralExplorer } from "../math/integral-explorer/preset.mjs";
import { LimitExplorer } from "../math/limit-explorer/preset.mjs";
import { LinearSystemLab } from "../math/linear-system/preset.mjs";
import { NumberLineLab } from "../math/number-line/preset.mjs";
import { AreaModelLab } from "../math/area-model/preset.mjs";
import { GrowingPatternLab } from "../math/pattern/preset.mjs";
import { MysteryBucketLab } from "../math/mystery-bucket/preset.mjs";
import { BalanceAlgebraLab } from "../math/balance-algebra/preset.mjs";
import { VertexParabolaLab } from "../math/parabola/preset.mjs";
import { FunctionMachineLab } from "../math/function-machine/preset.mjs";
import { TRIG_FNS, TrigExplorer } from "../math/trig-explorer.mjs";
import { Derivation } from "../math/derivation.mjs";
import { GradientDescent } from "../math/gradient-descent.mjs";
import { InteractiveProblem } from "../math/interactive/preset.mjs";
import { TriangleTrig } from "../math/triangle-trig/preset.mjs";
import { StraightLineLab } from "../math/straight-line/preset.mjs";
import { CircleLab } from "../math/circle/preset.mjs";
import { ConicLab } from "../math/conic/preset.mjs";
import { DomainRangeLab } from "../math/domain-range/preset.mjs";
import { listScenes } from "../kit/scenes.mjs";
import { LinearModelLab } from "../math/linear-model/preset.mjs";
import { RateMachineLab } from "../math/rate-machine/preset.mjs";
import { SequencePredict } from "../math/sequence-predict/preset.mjs";
import { PercentBarLab } from "../math/percent-bar/preset.mjs";
import { ComplexPlaneLab } from "../math/complex/preset.mjs";
import { TrigSignsLab } from "../math/trig/preset.mjs";
import { FractionBarLab } from "../math/fraction-bar/preset.mjs";
import { RatioShareLab } from "../math/ratio-share/preset.mjs";
import { TransformLab } from "../math/transform/preset.mjs";
import { ReceiptLab } from "../math/receipt/preset.mjs";
import { listClueScenes } from "../kit/clue-scene.mjs";
import { SystemSolveLab } from "../math/system-solve/preset.mjs";
import { PolynomialSolverLab } from "../math/poly/preset.mjs";
import { registerDataScene } from "../kit/data-scene.mjs";
import { SceneStudio } from "../kit/scene-studio.mjs";
import { ChipToggle, ConfigPanel, ConfigRow, NumField, SelectField, SmallButton, TextField } from "./authoring.mjs";
import { labBlock } from "./lab-block.mjs";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/math.tsx
const levelSceneOptions = () => ["none", ...listScenes("level").map((s) => s.name)];
const countSceneOptions = () => listScenes("count").map((s) => s.name);
const clueSceneOptions = () => listClueScenes().map((s) => s.name);
const resolveFns = (raw) => Array.isArray(raw) && raw.length ? raw : ["sin", "cos"];
const TrigExplorerBlock = defineBlock({
	key: "trig-explorer",
	void: true,
	label: "Trig explorer",
	description: "Unit circle ↔ wave, drag the angle; sin & cos trace out. (tan/cot: use Graph)",
	category: "interactive",
	schema: z.object({
		functions: z.array(z.enum(["sin", "cos"])).optional(),
		startDeg: z.number().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const fns = resolveFns(attributes.functions);
		const widget = /* @__PURE__ */ jsx(TrigExplorer, {
			functions: fns,
			startDeg: attributes.startDeg
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const toggle = (fn) => {
			const next = fns.includes(fn) ? fns.filter((f) => f !== fn) : [...fns, fn];
			updateAttributes({ functions: next.length ? next : fns });
		};
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(ConfigPanel, { children: /* @__PURE__ */ jsx(ConfigRow, {
			label: "Functions",
			children: TRIG_FNS.map((fn) => /* @__PURE__ */ jsx(ChipToggle, {
				active: fns.includes(fn),
				onClick: () => toggle(fn),
				children: fn
			}, fn))
		}) }), widget] });
	}
});
const equationSchema = z.union([z.string(), z.object({
	expr: z.string(),
	color: z.string().optional()
})]);
const paramSchema = z.object({
	name: z.string(),
	min: z.number(),
	max: z.number(),
	step: z.number().optional(),
	value: z.number()
});
const asExprStrings = (raw) => {
	if (typeof raw === "string") return [raw];
	if (Array.isArray(raw)) return raw.map((e) => typeof e === "string" ? e : String(e?.expr ?? ""));
	return ["sin(x)"];
};
const asParams = (raw) => Array.isArray(raw) ? raw : [];
const GraphBlock = defineBlock({
	key: "graph",
	void: true,
	label: "Graph (equation)",
	description: "Plot equations you type, y = a·sin(b·x), x^2, … with learner sliders.",
	category: "interactive",
	schema: z.object({
		equations: z.array(equationSchema).optional(),
		params: z.array(paramSchema).optional(),
		xRange: z.tuple([z.number(), z.number()]).optional(),
		yScale: z.enum(["linear", "log"]).optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const equations = asExprStrings(attributes.equations);
		const params = asParams(attributes.params);
		const xRange = attributes.xRange ?? [-6.5, 6.5];
		const yScale = attributes.yScale === "log" ? "log" : "linear";
		const title = attributes.title ?? "Graph";
		const widget = /* @__PURE__ */ jsx(Grapher, {
			equations,
			params,
			xRange,
			yScale,
			title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const setEq = (i, v) => {
			const next = [...equations];
			next[i] = v;
			updateAttributes({ equations: next });
		};
		const setParam = (i, patch) => {
			updateAttributes({ params: params.map((p, j) => j === i ? {
				...p,
				...patch
			} : p) });
		};
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: title,
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-1.5",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "font-medium text-muted-foreground",
						children: "Equations (use x and your slider names)"
					}),
					equations.map((eq, i) => /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "font-mono text-muted-foreground",
								children: "y ="
							}),
							/* @__PURE__ */ jsx(TextField, {
								value: eq,
								mono: true,
								placeholder: "a*sin(b*x) + c",
								onChange: (v) => setEq(i, v),
								className: "flex-1"
							}),
							equations.length > 1 && /* @__PURE__ */ jsx(SmallButton, {
								tone: "danger",
								onClick: () => updateAttributes({ equations: equations.filter((_, j) => j !== i) }),
								children: "✕"
							})
						]
					}, i)),
					/* @__PURE__ */ jsx(SmallButton, {
						onClick: () => updateAttributes({ equations: [...equations, ""] }),
						children: "+ equation"
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-1.5",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "font-medium text-muted-foreground",
						children: "Sliders (learner-draggable)"
					}),
					params.map((p, i) => /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-1.5",
						children: [
							/* @__PURE__ */ jsx(TextField, {
								value: p.name,
								mono: true,
								placeholder: "a",
								onChange: (v) => setParam(i, { name: v }),
								className: "w-14"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-muted-foreground",
								children: "from"
							}),
							/* @__PURE__ */ jsx(NumField, {
								value: p.min,
								onChange: (v) => setParam(i, { min: v })
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-muted-foreground",
								children: "to"
							}),
							/* @__PURE__ */ jsx(NumField, {
								value: p.max,
								onChange: (v) => setParam(i, { max: v })
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-muted-foreground",
								children: "="
							}),
							/* @__PURE__ */ jsx(NumField, {
								value: p.value,
								onChange: (v) => setParam(i, { value: v })
							}),
							/* @__PURE__ */ jsx(SmallButton, {
								tone: "danger",
								onClick: () => updateAttributes({ params: params.filter((_, j) => j !== i) }),
								children: "✕"
							})
						]
					}, i)),
					/* @__PURE__ */ jsx(SmallButton, {
						onClick: () => updateAttributes({ params: [...params, {
							name: nextParamName(params),
							min: 0,
							max: 3,
							value: 1,
							step: .1
						}] }),
						children: "+ slider"
					})
				]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "x window",
				children: [
					/* @__PURE__ */ jsx(NumField, {
						value: xRange[0],
						onChange: (v) => updateAttributes({ xRange: [v, xRange[1]] })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "to"
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: xRange[1],
						onChange: (v) => updateAttributes({ xRange: [xRange[0], v] })
					})
				]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "y scale",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: yScale !== "log",
					onClick: () => updateAttributes({ yScale: "linear" }),
					children: "linear"
				}), /* @__PURE__ */ jsx(ChipToggle, {
					active: yScale === "log",
					onClick: () => updateAttributes({ yScale: "log" }),
					children: "log"
				})]
			})
		] }), widget] });
	}
});
const DerivativeExplorerBlock = defineBlock({
	key: "derivative-explorer",
	void: true,
	label: "Derivative explorer",
	description: "Drag a point; the secant becomes the exact tangent. Shows f′(x).",
	category: "interactive",
	schema: z.object({
		equation: z.string().optional(),
		xRange: z.tuple([z.number(), z.number()]).optional(),
		startX: z.number().optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const equation = typeof attributes.equation === "string" && attributes.equation.trim() ? attributes.equation : "0.15*x^3 - x";
		const xRange = attributes.xRange ?? [-4, 4];
		const title = attributes.title ?? "The derivative is a slope";
		const widget = /* @__PURE__ */ jsx(DerivativeExplorer, {
			equation,
			xRange,
			startX: attributes.startX,
			title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: title,
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "f(x) =",
				children: /* @__PURE__ */ jsx(TextField, {
					value: equation,
					mono: true,
					placeholder: "0.15*x^3 - x",
					onChange: (v) => updateAttributes({ equation: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "x window",
				children: [
					/* @__PURE__ */ jsx(NumField, {
						value: xRange[0],
						onChange: (v) => updateAttributes({ xRange: [v, xRange[1]] })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "to"
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: xRange[1],
						onChange: (v) => updateAttributes({ xRange: [xRange[0], v] })
					})
				]
			})
		] }), widget] });
	}
});
const GradientDescentBlock = defineBlock({
	key: "gradient-descent",
	void: true,
	label: "Gradient descent",
	description: "Walk downhill on a loss surface f(x,y) using exact ∂f/∂x, ∂f/∂y, the calculus behind ML.",
	category: "interactive",
	schema: z.object({
		equation: z.string().optional(),
		range: z.tuple([z.number(), z.number()]).optional(),
		learningRate: z.number().optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const equation = typeof attributes.equation === "string" && attributes.equation.trim() ? attributes.equation : "x^2 + 2*y^2";
		const range = attributes.range ?? [-3, 3];
		const title = attributes.title ?? "Gradient descent";
		const widget = /* @__PURE__ */ jsx(GradientDescent, {
			equation,
			range,
			learningRate: attributes.learningRate,
			title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: title,
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "f(x,y) =",
				children: /* @__PURE__ */ jsx(TextField, {
					value: equation,
					mono: true,
					placeholder: "x^2 + 2*y^2",
					onChange: (v) => updateAttributes({ equation: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "region",
				children: [
					/* @__PURE__ */ jsx(NumField, {
						value: range[0],
						onChange: (v) => updateAttributes({ range: [v, range[1]] })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "to"
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: range[1],
						onChange: (v) => updateAttributes({ range: [range[0], v] })
					})
				]
			})
		] }), widget] });
	}
});
const IntegralExplorerBlock = defineBlock({
	key: "integral-explorer",
	void: true,
	label: "Integral explorer",
	description: "Area under a curve via Riemann rectangles, drag endpoints, add n, converge.",
	category: "interactive",
	schema: z.object({
		equation: z.string().optional(),
		xRange: z.tuple([z.number(), z.number()]).optional(),
		a: z.number().optional(),
		b: z.number().optional(),
		n: z.number().optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const equation = typeof attributes.equation === "string" && attributes.equation.trim() ? attributes.equation : "0.4*x^2 + 0.5";
		const xRange = attributes.xRange ?? [-1, 4];
		const title = attributes.title ?? "The integral is an area";
		const widget = /* @__PURE__ */ jsx(IntegralExplorer, {
			equation,
			xRange,
			a: attributes.a,
			b: attributes.b,
			n: attributes.n,
			title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: title,
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "f(x) =",
				children: /* @__PURE__ */ jsx(TextField, {
					value: equation,
					mono: true,
					placeholder: "0.4*x^2 + 0.5",
					onChange: (v) => updateAttributes({ equation: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "x window",
				children: [
					/* @__PURE__ */ jsx(NumField, {
						value: xRange[0],
						onChange: (v) => updateAttributes({ xRange: [v, xRange[1]] })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "to"
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: xRange[1],
						onChange: (v) => updateAttributes({ xRange: [xRange[0], v] })
					})
				]
			})
		] }), widget] });
	}
});
const LimitExplorerBlock = defineBlock({
	key: "limit-explorer",
	void: true,
	label: "Limit explorer",
	description: "Approach x → c from both sides; see the limit even where f(c) is a hole.",
	category: "interactive",
	schema: z.object({
		equation: z.string().optional(),
		xRange: z.tuple([z.number(), z.number()]).optional(),
		c: z.number().optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const equation = typeof attributes.equation === "string" && attributes.equation.trim() ? attributes.equation : "(x^2 - 1)/(x - 1)";
		const xRange = attributes.xRange ?? [-1, 3];
		const title = attributes.title ?? "Approaching a limit";
		const widget = /* @__PURE__ */ jsx(LimitExplorer, {
			equation,
			xRange,
			c: attributes.c,
			title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: title,
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "f(x) =",
				children: /* @__PURE__ */ jsx(TextField, {
					value: equation,
					mono: true,
					placeholder: "(x^2 - 1)/(x - 1)",
					onChange: (v) => updateAttributes({ equation: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "x window",
				children: [
					/* @__PURE__ */ jsx(NumField, {
						value: xRange[0],
						onChange: (v) => updateAttributes({ xRange: [v, xRange[1]] })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "to"
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: xRange[1],
						onChange: (v) => updateAttributes({ xRange: [xRange[0], v] })
					})
				]
			})
		] }), widget] });
	}
});
const derivationStepSchema = z.union([z.string(), z.object({
	tex: z.string(),
	note: z.string().optional()
})]);
const asSteps = (raw) => {
	if (!Array.isArray(raw)) return [{ tex: "a^2 + b^2 = c^2" }];
	const out = raw.map((s) => typeof s === "string" ? { tex: s } : s).filter((s) => !!s && typeof s.tex === "string");
	return out.length ? out : [{ tex: "a^2 + b^2 = c^2" }];
};
const DerivationBlock = defineBlock({
	key: "derivation",
	void: true,
	label: "Derivation (steps)",
	description: "A step-by-step equation derivation in LaTeX, revealed one line at a time.",
	category: "interactive",
	schema: z.object({
		steps: z.array(derivationStepSchema).optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const steps = asSteps(attributes.steps);
		const title = attributes.title ?? "Derivation";
		const widget = /* @__PURE__ */ jsx(Derivation, {
			steps,
			title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const setStep = (i, patch) => updateAttributes({ steps: steps.map((s, j) => j === i ? {
			...s,
			...patch
		} : s) });
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [/* @__PURE__ */ jsx(ConfigRow, {
			label: "Title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: title,
				onChange: (v) => updateAttributes({ title: v }),
				className: "flex-1"
			})
		}), /* @__PURE__ */ jsxs("div", {
			className: "space-y-1.5",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "font-medium text-muted-foreground",
					children: "Steps (LaTeX + optional note)"
				}),
				steps.map((s, i) => /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center gap-1.5",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "font-mono text-muted-foreground",
							children: i + 1
						}),
						/* @__PURE__ */ jsx(TextField, {
							value: s.tex,
							mono: true,
							placeholder: "\\\\frac{y-y_P}{x-x_P} = ...",
							onChange: (v) => setStep(i, { tex: v }),
							className: "min-w-[12rem] flex-1"
						}),
						/* @__PURE__ */ jsx(TextField, {
							value: s.note ?? "",
							placeholder: "why…",
							onChange: (v) => setStep(i, { note: v }),
							className: "w-32"
						}),
						steps.length > 1 && /* @__PURE__ */ jsx(SmallButton, {
							tone: "danger",
							onClick: () => updateAttributes({ steps: steps.filter((_, j) => j !== i) }),
							children: "✕"
						})
					]
				}, i)),
				/* @__PURE__ */ jsx(SmallButton, {
					onClick: () => updateAttributes({ steps: [...steps, { tex: "" }] }),
					children: "+ step"
				})
			]
		})] }), widget] });
	}
});
function nextParamName(params) {
	const used = new Set(params.map((p) => p.name));
	for (const n of [
		"a",
		"b",
		"c",
		"d",
		"k",
		"m",
		"n",
		"p",
		"q"
	]) if (!used.has(n)) return n;
	return `p${params.length + 1}`;
}
/** System-of-equations render: two clue lines (slope-intercept) from scalar
*  props, so the editor form + MDX stay simple number fields. */
function LinearSystemView({ m1 = 1, b1 = 1, m2 = -1, b2 = 5 }) {
	return /* @__PURE__ */ jsx(LinearSystemLab, { lines: [{
		m: m1,
		b: b1,
		label: "clue A"
	}, {
		m: m2,
		b: b2,
		label: "clue B"
	}] });
}
const LinearSystemBlock = defineBlock({
	key: "linear-system",
	tag: "LinearSystem",
	void: true,
	label: "System of equations (x & y)",
	description: "Two clue lines on a grid, drag to the crossing point that obeys both. The advanced \"find x and y\" lab.",
	category: "interactive",
	schema: z.object({
		m1: z.number().default(1),
		b1: z.number().default(1),
		m2: z.number().default(-1),
		b2: z.number().default(5)
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const { m1 = 1, b1 = 1, m2 = -1, b2 = 5 } = attributes;
		const widget = /* @__PURE__ */ jsx(LinearSystemView, {
			m1,
			b1,
			m2,
			b2
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [/* @__PURE__ */ jsxs(ConfigRow, {
			label: "clue A: y =",
			children: [
				/* @__PURE__ */ jsx(NumField, {
					value: m1,
					onChange: (v) => updateAttributes({ m1: v })
				}),
				/* @__PURE__ */ jsx("span", {
					className: "text-muted-foreground",
					children: "x +"
				}),
				/* @__PURE__ */ jsx(NumField, {
					value: b1,
					onChange: (v) => updateAttributes({ b1: v })
				})
			]
		}), /* @__PURE__ */ jsxs(ConfigRow, {
			label: "clue B: y =",
			children: [
				/* @__PURE__ */ jsx(NumField, {
					value: m2,
					onChange: (v) => updateAttributes({ m2: v })
				}),
				/* @__PURE__ */ jsx("span", {
					className: "text-muted-foreground",
					children: "x +"
				}),
				/* @__PURE__ */ jsx(NumField, {
					value: b2,
					onChange: (v) => updateAttributes({ b2: v })
				})
			]
		})] }), widget] });
	}
});
const NumberLineBlock = defineBlock({
	key: "number-line",
	tag: "NumberLine",
	void: true,
	label: "Number line",
	description: "A draggable marker on a number line (incl. below zero), optionally pose a target to land on.",
	category: "interactive",
	schema: z.object({
		min: z.number().default(-8),
		max: z.number().default(8),
		start: z.number().default(0),
		target: z.number().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const { min = -8, max = 8, start = 0, target } = attributes;
		const widget = /* @__PURE__ */ jsx(NumberLineLab, {
			min,
			max,
			start,
			target
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "from",
				children: /* @__PURE__ */ jsx(NumField, {
					value: min,
					onChange: (v) => updateAttributes({ min: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "to",
				children: /* @__PURE__ */ jsx(NumField, {
					value: max,
					onChange: (v) => updateAttributes({ max: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "start",
				children: /* @__PURE__ */ jsx(NumField, {
					value: start,
					onChange: (v) => updateAttributes({ start: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "target",
				children: /* @__PURE__ */ jsx(NumField, {
					value: target ?? 0,
					onChange: (v) => updateAttributes({ target: v })
				})
			})
		] }), widget] });
	}
});
const MysteryBucketBlock = defineBlock({
	key: "mystery-bucket",
	tag: "MysteryBucket",
	void: true,
	label: "Mystery bucket (weigh the unknown)",
	description: "Essentials opener, add unit weights until a balance is level to discover the hidden weight. No symbols.",
	category: "interactive",
	schema: z.object({
		bucketWeight: z.number().default(5),
		bucketCount: z.number().default(1),
		maxWeights: z.number().default(12),
		start: z.number().default(0)
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const { bucketWeight = 5, bucketCount = 1, maxWeights = 12, start = 0 } = attributes;
		const widget = /* @__PURE__ */ jsx(MysteryBucketLab, {
			bucketWeight,
			bucketCount,
			maxWeights,
			start
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "weight each",
				children: /* @__PURE__ */ jsx(NumField, {
					value: bucketWeight,
					onChange: (v) => updateAttributes({ bucketWeight: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "buckets",
				children: /* @__PURE__ */ jsx(NumField, {
					value: bucketCount,
					onChange: (v) => updateAttributes({ bucketCount: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "max weights",
				children: /* @__PURE__ */ jsx(NumField, {
					value: maxWeights,
					onChange: (v) => updateAttributes({ maxWeights: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "start at",
				children: /* @__PURE__ */ jsx(NumField, {
					value: start,
					onChange: (v) => updateAttributes({ start: v })
				})
			})
		] }), widget] });
	}
});
const BalanceAlgebraBlock = defineBlock({
	key: "balance-algebra",
	tag: "BalanceAlgebra",
	void: true,
	label: "Balance scale (algebra)",
	description: "Drag x to balance a·x + b = c, learners solve a linear equation by balancing the scale.",
	category: "interactive",
	schema: z.object({
		coef: z.number().default(2),
		addend: z.number().default(1),
		rhs: z.number().default(7),
		answer: z.number().default(3),
		controlId: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const { coef = 2, addend = 1, rhs = 7, answer = 3 } = attributes;
		const widget = /* @__PURE__ */ jsx(BalanceAlgebraLab, {
			coef,
			addend,
			rhs,
			answer,
			controlId: attributes.controlId
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "coefficient a",
				children: /* @__PURE__ */ jsx(NumField, {
					value: coef,
					onChange: (v) => updateAttributes({ coef: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "addend b",
				children: /* @__PURE__ */ jsx(NumField, {
					value: addend,
					onChange: (v) => updateAttributes({ addend: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "right side c",
				children: /* @__PURE__ */ jsx(NumField, {
					value: rhs,
					onChange: (v) => updateAttributes({ rhs: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "answer x",
				children: /* @__PURE__ */ jsx(NumField, {
					value: answer,
					onChange: (v) => updateAttributes({ answer: v })
				})
			})
		] }), widget] });
	}
});
const VertexParabolaBlock = defineBlock({
	key: "vertex-parabola",
	tag: "VertexParabola",
	void: true,
	label: "Parabola (drag the vertex)",
	description: "Drag the vertex of y = a(x−h)² + k; the curve + equation update live.",
	category: "interactive",
	schema: z.object({ a: z.number().default(1) }),
	Component: ({ attributes, mode, updateAttributes }) => {
		const { a = 1 } = attributes;
		const widget = /* @__PURE__ */ jsx(VertexParabolaLab, { a });
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(ConfigPanel, { children: /* @__PURE__ */ jsx(ConfigRow, {
			label: "stretch a",
			children: /* @__PURE__ */ jsx(NumField, {
				value: a,
				onChange: (v) => updateAttributes({ a: v })
			})
		}) }), widget] });
	}
});
const AreaModelBlock = defineBlock({
	key: "area-model",
	tag: "AreaModel",
	void: true,
	label: "Area model (algebra tiles)",
	description: "(x+a)(x+b) as a partitioned rectangle, EXPAND (drag x) or FACTOR (find a, b).",
	category: "interactive",
	schema: z.object({
		a: z.number().default(3),
		b: z.number().default(2),
		mode: z.enum(["expand", "factor"]).default("expand"),
		controlId: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const { a = 3, b = 2, mode: m = "expand" } = attributes;
		const widget = /* @__PURE__ */ jsx(AreaModelLab, {
			a,
			b,
			mode: m,
			controlId: attributes.controlId
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "a in (x+a)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: a,
					onChange: (v) => updateAttributes({ a: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "b in (x+b)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: b,
					onChange: (v) => updateAttributes({ b: v })
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "mode",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: m !== "factor",
					onClick: () => updateAttributes({ mode: "expand" }),
					children: "expand"
				}), /* @__PURE__ */ jsx(ChipToggle, {
					active: m === "factor",
					onClick: () => updateAttributes({ mode: "factor" }),
					children: "factor"
				})]
			})
		] }), widget] });
	}
});
const GrowingPatternBlock = defineBlock({
	key: "growing-pattern",
	tag: "GrowingPattern",
	void: true,
	label: "Pattern → formula",
	description: "A figure grows by a·n + b; learners find the rule (hidden predict row forces extrapolation).",
	category: "interactive",
	schema: z.object({
		a: z.number().default(2),
		b: z.number().default(3),
		steps: z.number().default(4),
		controlId: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const { a = 2, b = 3, steps = 4 } = attributes;
		const widget = /* @__PURE__ */ jsx(GrowingPatternLab, {
			a,
			b,
			steps,
			controlId: attributes.controlId
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "per step a",
				children: /* @__PURE__ */ jsx(NumField, {
					value: a,
					onChange: (v) => updateAttributes({ a: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "constant b",
				children: /* @__PURE__ */ jsx(NumField, {
					value: b,
					onChange: (v) => updateAttributes({ b: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "figures shown",
				children: /* @__PURE__ */ jsx(NumField, {
					value: steps,
					onChange: (v) => updateAttributes({ steps: v })
				})
			})
		] }), widget] });
	}
});
const answerSchema = z.union([z.object({
	kind: z.literal("number"),
	value: z.number(),
	tol: z.number().optional()
}), z.object({
	kind: z.literal("expression"),
	value: z.string()
})]);
const askSchema = z.object({
	prompt: z.string(),
	answer: answerSchema,
	placeholder: z.string().optional()
});
const deriveSchema = z.object({
	kind: z.enum([
		"intersections",
		"roots",
		"tangent",
		"normal",
		"area"
	]),
	of: z.union([z.number(), z.tuple([z.number(), z.number()])]).optional(),
	at: z.union([z.number(), z.string()]).optional(),
	between: z.tuple([z.number(), z.number()]).optional(),
	from: z.union([z.number(), z.string()]).optional(),
	to: z.union([z.number(), z.string()]).optional(),
	label: z.string().optional()
});
const DERIVE_KINDS = [
	"intersections",
	"roots",
	"tangent",
	"normal",
	"area"
];
/** Shared "ask + check" authoring row, used by the engine and representation blocks. */
function AskEditor({ ask, onChange }) {
	if (!ask) return /* @__PURE__ */ jsx(SmallButton, {
		onClick: () => onChange({
			prompt: "",
			answer: {
				kind: "number",
				value: 0
			}
		}),
		children: "+ question (checked answer)"
	});
	const isNum = ask.answer.kind === "number";
	const setAns = (patch) => onChange({
		...ask,
		answer: {
			...ask.answer,
			...patch
		}
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-1.5",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "font-medium text-muted-foreground",
				children: "Question (graded)"
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Prompt",
				children: /* @__PURE__ */ jsx(TextField, {
					value: ask.prompt,
					onChange: (v) => onChange({
						...ask,
						prompt: v
					}),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Answer is",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: isNum,
					onClick: () => setAns({
						kind: "number",
						value: typeof ask.answer.value === "number" ? ask.answer.value : 0
					}),
					children: "a number"
				}), /* @__PURE__ */ jsx(ChipToggle, {
					active: !isNum,
					onClick: () => setAns({
						kind: "expression",
						value: String(ask.answer.value ?? "")
					}),
					children: "an expression"
				})]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Correct value",
				children: [
					isNum ? /* @__PURE__ */ jsx(NumField, {
						value: Number(ask.answer.value) || 0,
						onChange: (v) => setAns({ value: v })
					}) : /* @__PURE__ */ jsx(TextField, {
						value: String(ask.answer.value ?? ""),
						mono: true,
						placeholder: "6*x - 9",
						onChange: (v) => setAns({ value: v }),
						className: "flex-1"
					}),
					isNum && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "± tol"
					}), /* @__PURE__ */ jsx(NumField, {
						value: ask.answer.tol ?? .01,
						onChange: (v) => setAns({ tol: v })
					})] }),
					/* @__PURE__ */ jsx(SmallButton, {
						tone: "danger",
						onClick: () => onChange(void 0),
						children: "remove"
					})
				]
			})
		]
	});
}
const labChoiceSchema = z.object({
	value: z.string(),
	label: z.string()
});
const labAskSchema = z.object({
	prompt: z.string(),
	placeholder: z.string().optional(),
	answer: answerSchema.optional(),
	choices: z.array(labChoiceSchema).optional(),
	correct: z.string().optional(),
	explain: z.string().optional()
});
const CHOICE_LETTERS = [
	"a",
	"b",
	"c",
	"d",
	"e",
	"f"
];
/** Author a graded question as a typed answer (number/expression) OR multiple choice. */
function LabAskEditor({ ask, onChange }) {
	if (!ask) return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-wrap gap-1.5",
		children: [/* @__PURE__ */ jsx(SmallButton, {
			onClick: () => onChange({
				prompt: "",
				answer: {
					kind: "number",
					value: 0
				}
			}),
			children: "+ typed question"
		}), /* @__PURE__ */ jsx(SmallButton, {
			onClick: () => onChange({
				prompt: "",
				choices: [{
					value: "a",
					label: ""
				}, {
					value: "b",
					label: ""
				}],
				correct: "a"
			}),
			children: "+ multiple choice"
		})]
	});
	const isMcq = Array.isArray(ask.choices);
	const isNum = ask.answer?.kind !== "expression";
	const setAns = (patch) => onChange({
		...ask,
		answer: {
			...ask.answer ?? {
				kind: "number",
				value: 0
			},
			...patch
		}
	});
	const choices = ask.choices ?? [];
	const setChoice = (i, patch) => onChange({
		...ask,
		choices: choices.map((c, j) => j === i ? {
			...c,
			...patch
		} : c)
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-1.5",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("span", {
					className: "font-medium text-muted-foreground",
					children: "Question (graded)"
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex gap-1.5",
					children: [
						/* @__PURE__ */ jsx(ChipToggle, {
							active: !isMcq,
							onClick: () => onChange({
								prompt: ask.prompt,
								placeholder: ask.placeholder,
								answer: ask.answer ?? {
									kind: "number",
									value: 0
								}
							}),
							children: "typed"
						}),
						/* @__PURE__ */ jsx(ChipToggle, {
							active: isMcq,
							onClick: () => onChange({
								prompt: ask.prompt,
								choices: choices.length ? choices : [{
									value: "a",
									label: ""
								}, {
									value: "b",
									label: ""
								}],
								correct: ask.correct ?? "a"
							}),
							children: "multiple choice"
						}),
						/* @__PURE__ */ jsx(SmallButton, {
							tone: "danger",
							onClick: () => onChange(void 0),
							children: "remove"
						})
					]
				})]
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Prompt",
				children: /* @__PURE__ */ jsx(TextField, {
					value: ask.prompt,
					onChange: (v) => onChange({
						...ask,
						prompt: v
					}),
					className: "flex-1"
				})
			}),
			isMcq ? /* @__PURE__ */ jsxs("div", {
				className: "space-y-1.5",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "Options (tap ✓ to mark the correct one)"
					}),
					choices.map((c, i) => /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-1.5",
						children: [
							/* @__PURE__ */ jsx(ChipToggle, {
								active: ask.correct === c.value,
								onClick: () => onChange({
									...ask,
									correct: c.value
								}),
								children: "✓"
							}),
							/* @__PURE__ */ jsx(TextField, {
								value: c.label,
								placeholder: `option ${c.value}`,
								onChange: (v) => setChoice(i, { label: v }),
								className: "flex-1"
							}),
							choices.length > 2 && /* @__PURE__ */ jsx(SmallButton, {
								tone: "danger",
								onClick: () => onChange({
									...ask,
									choices: choices.filter((_, j) => j !== i)
								}),
								children: "✕"
							})
						]
					}, i)),
					/* @__PURE__ */ jsx("div", {
						className: "flex flex-wrap gap-1.5",
						children: /* @__PURE__ */ jsx(SmallButton, {
							onClick: () => {
								const v = CHOICE_LETTERS[choices.length] ?? String(choices.length);
								onChange({
									...ask,
									choices: [...choices, {
										value: v,
										label: ""
									}]
								});
							},
							children: "+ option"
						})
					}),
					/* @__PURE__ */ jsx(ConfigRow, {
						label: "Explain",
						children: /* @__PURE__ */ jsx(TextField, {
							value: ask.explain ?? "",
							placeholder: "shown when correct",
							onChange: (v) => onChange({
								...ask,
								explain: v
							}),
							className: "flex-1"
						})
					})
				]
			}) : /* @__PURE__ */ jsxs(Fragment, { children: [
				/* @__PURE__ */ jsxs(ConfigRow, {
					label: "Answer is",
					children: [/* @__PURE__ */ jsx(ChipToggle, {
						active: isNum,
						onClick: () => setAns({
							kind: "number",
							value: typeof ask.answer?.value === "number" ? ask.answer.value : 0
						}),
						children: "a number"
					}), /* @__PURE__ */ jsx(ChipToggle, {
						active: !isNum,
						onClick: () => setAns({
							kind: "expression",
							value: String(ask.answer?.value ?? "")
						}),
						children: "an expression"
					})]
				}),
				/* @__PURE__ */ jsxs(ConfigRow, {
					label: "Correct value",
					children: [isNum ? /* @__PURE__ */ jsx(NumField, {
						value: Number(ask.answer?.value) || 0,
						onChange: (v) => setAns({ value: v })
					}) : /* @__PURE__ */ jsx(TextField, {
						value: String(ask.answer?.value ?? ""),
						mono: true,
						placeholder: "-0.5*x + 5",
						onChange: (v) => setAns({ value: v }),
						className: "flex-1"
					}), isNum && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "± tol"
					}), /* @__PURE__ */ jsx(NumField, {
						value: ask.answer?.tol ?? .01,
						onChange: (v) => setAns({ tol: v })
					})] })]
				}),
				/* @__PURE__ */ jsx(ConfigRow, {
					label: "Hint",
					children: /* @__PURE__ */ jsx(TextField, {
						value: ask.placeholder ?? "",
						placeholder: "placeholder e.g. y = ...",
						onChange: (v) => onChange({
							...ask,
							placeholder: v
						}),
						className: "flex-1"
					})
				})
			] })
		]
	});
}
const InteractiveProblemBlock = defineBlock({
	key: "interactive-problem",
	void: true,
	label: "Interactive problem (engine)",
	description: "Author equations + sliders, derive roots/intersections/tangent/normal/area, and grade a typed answer, no code.",
	category: "interactive",
	schema: z.object({
		equations: z.array(equationSchema).optional(),
		params: z.array(paramSchema).optional(),
		xRange: z.tuple([z.number(), z.number()]).optional(),
		yRange: z.union([z.tuple([z.number(), z.number()]), z.literal("auto")]).optional(),
		derive: z.array(deriveSchema).optional(),
		ask: askSchema.optional(),
		title: z.string().optional(),
		prompt: z.string().optional(),
		activity: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const equations = asExprStrings(attributes.equations);
		const params = asParams(attributes.params);
		const xRange = attributes.xRange ?? [-6.5, 6.5];
		const yRange = attributes.yRange ?? "auto";
		const derive = Array.isArray(attributes.derive) ? attributes.derive : [];
		const ask = attributes.ask;
		const widget = /* @__PURE__ */ jsx(InteractiveProblem, {
			equations,
			params,
			xRange,
			yRange,
			derive,
			ask,
			title: attributes.title ?? "Interactive problem",
			prompt: attributes.prompt,
			activity: attributes.activity ?? "interactive-problem"
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const upd = updateAttributes;
		const setEq = (i, v) => updateAttributes({ equations: equations.map((e, j) => j === i ? v : e) });
		const setParam = (i, patch) => updateAttributes({ params: params.map((p, j) => j === i ? {
			...p,
			...patch
		} : p) });
		const setDerive = (i, patch) => upd({ derive: derive.map((d, j) => j === i ? {
			...d,
			...patch
		} : d) });
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					placeholder: "Interactive problem",
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Prompt",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.prompt ?? "",
					placeholder: "what the learner does",
					onChange: (v) => updateAttributes({ prompt: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-1.5",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "font-medium text-muted-foreground",
						children: "Equations (use x and your slider names)"
					}),
					equations.map((eq, i) => /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "font-mono text-muted-foreground",
								children: [i, ": y ="]
							}),
							/* @__PURE__ */ jsx(TextField, {
								value: eq,
								mono: true,
								placeholder: "abs(p*x - q)",
								onChange: (v) => setEq(i, v),
								className: "flex-1"
							}),
							equations.length > 1 && /* @__PURE__ */ jsx(SmallButton, {
								tone: "danger",
								onClick: () => updateAttributes({ equations: equations.filter((_, j) => j !== i) }),
								children: "✕"
							})
						]
					}, i)),
					/* @__PURE__ */ jsx(SmallButton, {
						onClick: () => updateAttributes({ equations: [...equations, ""] }),
						children: "+ equation"
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-1.5",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "font-medium text-muted-foreground",
						children: "Sliders (learner-draggable)"
					}),
					params.map((p, i) => /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-1.5",
						children: [
							/* @__PURE__ */ jsx(TextField, {
								value: p.name,
								mono: true,
								placeholder: "k",
								onChange: (v) => setParam(i, { name: v }),
								className: "w-14"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-muted-foreground",
								children: "from"
							}),
							/* @__PURE__ */ jsx(NumField, {
								value: p.min,
								onChange: (v) => setParam(i, { min: v })
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-muted-foreground",
								children: "to"
							}),
							/* @__PURE__ */ jsx(NumField, {
								value: p.max,
								onChange: (v) => setParam(i, { max: v })
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-muted-foreground",
								children: "="
							}),
							/* @__PURE__ */ jsx(NumField, {
								value: p.value,
								onChange: (v) => setParam(i, { value: v })
							}),
							/* @__PURE__ */ jsx(SmallButton, {
								tone: "danger",
								onClick: () => updateAttributes({ params: params.filter((_, j) => j !== i) }),
								children: "✕"
							})
						]
					}, i)),
					/* @__PURE__ */ jsx(SmallButton, {
						onClick: () => updateAttributes({ params: [...params, {
							name: nextParamName(params),
							min: 0,
							max: 10,
							value: 1,
							step: 1
						}] }),
						children: "+ slider"
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-1.5",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "font-medium text-muted-foreground",
						children: "Derive (computed + drawn live)"
					}),
					derive.map((d, i) => {
						const kind = String(d.kind ?? "intersections");
						const ofA = Array.isArray(d.of) ? Number(d.of[0]) : Number(d.of ?? 0);
						const ofB = Array.isArray(d.of) ? Number(d.of[1] ?? 1) : 1;
						return /* @__PURE__ */ jsxs("div", {
							className: "flex flex-wrap items-center gap-1.5",
							children: [
								/* @__PURE__ */ jsx(SelectField, {
									value: kind,
									options: DERIVE_KINDS,
									onChange: (v) => setDerive(i, { kind: v })
								}),
								kind === "intersections" && /* @__PURE__ */ jsxs(Fragment, { children: [
									/* @__PURE__ */ jsx("span", {
										className: "text-muted-foreground",
										children: "of eq"
									}),
									/* @__PURE__ */ jsx(NumField, {
										value: ofA,
										onChange: (v) => setDerive(i, { of: [v, ofB] })
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-muted-foreground",
										children: "&"
									}),
									/* @__PURE__ */ jsx(NumField, {
										value: ofB,
										onChange: (v) => setDerive(i, { of: [ofA, v] })
									})
								] }),
								kind === "roots" && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
									className: "text-muted-foreground",
									children: "of eq"
								}), /* @__PURE__ */ jsx(NumField, {
									value: Number(d.of ?? 0),
									onChange: (v) => setDerive(i, { of: v })
								})] }),
								(kind === "tangent" || kind === "normal") && /* @__PURE__ */ jsxs(Fragment, { children: [
									/* @__PURE__ */ jsx("span", {
										className: "text-muted-foreground",
										children: "of eq"
									}),
									/* @__PURE__ */ jsx(NumField, {
										value: Number(d.of ?? 0),
										onChange: (v) => setDerive(i, { of: v })
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-muted-foreground",
										children: "at x"
									}),
									/* @__PURE__ */ jsx(TextField, {
										value: String(d.at ?? ""),
										mono: true,
										placeholder: "2 or a param",
										onChange: (v) => setDerive(i, { at: /^-?\d*\.?\d+$/.test(v) ? Number(v) : v }),
										className: "w-20"
									})
								] }),
								kind === "area" && /* @__PURE__ */ jsxs(Fragment, { children: [
									/* @__PURE__ */ jsx("span", {
										className: "text-muted-foreground",
										children: "eqs"
									}),
									/* @__PURE__ */ jsx(NumField, {
										value: Array.isArray(d.between) ? Number(d.between[0]) : 0,
										onChange: (v) => setDerive(i, { between: [v, Array.isArray(d.between) ? Number(d.between[1] ?? 1) : 1] })
									}),
									/* @__PURE__ */ jsx(NumField, {
										value: Array.isArray(d.between) ? Number(d.between[1] ?? 1) : 1,
										onChange: (v) => setDerive(i, { between: [Array.isArray(d.between) ? Number(d.between[0]) : 0, v] })
									})
								] }),
								/* @__PURE__ */ jsx(SmallButton, {
									tone: "danger",
									onClick: () => upd({ derive: derive.filter((_, j) => j !== i) }),
									children: "✕"
								})
							]
						}, i);
					}),
					/* @__PURE__ */ jsx(SmallButton, {
						onClick: () => upd({ derive: [...derive, {
							kind: "intersections",
							of: [0, 1]
						}] }),
						children: "+ derive"
					})
				]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "x window",
				children: [
					/* @__PURE__ */ jsx(NumField, {
						value: xRange[0],
						onChange: (v) => updateAttributes({ xRange: [v, xRange[1]] })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "to"
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: xRange[1],
						onChange: (v) => updateAttributes({ xRange: [xRange[0], v] })
					})
				]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "y window",
				children: [
					/* @__PURE__ */ jsx(ChipToggle, {
						active: yRange === "auto",
						onClick: () => updateAttributes({ yRange: "auto" }),
						children: "auto"
					}),
					/* @__PURE__ */ jsx(ChipToggle, {
						active: yRange !== "auto",
						onClick: () => updateAttributes({ yRange: yRange === "auto" ? [-10, 10] : yRange }),
						children: "fixed"
					}),
					yRange !== "auto" && /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsx(NumField, {
							value: yRange[0],
							onChange: (v) => updateAttributes({ yRange: [v, yRange[1]] })
						}),
						/* @__PURE__ */ jsx("span", {
							className: "text-muted-foreground",
							children: "to"
						}),
						/* @__PURE__ */ jsx(NumField, {
							value: yRange[1],
							onChange: (v) => updateAttributes({ yRange: [yRange[0], v] })
						})
					] })
				]
			}),
			/* @__PURE__ */ jsx(AskEditor, {
				ask,
				onChange: (a) => upd({ ask: a })
			})
		] }), widget] });
	}
});
const TriangleTrigBlock = defineBlock({
	key: "triangle-trig",
	void: true,
	label: "Triangle trig (elevation/depression)",
	description: "A right triangle for elevation/depression: give an angle + one side, solve the rest, grade a typed answer.",
	category: "interactive",
	schema: z.object({
		angleDeg: z.number().optional(),
		leg: z.number().optional(),
		legKind: z.enum(["opposite", "adjacent"]).optional(),
		mode: z.enum([
			"elevation",
			"depression",
			"plain"
		]).optional(),
		labels: z.object({
			opposite: z.string().optional(),
			adjacent: z.string().optional(),
			hypotenuse: z.string().optional(),
			angle: z.string().optional()
		}).optional(),
		drive: z.array(z.enum(["angle", "leg"])).optional(),
		ask: askSchema.optional(),
		title: z.string().optional(),
		prompt: z.string().optional(),
		activity: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const a = attributes;
		const drive = Array.isArray(a.drive) ? a.drive : ["angle"];
		const labels = a.labels ?? {};
		const ask = attributes.ask;
		const widget = /* @__PURE__ */ jsx(TriangleTrig, {
			...a,
			drive,
			ask
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const upd = updateAttributes;
		const toggleDrive = (k) => updateAttributes({ drive: drive.includes(k) ? drive.filter((d) => d !== k) : [...drive, k] });
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.title ?? "",
					placeholder: "Angle of depression…",
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Angle θ (°)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: a.angleDeg ?? 31,
					onChange: (v) => updateAttributes({ angleDeg: v })
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Given leg",
				children: [/* @__PURE__ */ jsx(NumField, {
					value: a.leg ?? 15,
					onChange: (v) => updateAttributes({ leg: v })
				}), /* @__PURE__ */ jsx(SelectField, {
					value: a.legKind ?? "opposite",
					options: ["opposite", "adjacent"],
					onChange: (v) => upd({ legKind: v })
				})]
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Framing",
				children: /* @__PURE__ */ jsx(SelectField, {
					value: a.mode ?? "depression",
					options: [
						"depression",
						"elevation",
						"plain"
					],
					onChange: (v) => upd({ mode: v })
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Labels",
				children: [/* @__PURE__ */ jsx(TextField, {
					value: labels.opposite ?? "",
					placeholder: "opposite",
					onChange: (v) => updateAttributes({ labels: {
						...labels,
						opposite: v
					} }),
					className: "w-24"
				}), /* @__PURE__ */ jsx(TextField, {
					value: labels.adjacent ?? "",
					placeholder: "adjacent",
					onChange: (v) => updateAttributes({ labels: {
						...labels,
						adjacent: v
					} }),
					className: "w-24"
				})]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Draggable",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: drive.includes("angle"),
					onClick: () => toggleDrive("angle"),
					children: "angle"
				}), /* @__PURE__ */ jsx(ChipToggle, {
					active: drive.includes("leg"),
					onClick: () => toggleDrive("leg"),
					children: "given leg"
				})]
			}),
			/* @__PURE__ */ jsx(AskEditor, {
				ask,
				onChange: (a2) => upd({ ask: a2 })
			})
		] }), widget] });
	}
});
const pointSchema = z.object({
	x: z.number(),
	y: z.number()
});
const StraightLineBlock = defineBlock({
	key: "straight-line",
	tag: "StraightLine",
	void: true,
	label: "Straight line (y = mx + c, parallel/⊥, intercepts)",
	description: "Drag points/intercepts to build a line; covers gradient–intercept, two-point, intercept form, and parallel/perpendicular. Optional graded answer.",
	category: "interactive",
	schema: z.object({
		mode: z.enum([
			"two-point",
			"gradient-intercept",
			"intercept-form",
			"parallel",
			"perpendicular"
		]).optional(),
		pointA: pointSchema.optional(),
		pointB: pointSchema.optional(),
		given: z.object({
			m: z.number(),
			c: z.number()
		}).optional(),
		through: pointSchema.optional(),
		showDistance: z.boolean().optional(),
		snap: z.number().optional(),
		title: z.string().optional(),
		prompt: z.string().optional(),
		ask: labAskSchema.optional(),
		activity: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const a = attributes;
		const ask = attributes.ask;
		const m = a.mode ?? "two-point";
		const given = a.given ?? {
			m: .5,
			c: 2
		};
		const widget = /* @__PURE__ */ jsx(StraightLineLab, { ...a });
		if (mode !== "editing" || !updateAttributes) return widget;
		const upd = updateAttributes;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.title ?? "",
					placeholder: "The straight line",
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Form",
				children: /* @__PURE__ */ jsx(SelectField, {
					value: m,
					options: [
						"two-point",
						"gradient-intercept",
						"intercept-form",
						"parallel",
						"perpendicular"
					],
					onChange: (v) => upd({ mode: v })
				})
			}),
			(m === "parallel" || m === "perpendicular") && /* @__PURE__ */ jsxs(ConfigRow, {
				label: "Given line  y =",
				children: [
					/* @__PURE__ */ jsx(NumField, {
						value: given.m,
						onChange: (v) => upd({ given: {
							...given,
							m: v
						} })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "x +"
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: given.c,
						onChange: (v) => upd({ given: {
							...given,
							c: v
						} })
					})
				]
			}),
			m === "two-point" && /* @__PURE__ */ jsx(ConfigRow, {
				label: "Extras",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: !!a.showDistance,
					onClick: () => upd({ showDistance: !a.showDistance }),
					children: "show |AB| + midpoint"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Snap",
				children: /* @__PURE__ */ jsx(NumField, {
					value: a.snap ?? 1,
					onChange: (v) => updateAttributes({ snap: v })
				})
			}),
			/* @__PURE__ */ jsx(LabAskEditor, {
				ask,
				onChange: (a2) => upd({ ask: a2 })
			})
		] }), widget] });
	}
});
const CircleBlock = defineBlock({
	key: "circle-geometry",
	tag: "CircleLab",
	void: true,
	label: "Circle ((x−a)² + (y−b)² = r², tangent)",
	description: "Drag the centre and rim; live standard + expanded equation, optional tangent (⊥ to the radius). Optional graded answer.",
	category: "interactive",
	schema: z.object({
		center: pointSchema.optional(),
		radius: z.number().optional(),
		showTangent: z.boolean().optional(),
		showExpanded: z.boolean().optional(),
		tangentAngleDeg: z.number().optional(),
		snap: z.number().optional(),
		title: z.string().optional(),
		prompt: z.string().optional(),
		ask: labAskSchema.optional(),
		activity: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const a = attributes;
		const ask = attributes.ask;
		const widget = /* @__PURE__ */ jsx(CircleLab, { ...a });
		if (mode !== "editing" || !updateAttributes) return widget;
		const upd = updateAttributes;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.title ?? "",
					placeholder: "The circle",
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Radius",
				children: /* @__PURE__ */ jsx(NumField, {
					value: a.radius ?? 4,
					onChange: (v) => updateAttributes({ radius: v })
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Show",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: !!a.showExpanded,
					onClick: () => upd({ showExpanded: !a.showExpanded }),
					children: "expanded form"
				}), /* @__PURE__ */ jsx(ChipToggle, {
					active: !!a.showTangent,
					onClick: () => upd({ showTangent: !a.showTangent }),
					children: "tangent"
				})]
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Snap",
				children: /* @__PURE__ */ jsx(NumField, {
					value: a.snap ?? 1,
					onChange: (v) => updateAttributes({ snap: v })
				})
			}),
			/* @__PURE__ */ jsx(LabAskEditor, {
				ask,
				onChange: (a2) => upd({ ask: a2 })
			})
		] }), widget] });
	}
});
const ConicBlock = defineBlock({
	key: "conic",
	tag: "ConicLab",
	void: true,
	label: "Conic (parabola / ellipse / hyperbola / reciprocal)",
	description: "Drag a parabola (y²=4ax, focus+directrix), an ellipse (x²/a²+y²/b²=1, foci), a hyperbola (x²/a²−y²/b²=1, asymptotes), or the reciprocal xy=c. Optional graded answer.",
	category: "interactive",
	schema: z.object({
		kind: z.enum([
			"parabola",
			"ellipse",
			"hyperbola",
			"rectangular"
		]).optional(),
		a: z.number().optional(),
		b: z.number().optional(),
		c: z.number().optional(),
		showFocusDirectrix: z.boolean().optional(),
		showAsymptotes: z.boolean().optional(),
		snap: z.number().optional(),
		title: z.string().optional(),
		prompt: z.string().optional(),
		ask: labAskSchema.optional(),
		activity: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const a = attributes;
		const ask = attributes.ask;
		const k = a.kind ?? "parabola";
		const widget = /* @__PURE__ */ jsx(ConicLab, { ...a });
		if (mode !== "editing" || !updateAttributes) return widget;
		const upd = updateAttributes;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.title ?? "",
					placeholder: "The parabola",
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Curve",
				children: /* @__PURE__ */ jsx(SelectField, {
					value: k,
					options: [
						"parabola",
						"ellipse",
						"hyperbola",
						"rectangular"
					],
					onChange: (v) => upd({ kind: v })
				})
			}),
			k === "parabola" && /* @__PURE__ */ jsx(ConfigRow, {
				label: "a",
				children: /* @__PURE__ */ jsx(NumField, {
					value: a.a ?? 1,
					onChange: (v) => updateAttributes({ a: v })
				})
			}),
			k === "ellipse" && /* @__PURE__ */ jsxs(ConfigRow, {
				label: "a, b",
				children: [/* @__PURE__ */ jsx(NumField, {
					value: a.a ?? 4,
					onChange: (v) => updateAttributes({ a: v })
				}), /* @__PURE__ */ jsx(NumField, {
					value: a.b ?? 2.5,
					onChange: (v) => updateAttributes({ b: v })
				})]
			}),
			k === "hyperbola" && /* @__PURE__ */ jsxs(ConfigRow, {
				label: "a, b",
				children: [/* @__PURE__ */ jsx(NumField, {
					value: a.a ?? 2,
					onChange: (v) => updateAttributes({ a: v })
				}), /* @__PURE__ */ jsx(NumField, {
					value: a.b ?? 1.5,
					onChange: (v) => updateAttributes({ b: v })
				})]
			}),
			k === "rectangular" && /* @__PURE__ */ jsx(ConfigRow, {
				label: "c",
				children: /* @__PURE__ */ jsx(NumField, {
					value: a.c ?? 6,
					onChange: (v) => updateAttributes({ c: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Snap",
				children: /* @__PURE__ */ jsx(NumField, {
					value: a.snap ?? 1,
					onChange: (v) => updateAttributes({ snap: v })
				})
			}),
			/* @__PURE__ */ jsx(LabAskEditor, {
				ask,
				onChange: (a2) => upd({ ask: a2 })
			})
		] }), widget] });
	}
});
const DomainRangeBlock = defineBlock({
	key: "domain-range",
	tag: "DomainRange",
	void: true,
	label: "Domain & range (the two shadows)",
	description: "Type any f(x); the curve casts a domain shadow (x-axis) and range shadow (y-axis). Drag the input probe: green = accepted, red = undefined. Teaches every domain type.",
	category: "interactive",
	schema: z.object({
		equation: z.string().optional(),
		xRange: z.tuple([z.number(), z.number()]).optional(),
		restrict: z.tuple([z.number(), z.number()]).optional(),
		probe: z.number().optional(),
		title: z.string().optional(),
		prompt: z.string().optional(),
		ask: labAskSchema.optional(),
		activity: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const a = attributes;
		const ask = attributes.ask;
		const xR = a.xRange ?? [-6, 6];
		const restricted = Array.isArray(a.restrict);
		const widget = /* @__PURE__ */ jsx(DomainRangeLab, { ...a });
		if (mode !== "editing" || !updateAttributes) return widget;
		const upd = updateAttributes;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.title ?? "",
					placeholder: "Domain & range",
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "f(x) =",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.equation ?? "",
					mono: true,
					placeholder: "sqrt(9 - x^2)",
					onChange: (v) => updateAttributes({ equation: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "x window",
				children: [
					/* @__PURE__ */ jsx(NumField, {
						value: xR[0],
						onChange: (v) => updateAttributes({ xRange: [v, xR[1]] })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "to"
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: xR[1],
						onChange: (v) => updateAttributes({ xRange: [xR[0], v] })
					})
				]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Restrict domain",
				children: [
					/* @__PURE__ */ jsx(ChipToggle, {
						active: !restricted,
						onClick: () => upd({ restrict: void 0 }),
						children: "none"
					}),
					/* @__PURE__ */ jsx(ChipToggle, {
						active: restricted,
						onClick: () => upd({ restrict: a.restrict ?? [-2, 2] }),
						children: "interval"
					}),
					restricted && /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsx(NumField, {
							value: a.restrict[0],
							onChange: (v) => upd({ restrict: [v, a.restrict[1]] })
						}),
						/* @__PURE__ */ jsx("span", {
							className: "text-muted-foreground",
							children: "to"
						}),
						/* @__PURE__ */ jsx(NumField, {
							value: a.restrict[1],
							onChange: (v) => upd({ restrict: [a.restrict[0], v] })
						})
					] })
				]
			}),
			/* @__PURE__ */ jsx(LabAskEditor, {
				ask,
				onChange: (a2) => upd({ ask: a2 })
			})
		] }), widget] });
	}
});
const LinearModelBlock = defineBlock({
	key: "linear-model",
	tag: "LinearModel",
	void: true,
	label: "Proportion / rate (marbles → volume)",
	description: "A concrete scene (a beaker filling with marbles) linked to a graph: drag the point to predict the value at the next input. Discover y = rate·x + base from data. Optional graded follow-up.",
	category: "interactive",
	schema: z.object({
		slope: z.number().default(5),
		intercept: z.number().default(10),
		predictX: z.number().default(2),
		xMax: z.number().default(6),
		yMax: z.number().default(40),
		yStep: z.number().default(5),
		xLabel: z.string().default("Marbles"),
		yLabel: z.string().default("Volume"),
		unit: z.string().default("mL"),
		scene: z.string().default("vessel"),
		vesselObjects: z.boolean().default(true),
		vesselBinds: z.enum(["guess", "truth"]).default("guess"),
		objectLabel: z.string().optional(),
		title: z.string().optional(),
		prompt: z.string().optional(),
		ask: labAskSchema.optional(),
		activity: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const a = attributes;
		const ask = attributes.ask;
		const predictX = a.predictX ?? 2;
		const given = Array.from({ length: Math.max(1, predictX) }, (_, i) => i);
		const widget = /* @__PURE__ */ jsx(LinearModelLab, {
			...a,
			predictX,
			given
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const upd = updateAttributes;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.title ?? "",
					placeholder: "Find the volume",
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Rule: y =",
				children: [
					/* @__PURE__ */ jsx(NumField, {
						value: a.slope ?? 5,
						onChange: (v) => updateAttributes({ slope: v })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "· x +"
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: a.intercept ?? 10,
						onChange: (v) => updateAttributes({ intercept: v })
					})
				]
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Predict at x =",
				children: /* @__PURE__ */ jsx(NumField, {
					value: predictX,
					onChange: (v) => updateAttributes({ predictX: v })
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Axis labels",
				children: [/* @__PURE__ */ jsx(TextField, {
					value: a.xLabel ?? "Marbles",
					onChange: (v) => updateAttributes({ xLabel: v }),
					className: "w-28"
				}), /* @__PURE__ */ jsx(TextField, {
					value: a.yLabel ?? "Volume",
					onChange: (v) => updateAttributes({ yLabel: v }),
					className: "w-28"
				})]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "x / y max",
				children: [/* @__PURE__ */ jsx(NumField, {
					value: a.xMax ?? 6,
					onChange: (v) => updateAttributes({ xMax: v })
				}), /* @__PURE__ */ jsx(NumField, {
					value: a.yMax ?? 40,
					onChange: (v) => updateAttributes({ yMax: v })
				})]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "y step / unit",
				children: [/* @__PURE__ */ jsx(NumField, {
					value: a.yStep ?? 5,
					onChange: (v) => updateAttributes({ yStep: v })
				}), /* @__PURE__ */ jsx(TextField, {
					value: a.unit ?? "mL",
					onChange: (v) => updateAttributes({ unit: v }),
					className: "w-20"
				})]
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Concrete scene",
				children: /* @__PURE__ */ jsx(SelectField, {
					value: a.scene ?? "vessel",
					options: levelSceneOptions(),
					onChange: (v) => upd({ scene: v })
				})
			}),
			(a.scene ?? "vessel") === "vessel" && /* @__PURE__ */ jsxs(ConfigRow, {
				label: "Drop objects in",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: a.vesselObjects !== false,
					onClick: () => updateAttributes({ vesselObjects: !(a.vesselObjects !== false) }),
					children: a.vesselObjects !== false ? "objects (marbles)" : "just liquid"
				}), a.vesselObjects !== false && /* @__PURE__ */ jsx(TextField, {
					value: a.objectLabel ?? "",
					placeholder: "object word e.g. marbles",
					onChange: (v) => updateAttributes({ objectLabel: v }),
					className: "w-36"
				})]
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Twin level follows",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: (a.vesselBinds ?? "guess") === "guess",
					onClick: () => updateAttributes({ vesselBinds: (a.vesselBinds ?? "guess") === "guess" ? "truth" : "guess" }),
					children: (a.vesselBinds ?? "guess") === "guess" ? "your drag (rises & falls live)" : "the real lab level (you match it)"
				})
			}),
			/* @__PURE__ */ jsx(LabAskEditor, {
				ask,
				onChange: (a2) => upd({ ask: a2 })
			})
		] }), widget] });
	}
});
const SequencePredictBlock = defineBlock({
	key: "sequence-predict",
	tag: "SequencePredict",
	void: true,
	label: "Exponential / sequence (watch it grow)",
	description: "A count shown as a growing crowd of dots (3 → 6 → 12, new ones lit up); the learner tap-fills the hidden terms. Geometric (×ratio) or arithmetic (+difference). The \"joke that doubles\" lesson.",
	category: "interactive",
	schema: z.object({
		start: z.number().default(3),
		rule: z.enum(["geometric", "arithmetic"]).default("geometric"),
		factor: z.number().default(2),
		shown: z.number().default(1),
		predict: z.number().default(2),
		stepLabel: z.string().default("Day"),
		highlightNew: z.boolean().default(true),
		scene: z.string().default("cluster"),
		title: z.string().optional(),
		prompt: z.string().optional(),
		activity: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const a = attributes;
		const r = a.rule ?? "geometric";
		const widget = /* @__PURE__ */ jsx(SequencePredict, { ...a });
		if (mode !== "editing" || !updateAttributes) return widget;
		const upd = updateAttributes;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.title ?? "",
					placeholder: "How does it grow?",
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Story / prompt",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.prompt ?? "",
					placeholder: "Each day the number doubles.",
					onChange: (v) => updateAttributes({ prompt: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Start value",
				children: /* @__PURE__ */ jsx(NumField, {
					value: a.start ?? 3,
					onChange: (v) => updateAttributes({ start: v })
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Rule",
				children: [
					/* @__PURE__ */ jsx(SelectField, {
						value: r,
						options: ["geometric", "arithmetic"],
						onChange: (v) => upd({ rule: v })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: r === "geometric" ? "× by" : "+ by"
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: a.factor ?? 2,
						onChange: (v) => updateAttributes({ factor: v })
					})
				]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Shown / predict",
				children: [/* @__PURE__ */ jsx(NumField, {
					value: a.shown ?? 1,
					onChange: (v) => updateAttributes({ shown: v })
				}), /* @__PURE__ */ jsx(NumField, {
					value: a.predict ?? 2,
					onChange: (v) => updateAttributes({ predict: v })
				})]
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Step label",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.stepLabel ?? "Day",
					onChange: (v) => updateAttributes({ stepLabel: v }),
					className: "w-28"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Count scene",
				children: /* @__PURE__ */ jsx(SelectField, {
					value: a.scene ?? "cluster",
					options: countSceneOptions(),
					onChange: (v) => upd({ scene: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Highlight new",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: a.highlightNew !== false,
					onClick: () => updateAttributes({ highlightNew: !(a.highlightNew !== false) }),
					children: "light up added"
				})
			})
		] }), widget] });
	}
});
const PercentBarBlock = labBlock({
	key: "percent-bar",
	label: "Percentage bar",
	description: "A bar is the whole (100%); drag the fill to a target percent and read both the percent and the amount (percent × whole). Author any analogy via whole + unit + an optional segment breakdown.",
	schema: z.object({
		whole: z.number().default(100),
		unit: z.string().default(""),
		target: z.number().optional(),
		start: z.number().default(0),
		snapPct: z.number().default(5),
		showValue: z.boolean().default(true),
		referenceLabel: z.string().optional(),
		segments: z.array(z.object({
			frac: z.number(),
			label: z.string().optional(),
			color: z.string().optional()
		})).optional(),
		scene: z.enum([
			"none",
			"pie",
			"battery",
			"jar",
			"balloon",
			"thermometer"
		]).default("none"),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: (a) => /* @__PURE__ */ jsx(PercentBarLab, { ...a })
});
const FractionBarBlock = labBlock({
	key: "fraction-bar",
	label: "Fraction strip",
	description: "A strip cut into equal parts; drag to shade k/n. Reads as fraction, decimal, percent and (with a whole) a quantity. An optional compare strip shows the equivalent fraction.",
	schema: z.object({
		denom: z.number().default(4),
		num: z.number().default(0),
		target: z.number().optional(),
		whole: z.number().optional(),
		unit: z.string().default(""),
		compareDenom: z.number().optional(),
		showEquiv: z.boolean().default(true),
		scene: z.enum([
			"none",
			"pie",
			"battery",
			"jar",
			"balloon",
			"thermometer"
		]).default("none"),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: (a) => /* @__PURE__ */ jsx(FractionBarLab, { ...a })
});
const RatioShareBlock = labBlock({
	key: "ratio-share",
	label: "Share in a ratio",
	description: "Split a quantity in the ratio a:b by dragging one divider. Reads back the amounts and the simplified ratio; any equivalent split (40:60 = 2:3) solves it.",
	schema: z.object({
		a: z.number().default(2),
		b: z.number().default(3),
		total: z.number().default(100),
		unit: z.string().default(""),
		labelA: z.string().default("A"),
		labelB: z.string().default("B"),
		step: z.number().default(1),
		scene: z.enum([
			"none",
			"pie",
			"battery",
			"jar",
			"balloon",
			"thermometer"
		]).default("none"),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: (a) => /* @__PURE__ */ jsx(RatioShareLab, { ...a })
});
const ComplexPlaneBlock = labBlock({
	key: "complex-plane",
	label: "Complex plane (Argand)",
	description: "Drag a + bi on the Argand plane: read the modulus and argument (deg & rad). Modes: point, multiply (×i rotates 90°), power (De Moivre spiral), or roots (the nth-roots of unity 1, i, −1, −i, ω).",
	schema: z.object({
		start: z.object({
			re: z.number(),
			im: z.number()
		}).optional(),
		mode: z.enum([
			"point",
			"multiply",
			"power",
			"roots"
		]).default("point"),
		rootsN: z.number().default(4),
		powerN: z.number().default(3),
		snap: z.number().default(1),
		range: z.number().default(6),
		target: z.object({
			re: z.number(),
			im: z.number()
		}).optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: (a) => /* @__PURE__ */ jsx(ComplexPlaneLab, { ...a })
});
const TrigSignsBlock = labBlock({
	key: "trig-signs",
	label: "Unit circle — signs (CAST)",
	description: "Drag the angle on the unit circle: the quadrant lights up with its CAST letter (which of sin/cos/tan are +), cos and sin draw green/red by sign, and special angles show their exact value (½, √3⁄2 …).",
	schema: z.object({
		startDeg: z.number().default(30),
		snapDeg: z.number().default(15),
		targetDeg: z.number().optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: (a) => /* @__PURE__ */ jsx(TrigSignsLab, { ...a })
});
const PolynomialSolverBlock = labBlock({
	key: "polynomial-solver",
	label: "Polynomial solver (factor / solve, step by step)",
	description: "Type a polynomial in x; the engine factors it or solves =0 and shows the working (split the middle term; factor theorem for higher degree). Any-degree roots incl. complex, client-side.",
	schema: z.object({
		expr: z.string().default("x^2 + 5x + 6"),
		mode: z.enum(["factor", "solve"]).default("factor"),
		editable: z.boolean().default(true),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: (a) => /* @__PURE__ */ jsx(PolynomialSolverLab, { ...a })
});
const RateMachineBlock = labBlock({
	key: "rate-machine",
	label: "Proportion machine (drag the count, it scales)",
	description: "Count-driven concrete → graph: drag the input up and down; objects drop into a vessel, the liquid level rises by the same rate each step, and a point rides up the line leaving a dot at every whole step. Proportionality you scrub. Skinnable (battery, jar, savings) and an optional \"set it to N\" goal.",
	schema: z.object({
		rate: z.number().default(5),
		base: z.number().default(0),
		maxCount: z.number().default(6),
		startCount: z.number().default(1),
		yMax: z.number().default(40),
		yStep: z.number().default(5),
		xLabel: z.string().default("Items"),
		yLabel: z.string().default("Cost"),
		unit: z.string().default("$"),
		itemLabel: z.string().optional(),
		scene: z.string().default("vessel"),
		showObjects: z.boolean().default(true),
		target: z.number().optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: (a) => /* @__PURE__ */ jsx(RateMachineLab, { ...a })
});
const GeoTransformBlock = defineBlock({
	key: "geometry-transform",
	tag: "GeoTransform",
	void: true,
	label: "Transformations (translate / reflect / rotate / enlarge)",
	description: "Send a shape onto ghost targets by filling the transform from a tile tray; on a correct fill the shape flies to the targets. One lab, four transformation types.",
	category: "interactive",
	schema: z.object({
		kind: z.enum([
			"translate",
			"reflect",
			"rotate",
			"enlarge"
		]).default("translate"),
		byX: z.number().default(5),
		byY: z.number().default(1),
		axis: z.enum([
			"x",
			"y",
			"y=x",
			"y=-x"
		]).default("y"),
		deg: z.number().default(90),
		k: z.number().default(2),
		title: z.string().optional(),
		prompt: z.string().optional(),
		activity: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const a = attributes;
		const kind = a.kind ?? "translate";
		const widget = /* @__PURE__ */ jsx(TransformLab, {
			transform: kind === "translate" ? {
				kind,
				by: {
					x: a.byX ?? 5,
					y: a.byY ?? 1
				}
			} : kind === "reflect" ? {
				kind,
				axis: a.axis ?? "y"
			} : kind === "rotate" ? {
				kind,
				deg: a.deg ?? 90,
				about: {
					x: 0,
					y: 0
				}
			} : {
				kind: "enlarge",
				k: a.k ?? 2,
				about: {
					x: 0,
					y: 0
				}
			},
			title: a.title,
			prompt: a.prompt,
			activity: attributes.activity
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const upd = updateAttributes;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.title ?? "",
					placeholder: "Transformations",
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Type",
				children: /* @__PURE__ */ jsx(SelectField, {
					value: kind,
					options: [
						"translate",
						"reflect",
						"rotate",
						"enlarge"
					],
					onChange: (v) => upd({ kind: v })
				})
			}),
			kind === "translate" && /* @__PURE__ */ jsxs(ConfigRow, {
				label: "by (",
				children: [
					/* @__PURE__ */ jsx(NumField, {
						value: a.byX ?? 5,
						onChange: (v) => updateAttributes({ byX: v })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: ","
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: a.byY ?? 1,
						onChange: (v) => updateAttributes({ byY: v })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: ")"
					})
				]
			}),
			kind === "reflect" && /* @__PURE__ */ jsx(ConfigRow, {
				label: "Mirror line",
				children: /* @__PURE__ */ jsx(SelectField, {
					value: a.axis ?? "y",
					options: [
						"x",
						"y",
						"y=x",
						"y=-x"
					],
					onChange: (v) => upd({ axis: v })
				})
			}),
			kind === "rotate" && /* @__PURE__ */ jsx(ConfigRow, {
				label: "Angle (° anticlockwise)",
				children: /* @__PURE__ */ jsx(SelectField, {
					value: String(a.deg ?? 90),
					options: [
						"90",
						"180",
						"270"
					],
					onChange: (v) => updateAttributes({ deg: Number(v) })
				})
			}),
			kind === "enlarge" && /* @__PURE__ */ jsx(ConfigRow, {
				label: "Scale factor",
				children: /* @__PURE__ */ jsx(SelectField, {
					value: String(a.k ?? 2),
					options: [
						"2",
						"3",
						"4"
					],
					onChange: (v) => updateAttributes({ k: Number(v) })
				})
			})
		] }), widget] });
	}
});
const receiptItemSchema = z.object({
	qty: z.number(),
	name: z.string(),
	unit: z.number()
});
const ReceiptBlock = defineBlock({
	key: "receipt-totals",
	tag: "ReceiptTotals",
	void: true,
	label: "Receipt totals (qty × price)",
	description: "A shop receipt where the learner tap-fills the total items and total cost; classic \"summed the prices, forgot the quantity\" distractors. Multiplicative + additive reasoning grounded in a real bill.",
	category: "interactive",
	schema: z.object({
		store: z.string().default("Half Foods"),
		currency: z.string().default("$"),
		items: z.array(receiptItemSchema).optional(),
		askItems: z.boolean().default(true),
		askCost: z.boolean().default(true),
		title: z.string().optional(),
		prompt: z.string().optional(),
		activity: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const a = attributes;
		const items = Array.isArray(a.items) && a.items.length ? a.items : void 0;
		const widget = /* @__PURE__ */ jsx(ReceiptLab, {
			store: a.store,
			currency: a.currency,
			items,
			ask: {
				items: a.askItems !== false,
				cost: a.askCost !== false
			},
			title: a.title,
			prompt: a.prompt,
			activity: attributes.activity
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const list = items ?? [{
			qty: 6,
			name: "Pineapples",
			unit: 5
		}, {
			qty: 3,
			name: "Mangoes",
			unit: 2
		}];
		const setItem = (i, patch) => updateAttributes({ items: list.map((it, j) => j === i ? {
			...it,
			...patch
		} : it) });
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Store",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.store ?? "Half Foods",
					onChange: (v) => updateAttributes({ store: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Currency",
				children: /* @__PURE__ */ jsx(TextField, {
					value: a.currency ?? "$",
					onChange: (v) => updateAttributes({ currency: v }),
					className: "w-16"
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-1.5",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "font-medium text-muted-foreground",
						children: "Line items (qty × name @ price)"
					}),
					list.map((it, i) => /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-1.5",
						children: [
							/* @__PURE__ */ jsx(NumField, {
								value: it.qty,
								onChange: (v) => setItem(i, { qty: v })
							}),
							/* @__PURE__ */ jsx(TextField, {
								value: it.name,
								placeholder: "Pineapples",
								onChange: (v) => setItem(i, { name: v }),
								className: "w-32"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-muted-foreground",
								children: "@"
							}),
							/* @__PURE__ */ jsx(NumField, {
								value: it.unit,
								onChange: (v) => setItem(i, { unit: v })
							}),
							list.length > 1 && /* @__PURE__ */ jsx(SmallButton, {
								tone: "danger",
								onClick: () => updateAttributes({ items: list.filter((_, j) => j !== i) }),
								children: "✕"
							})
						]
					}, i)),
					/* @__PURE__ */ jsx(SmallButton, {
						onClick: () => updateAttributes({ items: [...list, {
							qty: 1,
							name: "",
							unit: 1
						}] }),
						children: "+ item"
					})
				]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Ask for",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: a.askItems !== false,
					onClick: () => updateAttributes({ askItems: !(a.askItems !== false) }),
					children: "total items"
				}), /* @__PURE__ */ jsx(ChipToggle, {
					active: a.askCost !== false,
					onClick: () => updateAttributes({ askCost: !(a.askCost !== false) }),
					children: "total cost"
				})]
			})
		] }), widget] });
	}
});
const SystemSolveBlock = defineBlock({
	key: "system-solve",
	tag: "SystemSolve",
	void: true,
	label: "System of equations (two clues, by elimination)",
	description: "Two unknowns, two clues, solved by elimination (not just the graph crossing). Swappable concrete scene: a shop receipt, a bucket balance, or algebra tiles. Creators theme the same maths any way.",
	category: "interactive",
	schema: z.object({
		scene: z.string().default("receipt"),
		symA: z.string().default("🍍"),
		labelA: z.string().default("Pineapple"),
		answerA: z.number().default(5),
		symB: z.string().default("🥭"),
		labelB: z.string().default("Mango"),
		answerB: z.number().default(2),
		a0: z.number().default(2),
		b0: z.number().default(1),
		a1: z.number().default(1),
		b1: z.number().default(1),
		currency: z.string().optional(),
		unit: z.string().optional(),
		store: z.string().optional(),
		title: z.string().optional(),
		prompt: z.string().optional(),
		activity: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const a = attributes;
		const num = (k, d) => typeof a[k] === "number" ? a[k] : d;
		const str = (k, d) => typeof a[k] === "string" ? a[k] : d;
		const scene = str("scene", "receipt");
		const widget = /* @__PURE__ */ jsx(SystemSolveLab, {
			scene,
			unknowns: [{
				sym: str("symA", "🍍"),
				label: str("labelA", "Pineapple"),
				color: "var(--stage-warn)",
				answer: num("answerA", 5)
			}, {
				sym: str("symB", "🥭"),
				label: str("labelB", "Mango"),
				color: "var(--stage-good)",
				answer: num("answerB", 2)
			}],
			clues: [{ coeffs: [num("a0", 2), num("b0", 1)] }, { coeffs: [num("a1", 1), num("b1", 1)] }],
			currency: a.currency,
			unit: a.unit,
			store: a.store,
			title: a.title,
			prompt: a.prompt,
			activity: a.activity
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: str("title", ""),
					placeholder: "Two clues, two unknowns",
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Scene",
				children: /* @__PURE__ */ jsx(SelectField, {
					value: scene,
					options: clueSceneOptions(),
					onChange: (v) => updateAttributes({ scene: v })
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Item A",
				children: [
					/* @__PURE__ */ jsx(TextField, {
						value: str("symA", "🍍"),
						onChange: (v) => updateAttributes({ symA: v }),
						className: "w-16"
					}),
					/* @__PURE__ */ jsx(TextField, {
						value: str("labelA", "Pineapple"),
						onChange: (v) => updateAttributes({ labelA: v }),
						className: "w-28"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "="
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: num("answerA", 5),
						onChange: (v) => updateAttributes({ answerA: v })
					})
				]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Item B",
				children: [
					/* @__PURE__ */ jsx(TextField, {
						value: str("symB", "🥭"),
						onChange: (v) => updateAttributes({ symB: v }),
						className: "w-16"
					}),
					/* @__PURE__ */ jsx(TextField, {
						value: str("labelB", "Mango"),
						onChange: (v) => updateAttributes({ labelB: v }),
						className: "w-28"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "="
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: num("answerB", 2),
						onChange: (v) => updateAttributes({ answerB: v })
					})
				]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Clue 1",
				children: [
					/* @__PURE__ */ jsx(NumField, {
						value: num("a0", 2),
						onChange: (v) => updateAttributes({ a0: v })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "A +"
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: num("b0", 1),
						onChange: (v) => updateAttributes({ b0: v })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "B"
					})
				]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "Clue 2",
				children: [
					/* @__PURE__ */ jsx(NumField, {
						value: num("a1", 1),
						onChange: (v) => updateAttributes({ a1: v })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "A +"
					}),
					/* @__PURE__ */ jsx(NumField, {
						value: num("b1", 1),
						onChange: (v) => updateAttributes({ b1: v })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-muted-foreground",
						children: "B"
					})
				]
			})
		] }), widget] });
	}
});
function customSceneSpec(a) {
	const name = typeof a.name === "string" && a.name.trim() || "custom";
	const label = typeof a.label === "string" && a.label.trim() ? a.label : void 0;
	const v = a.variant;
	if (v === "icons") return {
		name,
		label,
		kind: "level",
		icon: a.icon || "⭐",
		slots: Number(a.slots) || 5
	};
	if (v === "shape") return {
		name,
		label,
		kind: "level",
		shape: a.shape || "box",
		color: a.color || "#7c83ff"
	};
	return {
		name,
		label,
		kind: "count",
		icon: a.icon || "🔵"
	};
}
function customSceneAttrs(s) {
	if (s.kind === "count") return {
		name: s.name,
		label: s.label ?? "",
		variant: "count",
		icon: s.icon
	};
	if ("icon" in s) return {
		name: s.name,
		label: s.label ?? "",
		variant: "icons",
		icon: s.icon,
		slots: s.slots ?? 5
	};
	return {
		name: s.name,
		label: s.label ?? "",
		variant: "shape",
		shape: s.shape,
		color: s.color ?? "#7c83ff"
	};
}
const CustomSceneBlock = defineBlock({
	key: "custom-scene",
	tag: "CustomScene",
	void: true,
	label: "Custom scene (no-code lab skin)",
	description: "Invent a new lab skin from a form (an emoji or a shape) — no code. Place it ABOVE a lab and pick the new scene by name in that lab.",
	category: "interactive",
	schema: z.object({
		name: z.string().default("custom"),
		label: z.string().optional(),
		variant: z.enum([
			"count",
			"icons",
			"shape"
		]).default("count"),
		icon: z.string().default("🔵"),
		slots: z.number().default(5),
		shape: z.enum([
			"box",
			"cup",
			"circle"
		]).default("box"),
		color: z.string().default("#7c83ff")
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const spec = customSceneSpec(attributes);
		registerDataScene(spec);
		if (mode !== "editing" || !updateAttributes) return /* @__PURE__ */ jsxs("div", {
			className: "not-prose",
			style: {
				padding: "8px 12px",
				borderRadius: 8,
				fontSize: 13,
				color: "var(--stage-good)",
				border: "1px solid var(--stage-good)"
			},
			children: [
				"✓ Scene “",
				spec.name,
				"” is ready — choose it in a lab’s scene list below."
			]
		});
		return /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 8
			},
			children: [/* @__PURE__ */ jsx(SceneStudio, {
				spec,
				onChange: (s) => updateAttributes(customSceneAttrs(s))
			}), /* @__PURE__ */ jsxs("p", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)",
					margin: 0
				},
				children: [
					"Tip: put this above a lab, then pick “",
					spec.name,
					"” in that lab’s scene dropdown."
				]
			})]
		});
	}
});
/** All math labs blocks, spread into a host's `defineBlock` list. */
const mathBlocks = [
	TrigExplorerBlock,
	GraphBlock,
	PercentBarBlock,
	FractionBarBlock,
	RatioShareBlock,
	ComplexPlaneBlock,
	TrigSignsBlock,
	PolynomialSolverBlock,
	DerivativeExplorerBlock,
	GradientDescentBlock,
	IntegralExplorerBlock,
	LimitExplorerBlock,
	DerivationBlock,
	LinearSystemBlock,
	NumberLineBlock,
	MysteryBucketBlock,
	BalanceAlgebraBlock,
	VertexParabolaBlock,
	AreaModelBlock,
	GrowingPatternBlock,
	InteractiveProblemBlock,
	TriangleTrigBlock,
	StraightLineBlock,
	CircleBlock,
	ConicBlock,
	DomainRangeBlock,
	LinearModelBlock,
	RateMachineBlock,
	SequencePredictBlock,
	GeoTransformBlock,
	ReceiptBlock,
	SystemSolveBlock,
	CustomSceneBlock
];
/** The MDX tag → component render map slice for the math domain. */
const mathComponents = {
	MysteryBucket: MysteryBucketLab,
	NumberLine: NumberLineLab,
	LinearSystem: LinearSystemView,
	BalanceAlgebra: BalanceAlgebraLab,
	VertexParabola: VertexParabolaLab,
	AreaModel: AreaModelLab,
	GrowingPattern: GrowingPatternLab,
	FunctionMachine: FunctionMachineLab,
	Graph: Grapher,
	DerivativeExplorer,
	IntegralExplorer,
	LimitExplorer,
	GradientDescent,
	Derivation,
	TrigExplorer,
	InteractiveProblem,
	TriangleTrig,
	StraightLine: StraightLineLab,
	CircleLab,
	ConicLab,
	DomainRange: DomainRangeLab,
	LinearModel: LinearModelLab,
	RateMachine: RateMachineLab,
	SequencePredict,
	PercentBar: PercentBarLab,
	FractionBar: FractionBarLab,
	RatioShare: RatioShareLab,
	ComplexPlane: ComplexPlaneLab,
	TrigSigns: TrigSignsLab,
	PolynomialSolver: PolynomialSolverLab,
	GeoTransform: TransformLab,
	ReceiptTotals: ReceiptLab,
	SystemSolve: SystemSolveLab
};

//#endregion
export { AreaModelBlock, BalanceAlgebraBlock, CircleBlock, ComplexPlaneBlock, ConicBlock, CustomSceneBlock, DerivationBlock, DerivativeExplorerBlock, DomainRangeBlock, FractionBarBlock, GeoTransformBlock, GradientDescentBlock, GraphBlock, GrowingPatternBlock, IntegralExplorerBlock, InteractiveProblemBlock, LimitExplorerBlock, LinearModelBlock, LinearSystemBlock, LinearSystemView, MysteryBucketBlock, NumberLineBlock, PercentBarBlock, PolynomialSolverBlock, RateMachineBlock, RatioShareBlock, ReceiptBlock, SequencePredictBlock, StraightLineBlock, SystemSolveBlock, TriangleTrigBlock, TrigExplorerBlock, TrigSignsBlock, VertexParabolaBlock, mathBlocks, mathComponents };