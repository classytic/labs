import { CircuitNetworkLab } from "../circuits/circuit/preset.mjs";
import { CircuitLab } from "../circuits/circuit-lab.mjs";
import { CircuitBuilder } from "../circuits/circuit-builder.mjs";
import { CapacitorLeakLab } from "../circuits/capacitor-leak/preset.mjs";
import { RCChargingLab } from "../circuits/rc-charging/preset.mjs";
import { DiodeLab } from "../circuits/diode/preset.mjs";
import { TransistorLab } from "../circuits/transistor/preset.mjs";
import { CmosInverterLab, CmosNandLab, CmosNorLab, RNmosNotLab } from "../circuits/cmos-gate/preset.mjs";
import { BrownoutLab } from "../circuits/brownout/preset.mjs";
import { BjtInsideLab, ConductionLab, HallEffectLab, MosfetInsideLab, PnJunctionLab, SiliconLatticeLab } from "../circuits/semiconductor/preset.mjs";
import { CircuitPlayer } from "../build/CircuitPlayer.mjs";
import { CircuitEditor } from "../build/CircuitEditor.mjs";
import { ChipToggle, ConfigPanel, ConfigRow, NumField, SmallButton, TextField } from "./authoring.mjs";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/circuits.tsx
const CircuitLabBlock = defineBlock({
	key: "circuit-lab",
	void: true,
	label: "Circuit lab",
	description: "Series/parallel resistors, voltage & current divider rules, step by step.",
	category: "interactive",
	schema: z.object({
		voltage: z.number().optional(),
		r1: z.number().optional(),
		r2: z.number().optional(),
		mode: z.enum(["series", "parallel"]).optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(CircuitLab, {
			voltage: typeof attributes.voltage === "number" ? attributes.voltage : 12,
			r1: typeof attributes.r1 === "number" ? attributes.r1 : 100,
			r2: typeof attributes.r2 === "number" ? attributes.r2 : 200,
			mode: attributes.mode === "parallel" ? "parallel" : "series",
			title: attributes.title ?? "Series & parallel: how V and I divide"
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "Series & parallel: how V and I divide",
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "V",
				children: /* @__PURE__ */ jsx(NumField, {
					value: typeof attributes.voltage === "number" ? attributes.voltage : 12,
					onChange: (v) => updateAttributes({ voltage: v })
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "R₁ / R₂",
				children: [/* @__PURE__ */ jsx(NumField, {
					value: typeof attributes.r1 === "number" ? attributes.r1 : 100,
					onChange: (v) => updateAttributes({ r1: v })
				}), /* @__PURE__ */ jsx(NumField, {
					value: typeof attributes.r2 === "number" ? attributes.r2 : 200,
					onChange: (v) => updateAttributes({ r2: v })
				})]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "mode",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: attributes.mode !== "parallel",
					onClick: () => updateAttributes({ mode: "series" }),
					children: "series"
				}), /* @__PURE__ */ jsx(ChipToggle, {
					active: attributes.mode === "parallel",
					onClick: () => updateAttributes({ mode: "parallel" }),
					children: "parallel"
				})]
			})
		] }), widget] });
	}
});
const asComponents = (raw) => {
	if (!Array.isArray(raw) || !raw.length) return [{
		type: "switch",
		closed: false,
		label: "switch"
	}, {
		type: "bulb",
		ohms: 12,
		label: "bulb"
	}];
	return raw;
};
const CircuitBuilderBlock = defineBlock({
	key: "circuit-builder",
	void: true,
	label: "Circuit builder (play)",
	description: "Build a loop, battery, bulbs, switches, resistors. Flip switches, watch current & the bulb.",
	category: "interactive",
	schema: z.object({
		battery: z.number().optional(),
		components: z.array(z.record(z.string(), z.unknown())).optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const components = asComponents(attributes.components);
		const battery = typeof attributes.battery === "number" ? attributes.battery : 6;
		const title = attributes.title ?? "Build a circuit";
		const widget = /* @__PURE__ */ jsx(CircuitBuilder, {
			battery,
			components,
			title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const set = (next) => updateAttributes({ components: next });
		const upd = (i, patch) => set(components.map((c, j) => j === i ? {
			...c,
			...patch
		} : c));
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
				label: "battery V",
				children: /* @__PURE__ */ jsx(NumField, {
					value: battery,
					onChange: (v) => updateAttributes({ battery: v })
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ jsx("span", {
					className: "font-medium text-muted-foreground",
					children: "Components (series loop)"
				}), components.map((c, i) => /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center gap-1.5 rounded border border-border/50 bg-background/40 px-1.5 py-1",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "w-16 text-[10px] font-bold uppercase tracking-wide text-muted-foreground",
							children: c.type
						}),
						(c.type === "resistor" || c.type === "bulb") && /* @__PURE__ */ jsxs(Fragment, { children: ["Ω", /* @__PURE__ */ jsx(NumField, {
							value: c.ohms,
							onChange: (v) => upd(i, { ohms: v })
						})] }),
						c.type === "switch" && /* @__PURE__ */ jsx(ChipToggle, {
							active: c.closed !== false,
							onClick: () => upd(i, { closed: c.closed === false }),
							children: c.closed !== false ? "closed" : "open"
						}),
						/* @__PURE__ */ jsx(TextField, {
							value: c.label ?? "",
							placeholder: "label",
							onChange: (v) => upd(i, { label: v }),
							className: "w-20"
						}),
						/* @__PURE__ */ jsx(SmallButton, {
							tone: "danger",
							onClick: () => set(components.filter((_, j) => j !== i)),
							children: "✕"
						})
					]
				}, i))]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap gap-1.5",
				children: [
					/* @__PURE__ */ jsx(SmallButton, {
						onClick: () => set([...components, {
							type: "resistor",
							ohms: 100,
							label: "R"
						}]),
						children: "+ resistor"
					}),
					/* @__PURE__ */ jsx(SmallButton, {
						onClick: () => set([...components, {
							type: "bulb",
							ohms: 12,
							label: "bulb"
						}]),
						children: "+ bulb"
					}),
					/* @__PURE__ */ jsx(SmallButton, {
						onClick: () => set([...components, {
							type: "switch",
							closed: false,
							label: "switch"
						}]),
						children: "+ switch"
					})
				]
			})
		] }), widget] });
	}
});
/** Simple single-loop circuit authoring → the labs component's branches[][] API. */
function CircuitPuzzle({ emf = 6, bulbOhms = 6, withSwitch = true, controlId }) {
	return /* @__PURE__ */ jsx(CircuitNetworkLab, {
		emf,
		branches: [withSwitch ? [{
			type: "switch",
			closed: false
		}, {
			type: "bulb",
			ohms: bulbOhms
		}] : [{
			type: "bulb",
			ohms: bulbOhms
		}]],
		goal: { kind: "lightBulb" },
		controlId
	});
}
const CircuitBlock = defineBlock({
	key: "circuit",
	tag: "Circuit",
	void: true,
	label: "Circuit (light the bulb)",
	description: "Battery + switch + bulb, close the switch and tune the voltage to light it.",
	category: "interactive",
	schema: z.object({
		emf: z.number().default(6),
		bulbOhms: z.number().default(6),
		withSwitch: z.boolean().default(true),
		controlId: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const { emf = 6, bulbOhms = 6, withSwitch = true } = attributes;
		const widget = /* @__PURE__ */ jsx(CircuitPuzzle, {
			emf,
			bulbOhms,
			withSwitch,
			controlId: attributes.controlId
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "battery (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: emf,
					onChange: (v) => updateAttributes({ emf: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "bulb (Ω)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: bulbOhms,
					onChange: (v) => updateAttributes({ bulbOhms: v })
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "switch",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: withSwitch,
					onClick: () => updateAttributes({ withSwitch: true }),
					children: "yes"
				}), /* @__PURE__ */ jsx(ChipToggle, {
					active: !withSwitch,
					onClick: () => updateAttributes({ withSwitch: false }),
					children: "no"
				})]
			})
		] }), widget] });
	}
});
const CapacitorLeakBlock = defineBlock({
	key: "capacitor-leak",
	tag: "CapacitorLeak",
	void: true,
	label: "Capacitor: charge & leak (RC)",
	description: "A cell charges a capacitor through R; flip to \"leak\" and it self-discharges through its leakage resistance, the plate field thins, drips fall, Vc decays. Live Vc–t trace + τ readout.",
	category: "interactive",
	schema: z.object({
		emf: z.number().default(6),
		rK: z.number().default(10),
		capU: z.number().default(100),
		leakK: z.number().default(200),
		startCharged: z.boolean().optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(CapacitorLeakLab, {
			emf: attributes.emf,
			rK: attributes.rK,
			capU: attributes.capU,
			leakK: attributes.leakK,
			startCharged: attributes.startCharged,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "Charging & leaking a capacitor"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "EMF (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.emf ?? 6,
					onChange: (v) => updateAttributes({ emf: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "R (kΩ)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.rK ?? 10,
					onChange: (v) => updateAttributes({ rK: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "C (µF)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.capU ?? 100,
					onChange: (v) => updateAttributes({ capU: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "leak R (kΩ)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.leakK ?? 200,
					onChange: (v) => updateAttributes({ leakK: v })
				})
			})
		] }), widget] });
	}
});
const cvec = z.object({
	x: z.number(),
	y: z.number()
});
const cPart = z.object({
	id: z.string(),
	kind: z.string(),
	at: cvec,
	orient: z.enum(["h", "v"]).optional(),
	props: z.record(z.string(), z.union([
		z.number(),
		z.string(),
		z.boolean()
	])).optional(),
	pins: z.record(z.string(), z.string())
});
const cDoc = z.object({
	parts: z.array(cPart).default([]),
	nodes: z.array(z.object({
		id: z.string(),
		at: cvec
	})).default([]),
	size: z.object({
		w: z.number(),
		h: z.number()
	}).optional()
});
const EMPTY_DOC = {
	parts: [],
	nodes: [],
	size: {
		w: 560,
		h: 300
	}
};
/** Render a stored doc for learners: a CircuitPlayer they can operate (tap switches). */
function CircuitSceneView({ doc }) {
	return /* @__PURE__ */ jsx(CircuitPlayer, { doc: doc ?? EMPTY_DOC });
}
const CircuitSceneBlock = defineBlock({
	key: "circuit-scene",
	tag: "CircuitScene",
	void: true,
	label: "Circuit builder (canvas)",
	description: "Place parts on a canvas, drag to arrange, click pins to wire. Any topology (Kirchhoff), solved live. Learners tap switches to operate it.",
	category: "interactive",
	schema: z.object({
		doc: cDoc.optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const doc = attributes.doc ?? EMPTY_DOC;
		if (mode !== "editing" || !updateAttributes) return /* @__PURE__ */ jsx(CircuitSceneView, { doc });
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(ConfigPanel, { children: /* @__PURE__ */ jsx(ConfigRow, {
			label: "Title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: attributes.title ?? "",
				onChange: (v) => updateAttributes({ title: v }),
				placeholder: "Build a circuit",
				className: "flex-1"
			})
		}) }), /* @__PURE__ */ jsx(CircuitEditor, {
			value: doc,
			onChange: (d) => updateAttributes({ doc: d })
		})] });
	}
});
const MosfetInsideBlock = defineBlock({
	key: "mosfet-inside",
	tag: "MosfetInside",
	void: true,
	label: "Inside the transistor (NMOS channel)",
	description: "Cross-section of an NMOS: raise the gate and watch a depletion region, then an electron channel, form between source and drain. Carriers move; engine-solved.",
	category: "interactive",
	schema: z.object({
		pmos: z.boolean().default(false),
		vth: z.number().default(1.5),
		k: z.number().default(.02),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(MosfetInsideLab, {
			pmos: attributes.pmos,
			vth: attributes.vth,
			k: attributes.k,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "Inside the transistor",
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "type",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: !attributes.pmos,
					onClick: () => updateAttributes({ pmos: false }),
					children: "NMOS"
				}), /* @__PURE__ */ jsx(ChipToggle, {
					active: !!attributes.pmos,
					onClick: () => updateAttributes({ pmos: true }),
					children: "PMOS"
				})]
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "threshold Vth (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.vth ?? 1.5,
					onChange: (v) => updateAttributes({ vth: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "gain k",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.k ?? .02,
					onChange: (v) => updateAttributes({ k: v })
				})
			})
		] }), widget] });
	}
});
const PnJunctionBlock = defineBlock({
	key: "pn-junction",
	tag: "PnJunction",
	void: true,
	label: "Inside the diode (PN junction)",
	description: "Cross-section of a PN junction: n and p regions, the depletion region of fixed ions, and carriers flooding across under forward bias. Engine-solved diode current.",
	category: "interactive",
	schema: z.object({
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(PnJunctionLab, {
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(ConfigPanel, { children: /* @__PURE__ */ jsx(ConfigRow, {
			label: "title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: attributes.title ?? "",
				onChange: (v) => updateAttributes({ title: v }),
				placeholder: "Inside the diode",
				className: "flex-1"
			})
		}) }), widget] });
	}
});
const BjtInsideBlock = defineBlock({
	key: "bjt-inside",
	tag: "BjtInside",
	void: true,
	label: "Inside the BJT (NPN / PNP)",
	description: "Cross-section of a bipolar transistor: carriers stream emitter→thin base→collector, and a small base current controls a large collector current (β).",
	category: "interactive",
	schema: z.object({
		pnp: z.boolean().default(false),
		beta: z.number().default(100),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(BjtInsideLab, {
			pnp: attributes.pnp,
			beta: attributes.beta,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "Inside the BJT",
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "type",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: !attributes.pnp,
					onClick: () => updateAttributes({ pnp: false }),
					children: "NPN"
				}), /* @__PURE__ */ jsx(ChipToggle, {
					active: !!attributes.pnp,
					onClick: () => updateAttributes({ pnp: true }),
					children: "PNP"
				})]
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "gain β",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.beta ?? 100,
					onChange: (v) => updateAttributes({ beta: v })
				})
			})
		] }), widget] });
	}
});
const SiliconLatticeBlock = defineBlock({
	key: "silicon-lattice",
	tag: "SiliconLattice",
	void: true,
	label: "What is a semiconductor? (Si lattice + doping)",
	description: "Silicon covalent lattice: switch between pure / n-type / p-type doping and raise temperature to free electron-hole pairs. The conceptual intro to diodes, MOSFETs and BJTs.",
	category: "interactive",
	schema: z.object({
		mode: z.enum([
			"intrinsic",
			"n",
			"p"
		]).default("intrinsic"),
		temperature: z.number().default(.2),
		lockDoping: z.boolean().default(false),
		showTemperature: z.boolean().default(true),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode: editMode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(SiliconLatticeLab, {
			mode: attributes.mode,
			temperature: attributes.temperature,
			lockDoping: attributes.lockDoping,
			showTemperature: attributes.showTemperature,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (editMode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "What is a semiconductor?",
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "opens on",
				children: [
					/* @__PURE__ */ jsx(ChipToggle, {
						active: (attributes.mode ?? "intrinsic") === "intrinsic",
						onClick: () => updateAttributes({ mode: "intrinsic" }),
						children: "pure"
					}),
					/* @__PURE__ */ jsx(ChipToggle, {
						active: attributes.mode === "n",
						onClick: () => updateAttributes({ mode: "n" }),
						children: "n-type"
					}),
					/* @__PURE__ */ jsx(ChipToggle, {
						active: attributes.mode === "p",
						onClick: () => updateAttributes({ mode: "p" }),
						children: "p-type"
					})
				]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "focus on this doping (hide toggle)",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: !attributes.lockDoping,
					onClick: () => updateAttributes({ lockDoping: false }),
					children: "let learner switch"
				}), /* @__PURE__ */ jsx(ChipToggle, {
					active: !!attributes.lockDoping,
					onClick: () => updateAttributes({ lockDoping: true }),
					children: "lock"
				})]
			}),
			/* @__PURE__ */ jsxs(ConfigRow, {
				label: "temperature slider",
				children: [/* @__PURE__ */ jsx(ChipToggle, {
					active: attributes.showTemperature !== false,
					onClick: () => updateAttributes({ showTemperature: true }),
					children: "show"
				}), /* @__PURE__ */ jsx(ChipToggle, {
					active: attributes.showTemperature === false,
					onClick: () => updateAttributes({ showTemperature: false }),
					children: "hide"
				})]
			})
		] }), widget] });
	}
});
const ConductionBlock = defineBlock({
	key: "conduction",
	tag: "Conduction",
	void: true,
	label: "Why current flows (drift + Ohm's law)",
	description: "Free electrons drift through a field among fixed ion cores: the field-driven drift IS the current, and current ∝ voltage is Ohm's law from the inside.",
	category: "interactive",
	schema: z.object({
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(ConductionLab, {
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(ConfigPanel, { children: /* @__PURE__ */ jsx(ConfigRow, {
			label: "title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: attributes.title ?? "",
				onChange: (v) => updateAttributes({ title: v }),
				placeholder: "Why current flows",
				className: "flex-1"
			})
		}) }), widget] });
	}
});
const HallEffectBlock = defineBlock({
	key: "hall-effect",
	tag: "HallEffect",
	void: true,
	label: "The Hall effect (electrons vs holes)",
	description: "A current in a magnetic field deflects carriers to one edge; the sign of the Hall voltage reveals whether they are electrons (n) or holes (p). How carrier type is measured.",
	category: "interactive",
	schema: z.object({
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(HallEffectLab, {
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(ConfigPanel, { children: /* @__PURE__ */ jsx(ConfigRow, {
			label: "title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: attributes.title ?? "",
				onChange: (v) => updateAttributes({ title: v }),
				placeholder: "The Hall effect",
				className: "flex-1"
			})
		}) }), widget] });
	}
});
/** A "show" chooser shared by the labs that pair a schematic with a graph. */
function ShowRow({ value, onChange }) {
	const v = value ?? "both";
	return /* @__PURE__ */ jsxs(ConfigRow, {
		label: "show",
		children: [
			/* @__PURE__ */ jsx(ChipToggle, {
				active: v === "both",
				onClick: () => onChange("both"),
				children: "both"
			}),
			/* @__PURE__ */ jsx(ChipToggle, {
				active: v === "circuit",
				onClick: () => onChange("circuit"),
				children: "schematic"
			}),
			/* @__PURE__ */ jsx(ChipToggle, {
				active: v === "graph",
				onClick: () => onChange("graph"),
				children: "graph"
			})
		]
	});
}
const RCChargingBlock = defineBlock({
	key: "rc-charging",
	tag: "RCCharging",
	void: true,
	label: "RC charging (fill the capacitor)",
	description: "A capacitor fills through a resistor like a bucket through a pipe; the V(t) curve is the real Backward-Euler transient solve. Drag R and C to change τ = R·C, or flip to discharge.",
	category: "interactive",
	schema: z.object({
		volts: z.number().optional(),
		resistanceK: z.number().optional(),
		capacitanceU: z.number().optional(),
		show: z.enum([
			"both",
			"circuit",
			"graph"
		]).optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(RCChargingLab, {
			volts: attributes.volts,
			resistanceK: attributes.resistanceK,
			capacitanceU: attributes.capacitanceU,
			show: attributes.show,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "RC charging",
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "supply (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.volts ?? 5,
					onChange: (v) => updateAttributes({ volts: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "R (kΩ)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.resistanceK ?? 10,
					onChange: (v) => updateAttributes({ resistanceK: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "C (µF)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.capacitanceU ?? 10,
					onChange: (v) => updateAttributes({ capacitanceU: v })
				})
			}),
			/* @__PURE__ */ jsx(ShowRow, {
				value: attributes.show,
				onChange: (v) => updateAttributes({ show: v })
			})
		] }), widget] });
	}
});
const DiodeBlock = defineBlock({
	key: "diode",
	tag: "Diode",
	void: true,
	label: "Diode: a one-way valve",
	description: "Drive a diode through a resistor. Forward, past the ~0.6 V knee, the valve opens; reverse it and it blocks. The operating point is the real nonlinear (Shockley) solve. Flip orientation and predict.",
	category: "interactive",
	schema: z.object({
		volts: z.number().optional(),
		resistanceK: z.number().optional(),
		show: z.enum([
			"both",
			"circuit",
			"graph"
		]).optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(DiodeLab, {
			volts: attributes.volts,
			resistanceK: attributes.resistanceK,
			show: attributes.show,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "The diode",
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "battery (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.volts ?? 2,
					onChange: (v) => updateAttributes({ volts: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "R (kΩ)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.resistanceK ?? 1,
					onChange: (v) => updateAttributes({ resistanceK: v })
				})
			}),
			/* @__PURE__ */ jsx(ShowRow, {
				value: attributes.show,
				onChange: (v) => updateAttributes({ show: v })
			})
		] }), widget] });
	}
});
const TransistorBlock = defineBlock({
	key: "transistor",
	tag: "Transistor",
	void: true,
	label: "Transistor: a small input controls a big current",
	description: "Turn the gate voltage of an NMOS: below threshold the channel is shut, past it the gate steers a much larger drain current up the square-law transfer curve. The switch (and amplifier) at the heart of every chip.",
	category: "interactive",
	schema: z.object({
		supply: z.number().optional(),
		vth: z.number().optional(),
		loadK: z.number().optional(),
		show: z.enum([
			"both",
			"circuit",
			"graph"
		]).optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(TransistorLab, {
			supply: attributes.supply,
			vth: attributes.vth,
			loadK: attributes.loadK,
			show: attributes.show,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "The transistor",
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "supply (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.supply ?? 5,
					onChange: (v) => updateAttributes({ supply: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "threshold Vth (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.vth ?? 2,
					onChange: (v) => updateAttributes({ vth: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "load R (kΩ)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.loadK ?? 1,
					onChange: (v) => updateAttributes({ loadK: v })
				})
			}),
			/* @__PURE__ */ jsx(ShowRow, {
				value: attributes.show,
				onChange: (v) => updateAttributes({ show: v })
			})
		] }), widget] });
	}
});
const RNmosNotBlock = defineBlock({
	key: "rnmos-not",
	tag: "RNmosNot",
	void: true,
	label: "NOT from one transistor (+ pull-up)",
	description: "One NMOS and a pull-up resistor already invert: HIGH pulls the output to ground, LOW lets the resistor pull it up. Engine-solved. It also shows the static-power \"catch\" that motivated CMOS.",
	category: "interactive",
	schema: z.object({
		vdd: z.number().optional(),
		vth: z.number().optional(),
		rpull: z.number().optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(RNmosNotLab, {
			vdd: attributes.vdd,
			vth: attributes.vth,
			rpull: attributes.rpull,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "A NOT gate from one transistor",
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "VDD (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.vdd ?? 5,
					onChange: (v) => updateAttributes({ vdd: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "threshold Vth (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.vth ?? 2,
					onChange: (v) => updateAttributes({ vth: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "pull-up R (Ω)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.rpull ?? 2e3,
					onChange: (v) => updateAttributes({ rpull: v })
				})
			})
		] }), widget] });
	}
});
const CmosInverterBlock = defineBlock({
	key: "cmos-inverter",
	tag: "CmosInverter",
	void: true,
	label: "CMOS inverter (NOT gate)",
	description: "A PMOS pull-up and an NMOS pull-down share one input and output: low in → high out, high in → low out. The output voltage is engine-solved, so the transfer curve shows the real sharp transition near VDD/2.",
	category: "interactive",
	schema: z.object({
		vdd: z.number().optional(),
		vth: z.number().optional(),
		show: z.enum([
			"both",
			"circuit",
			"graph"
		]).optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(CmosInverterLab, {
			vdd: attributes.vdd,
			vth: attributes.vth,
			show: attributes.show,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "CMOS inverter",
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "VDD (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.vdd ?? 5,
					onChange: (v) => updateAttributes({ vdd: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "threshold Vth (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.vth ?? 2,
					onChange: (v) => updateAttributes({ vth: v })
				})
			}),
			/* @__PURE__ */ jsx(ShowRow, {
				value: attributes.show,
				onChange: (v) => updateAttributes({ show: v })
			})
		] }), widget] });
	}
});
const CmosNandBlock = defineBlock({
	key: "cmos-nand",
	tag: "CmosNand",
	void: true,
	label: "CMOS NAND (the universal gate)",
	description: "Four transistors: a parallel PMOS pull-up and a series NMOS pull-down make Y = (A·B)′, solved for all four inputs. NAND alone is universal, so this is the brick every gate and CPU is built from.",
	category: "interactive",
	schema: z.object({
		vdd: z.number().optional(),
		vth: z.number().optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(CmosNandLab, {
			vdd: attributes.vdd,
			vth: attributes.vth,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "CMOS NAND",
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "VDD (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.vdd ?? 5,
					onChange: (v) => updateAttributes({ vdd: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "threshold Vth (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.vth ?? 2,
					onChange: (v) => updateAttributes({ vth: v })
				})
			})
		] }), widget] });
	}
});
const CmosNorBlock = defineBlock({
	key: "cmos-nor",
	tag: "CmosNor",
	void: true,
	label: "CMOS NOR (the De Morgan twin)",
	description: "The NAND with each network swapped: series PMOS pull-up, parallel NMOS pull-down, giving Y = (A+B)′. NOR is the other universal gate, so series-vs-parallel is AND-logic-vs-OR-logic in silicon.",
	category: "interactive",
	schema: z.object({
		vdd: z.number().optional(),
		vth: z.number().optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(CmosNorLab, {
			vdd: attributes.vdd,
			vth: attributes.vth,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "CMOS NOR",
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "VDD (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.vdd ?? 5,
					onChange: (v) => updateAttributes({ vdd: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "threshold Vth (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.vth ?? 2,
					onChange: (v) => updateAttributes({ vth: v })
				})
			})
		] }), widget] });
	}
});
const BrownoutBlock = defineBlock({
	key: "brownout",
	tag: "Brownout",
	void: true,
	label: "Brown-out (supply too low → logic invalid)",
	description: "Drag the battery EMF down and the CMOS gate stops working: as VDD falls toward the transistor threshold the output loses its swing and drifts to mid-rail. Connects EMF and supply voltage to whether logic works at all.",
	category: "interactive",
	schema: z.object({
		vth: z.number().optional(),
		vmax: z.number().optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(BrownoutLab, {
			vth: attributes.vth,
			vmax: attributes.vmax,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "Brown-out",
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "threshold Vth (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.vth ?? 2,
					onChange: (v) => updateAttributes({ vth: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "max supply (V)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.vmax ?? 6,
					onChange: (v) => updateAttributes({ vmax: v })
				})
			})
		] }), widget] });
	}
});
/** All circuits lab blocks, spread into the registry in `./index.ts`. */
const circuitsBlocks = [
	CircuitLabBlock,
	CircuitBuilderBlock,
	CircuitSceneBlock,
	CircuitBlock,
	SiliconLatticeBlock,
	ConductionBlock,
	HallEffectBlock,
	PnJunctionBlock,
	MosfetInsideBlock,
	BjtInsideBlock,
	CapacitorLeakBlock,
	RCChargingBlock,
	DiodeBlock,
	TransistorBlock,
	RNmosNotBlock,
	CmosInverterBlock,
	CmosNandBlock,
	CmosNorBlock,
	BrownoutBlock
];
/** MDX tag → component render map slice for the circuits domain. */
const circuitsComponents = {
	CapacitorLeak: CapacitorLeakLab,
	Circuit: CircuitPuzzle,
	CircuitBuilder,
	CircuitLab,
	CircuitScene: CircuitSceneView,
	MosfetInside: MosfetInsideLab,
	PnJunction: PnJunctionLab,
	BjtInside: BjtInsideLab,
	SiliconLattice: SiliconLatticeLab,
	Conduction: ConductionLab,
	HallEffect: HallEffectLab,
	RCCharging: RCChargingLab,
	Diode: DiodeLab,
	Transistor: TransistorLab,
	RNmosNot: RNmosNotLab,
	CmosInverter: CmosInverterLab,
	CmosNand: CmosNandLab,
	CmosNor: CmosNorLab,
	Brownout: BrownoutLab
};

//#endregion
export { BjtInsideBlock, BrownoutBlock, CapacitorLeakBlock, CircuitBlock, CircuitBuilderBlock, CircuitLabBlock, CircuitPuzzle, CircuitSceneBlock, CircuitSceneView, CmosInverterBlock, CmosNandBlock, CmosNorBlock, ConductionBlock, DiodeBlock, HallEffectBlock, MosfetInsideBlock, PnJunctionBlock, RCChargingBlock, RNmosNotBlock, SiliconLatticeBlock, TransistorBlock, circuitsBlocks, circuitsComponents };