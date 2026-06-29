'use client';

import { Component, createElement, useEffect, useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/blocks/lab-gallery.tsx
/**
* LabGallery, the visual lab PICKER primitive. Instead of a 80-item slash menu,
* a host shows ONE "Insert lab" affordance that opens this gallery in a sheet: a
* searchable, domain-grouped grid where each card is a LIVE mini-preview of the lab
* (the block spec rendered in `preview` mode with default props), mounted lazily as
* it scrolls into view. Picking a card calls `onPick(item)`, the host then inserts
* that lab's concrete block. Editor-agnostic: it only needs the block metadata +
* each spec's render `Component`.
*/
/** Isolate a single preview so one lab that throws can't take down the gallery. */
var PreviewBoundary = class extends Component {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	render() {
		if (this.state.failed) return /* @__PURE__ */ jsx("div", {
			style: {
				display: "grid",
				placeItems: "center",
				height: "100%",
				color: "var(--stage-muted)",
				fontSize: 12
			},
			children: "preview unavailable"
		});
		return this.props.children;
	}
};
function LivePreview({ item }) {
	const ref = useRef(null);
	const [show, setShow] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el || show) return;
		if (typeof IntersectionObserver === "undefined") {
			setShow(true);
			return;
		}
		const io = new IntersectionObserver((es) => {
			if (es.some((e) => e.isIntersecting)) {
				setShow(true);
				io.disconnect();
			}
		}, { rootMargin: "250px" });
		io.observe(el);
		return () => io.disconnect();
	}, [show]);
	return /* @__PURE__ */ jsx("div", {
		ref,
		"aria-hidden": true,
		style: {
			pointerEvents: "none",
			height: 150,
			overflow: "hidden",
			borderRadius: 10,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: show ? /* @__PURE__ */ jsx(PreviewBoundary, { children: createElement(item.Component, {
			attributes: item.defaults ?? {},
			mode: "preview"
		}) }) : /* @__PURE__ */ jsx("div", {
			style: {
				display: "grid",
				placeItems: "center",
				height: "100%",
				color: "var(--stage-muted)",
				fontSize: 12
			},
			children: "preview…"
		})
	});
}
function LabGallery({ blocks, onPick }) {
	const [q, setQ] = useState("");
	const [group, setGroup] = useState(null);
	const groups = useMemo(() => [...new Set(blocks.map((b) => b.group ?? "Other"))].sort(), [blocks]);
	const ql = q.trim().toLowerCase();
	const items = blocks.filter((b) => (!group || (b.group ?? "Other") === group) && (!ql || `${b.label} ${b.description ?? ""} ${b.group ?? ""}`.toLowerCase().includes(ql)));
	return /* @__PURE__ */ jsxs("div", {
		className: "lab-gallery",
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 12,
			minHeight: 200
		},
		children: [
			/* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					flexWrap: "wrap",
					gap: 8,
					alignItems: "center"
				},
				children: /* @__PURE__ */ jsx("input", {
					className: "lab-input",
					value: q,
					placeholder: "Search labs…",
					"aria-label": "search labs",
					onChange: (e) => setQ(e.currentTarget.value),
					style: { flex: "1 1 200px" }
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					flexWrap: "wrap",
					gap: 6
				},
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "lab-choice",
					"data-picked": group === null || void 0,
					onClick: () => setGroup(null),
					children: "All"
				}), groups.map((g) => /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "lab-choice",
					"data-picked": group === g || void 0,
					onClick: () => setGroup((c) => c === g ? null : g),
					children: g
				}, g))]
			}),
			items.length === 0 ? /* @__PURE__ */ jsxs("p", {
				style: {
					color: "var(--stage-muted)",
					fontSize: 13,
					padding: "24px 0",
					textAlign: "center"
				},
				children: [
					"No labs match “",
					q,
					"”."
				]
			}) : /* @__PURE__ */ jsx("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
					gap: 12
				},
				children: items.map((b) => /* @__PURE__ */ jsxs("div", {
					role: "button",
					tabIndex: 0,
					onClick: () => onPick?.(b),
					onKeyDown: (e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							onPick?.(b);
						}
					},
					className: "lab-gallery-card",
					"aria-label": `Insert ${b.label}`,
					style: {
						display: "flex",
						flexDirection: "column",
						gap: 6,
						textAlign: "left",
						padding: 10,
						borderRadius: 12,
						border: "1px solid var(--border, color-mix(in oklab, currentColor 16%, transparent))",
						background: "var(--card, transparent)",
						cursor: "pointer"
					},
					children: [
						/* @__PURE__ */ jsx(LivePreview, { item: b }),
						/* @__PURE__ */ jsx("span", {
							style: {
								fontWeight: 700,
								fontSize: 13.5
							},
							children: b.label
						}),
						b.description && /* @__PURE__ */ jsx("span", {
							style: {
								fontSize: 12,
								color: "var(--stage-muted, color-mix(in oklab, currentColor 55%, transparent))",
								lineHeight: 1.35
							},
							children: b.description
						}),
						b.group && /* @__PURE__ */ jsx("span", {
							style: {
								fontSize: 10,
								fontWeight: 700,
								letterSpacing: ".04em",
								textTransform: "uppercase",
								color: "var(--stage-muted)"
							},
							children: b.group
						})
					]
				}, b.key))
			})
		]
	});
}

//#endregion
export { LabGallery };