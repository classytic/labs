'use client';

import { Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { CycleDiagram, edgeKey } from "../../kit/cycle.mjs";
import { WATER_CYCLE } from "../cycles.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/geography/cycle-lab/preset.tsx
/**
* CycleLab, ONE authorable lab for every cycle (water, rock, carbon, nitrogen,
* food chains…). The creator/agent declares the model (nodes + process-labelled
* edges) and a challenge; the shared CycleDiagram renders it. Not a bespoke
* WaterCycle/RockCycle widget, the cycle is data.
*
*  • challenge='trace', click a stage; its outgoing arrows + the processes that
*    drive them light up. The branched rock/carbon cycles reveal that you don't
*    have to go all the way around, any rock can melt or re-weather.
*  • challenge='label-process', the process names are stripped off the arrows
*    into a tray; match each one to the transition it drives. That IS the IGCSE
*    skill, and it's unambiguous (clean rings like the water cycle).
*
* Tokenized, reduced-motion safe (all motion is click-driven), agent-drivable.
*/
const hash = (s) => {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
	return h >>> 0;
};
function CycleLab({ nodes = WATER_CYCLE.nodes, edges = WATER_CYCLE.edges, challenge = "label-process", size = 340, title = "The water cycle", prompt, objectives }) {
	if (challenge === "trace") return /* @__PURE__ */ jsx(TraceCycle, {
		nodes,
		edges,
		size,
		title,
		prompt,
		objectives,
		activity: "cycle-trace"
	});
	return /* @__PURE__ */ jsx(LabelProcess, {
		nodes,
		edges,
		size,
		title,
		prompt,
		objectives,
		hash,
		activity: "cycle-label"
	});
}
function TraceCycle({ nodes, edges, size, title, prompt, objectives, activity }) {
	const [active, setActive] = useState(null);
	const [seen, setSeen] = useState(/* @__PURE__ */ new Set());
	const [reported, setReported] = useState(false);
	useCheckpoint({
		solved: reported,
		activity
	});
	const labelOf = (id) => nodes.find((n) => n.id === id)?.label ?? "";
	const out = active ? edges.filter((e) => e.from === active) : [];
	const click = (id) => {
		setActive(id);
		setSeen((s) => {
			const next = new Set(s).add(id);
			if (next.size >= nodes.length) setReported(true);
			return next;
		});
	};
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: 8
		},
		children: /* @__PURE__ */ jsx(CycleDiagram, {
			nodes,
			edges,
			size,
			activeId: active,
			onNodeClick: click,
			ariaLabel: `${title}: a cycle diagram with ${nodes.length} stages (${nodes.map((nd) => nd.label).join(", ")}) connected by labelled process arrows. Activate a stage to trace its outgoing transitions and the processes that drive them.`
		})
	}), /* @__PURE__ */ jsx(LiveRegion, { children: active ? `${labelOf(active)} leads to ${out.map((e) => `${labelOf(e.to)} by ${e.label}`).join(", ") || "nothing further"}.` : "" })] });
	const footer = /* @__PURE__ */ jsxs("div", {
		className: "lab-bar",
		style: {
			flexWrap: "wrap",
			gap: 10,
			minHeight: 30
		},
		children: [active ? out.length ? out.map((e) => /* @__PURE__ */ jsxs("span", {
			style: { fontSize: 13 },
			children: [
				/* @__PURE__ */ jsx("b", {
					style: { color: "var(--stage-accent)" },
					children: labelOf(active)
				}),
				/* @__PURE__ */ jsxs("span", {
					style: { color: "var(--stage-muted)" },
					children: [
						" , ",
						e.label,
						"→ "
					]
				}),
				/* @__PURE__ */ jsx("b", { children: labelOf(e.to) })
			]
		}, edgeKey(e))) : /* @__PURE__ */ jsxs("span", {
			style: { color: "var(--stage-muted)" },
			children: [labelOf(active), " is an end of this path here."]
		}) : /* @__PURE__ */ jsx("span", {
			style: { color: "var(--stage-muted)" },
			children: "Tap a stage to begin."
		}), /* @__PURE__ */ jsxs(StatusPill, {
			ok: seen.size >= nodes.length,
			children: [
				seen.size,
				"/",
				nodes.length,
				" stages traced"
			]
		})]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: prompt ?? "Click each stage to trace where it goes, and which process drives the change.",
		objectives,
		footer,
		children: figure
	});
}
function LabelProcess({ nodes, edges, size, title, prompt, objectives, hash: h, activity }) {
	const labelEdges = useMemo(() => edges.filter((e) => e.label), [edges]);
	const trueLabel = useMemo(() => Object.fromEntries(labelEdges.map((e) => [edgeKey(e), e.label])), [labelEdges]);
	const allLabels = useMemo(() => [...new Set(labelEdges.map((e) => e.label))].sort((a, b) => h(a) - h(b)), [labelEdges, h]);
	const [assign, setAssign] = useState({});
	const [sel, setSel] = useState(null);
	const correct = (k) => assign[k] === trueLabel[k];
	const placed = labelEdges.filter((e) => correct(edgeKey(e))).map((e) => assign[edgeKey(e)]);
	const pool = allLabels.filter((l) => !placed.includes(l));
	const solvedCount = labelEdges.filter((e) => correct(edgeKey(e))).length;
	const solved = solvedCount === labelEdges.length;
	useCheckpoint({
		solved: solved && pool.length === 0,
		activity
	});
	const onSlot = (key) => {
		if (correct(key)) {
			setAssign((a) => ({
				...a,
				[key]: null
			}));
			return;
		}
		if (!sel) return;
		setAssign((a) => ({
			...a,
			[key]: sel
		}));
		setSel(null);
	};
	const edgeSlot = (_e, key, mid) => {
		const val = assign[key];
		const ok = val != null && val === trueLabel[key];
		const bad = val != null && !ok;
		const w = (val ? val.length * 5.7 : 16) + 16;
		const stroke = ok ? "var(--stage-good)" : bad ? "var(--stage-danger)" : "var(--stage-grid)";
		const fill = ok ? "var(--stage-good)" : bad ? "var(--stage-danger)" : "var(--stage-muted)";
		return /* @__PURE__ */ jsxs("g", {
			onClick: () => onSlot(key),
			onKeyDown: (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSlot(key);
				}
			},
			style: { cursor: "pointer" },
			role: "button",
			tabIndex: 0,
			"aria-label": val ? `${val}, ${ok ? "correctly matched, activate to take it back" : "incorrect, activate to clear"}` : sel ? `Empty process slot, activate to place ${sel} here` : "Empty process slot, pick a process first, then activate to place it here",
			children: [/* @__PURE__ */ jsx("rect", {
				x: Math.round(mid.x - w / 2),
				y: mid.y - 10,
				width: Math.round(w),
				height: 20,
				rx: 10,
				fill: "var(--stage-bg)",
				stroke,
				strokeWidth: 1.6
			}), /* @__PURE__ */ jsx("text", {
				x: mid.x,
				y: mid.y,
				fontSize: 10.5,
				fontWeight: 700,
				textAnchor: "middle",
				dominantBaseline: "central",
				fill,
				children: val ?? "?"
			})]
		});
	};
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
		style: {
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: 8
		},
		children: /* @__PURE__ */ jsx(CycleDiagram, {
			nodes,
			edges,
			size,
			edgeSlot,
			ariaLabel: `${title}: a cycle diagram with ${nodes.length} stages (${nodes.map((nd) => nd.label).join(", ")}) and ${labelEdges.length} arrows whose process labels have been removed. Pick a process from the tray, then activate the arrow slot it drives to match it.`
		})
	}), /* @__PURE__ */ jsx(LiveRegion, { children: solved ? "All processes matched correctly." : `${solvedCount} of ${labelEdges.length} processes matched.` })] });
	const controls = /* @__PURE__ */ jsx(ControlBar, { children: /* @__PURE__ */ jsx(Field, {
		label: "processes",
		children: /* @__PURE__ */ jsx("span", {
			style: {
				display: "flex",
				flexWrap: "wrap",
				gap: 8
			},
			children: pool.length ? pool.map((l) => /* @__PURE__ */ jsx(Chip, {
				selected: sel === l,
				onClick: () => setSel((s) => s === l ? null : l),
				children: l
			}, l)) : /* @__PURE__ */ jsx("span", {
				style: {
					color: "var(--stage-good)",
					fontWeight: 700
				},
				children: "All processes placed ✓"
			})
		})
	}) });
	const footer = /* @__PURE__ */ jsxs(StatusPill, {
		ok: solved,
		children: [
			solvedCount,
			"/",
			labelEdges.length,
			" correct"
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt: prompt ?? "Pick a process, then tap the arrow it drives. Green locks it in; tap a locked one to take it back.",
		objectives,
		controls,
		footer,
		children: figure
	});
}

//#endregion
export { CycleLab };