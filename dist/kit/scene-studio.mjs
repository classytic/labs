'use client';

import { dataScene } from "./data-scene.mjs";
import { useId } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/scene-studio.tsx
/**
* SceneStudio, the no-code form that authors a {@link DataSceneSpec}: a creator picks an
* emoji or a shape + colour and gets a live preview, no render function, no JSON. It is the
* UI front of `registerDataScene`, so a skin invented entirely in-product becomes a real
* registry scene usable in any lab and listed in every picker.
*
* Controlled + self-contained (plain inputs, --stage-* tokens) so it drops into a CMS block
* OR a standalone tool. It does NOT register anything itself, the host decides when to
* `registerDataScene(spec)`; the preview is rendered straight from `dataScene(spec)`.
*/
function toFlat(s) {
	const base = {
		name: s.name,
		label: s.label ?? "",
		icon: "⭐",
		slots: 5,
		shape: "box",
		color: "#7c83ff"
	};
	if (s.kind === "count") return {
		...base,
		variant: "count",
		icon: s.icon
	};
	if ("icon" in s) return {
		...base,
		variant: "icons",
		icon: s.icon,
		slots: s.slots ?? 5
	};
	return {
		...base,
		variant: "shape",
		shape: s.shape,
		color: s.color ?? "#7c83ff"
	};
}
function toSpec(f) {
	const name = f.name.trim() || "custom";
	const label = f.label.trim() || void 0;
	if (f.variant === "count") return {
		name,
		label,
		kind: "count",
		icon: f.icon || "🔵"
	};
	if (f.variant === "icons") return {
		name,
		label,
		kind: "level",
		icon: f.icon || "⭐",
		slots: Math.max(1, Math.min(12, Math.round(f.slots)))
	};
	return {
		name,
		label,
		kind: "level",
		shape: f.shape,
		color: f.color
	};
}
const inputStyle = {
	padding: "6px 9px",
	borderRadius: 8,
	border: "1.5px solid color-mix(in oklab, var(--stage-fg) 24%, transparent)",
	background: "var(--stage-bg)",
	color: "var(--stage-fg)",
	fontSize: 14,
	width: "100%"
};
const labelStyle = {
	fontSize: 11,
	fontWeight: 700,
	color: "var(--stage-muted)",
	textTransform: "uppercase",
	letterSpacing: .4
};
function Chip({ active, onClick, children }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		onClick,
		style: {
			padding: "5px 11px",
			borderRadius: 999,
			fontWeight: 700,
			fontSize: 13,
			cursor: "pointer",
			border: `2px solid ${active ? "var(--stage-accent)" : "color-mix(in oklab, var(--stage-fg) 22%, transparent)"}`,
			background: active ? "color-mix(in oklab, var(--stage-accent) 16%, transparent)" : "transparent",
			color: "var(--stage-fg)"
		},
		children
	});
}
function SceneStudio({ spec, onChange }) {
	const f = toFlat(spec);
	const uid = useId();
	const set = (patch) => onChange(toSpec({
		...f,
		...patch
	}));
	const meta = dataScene(spec);
	const preview = f.variant === "count" ? meta.render({
		count: 6,
		highlight: 2,
		width: 150,
		height: 150
	}) : meta.render({
		frac: .6,
		width: 150,
		height: 150
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "not-prose",
		style: {
			display: "grid",
			gridTemplateColumns: "minmax(0,1fr) 170px",
			gap: 18,
			alignItems: "start",
			padding: 14,
			borderRadius: 12,
			border: "1px solid color-mix(in oklab, var(--stage-fg) 14%, transparent)"
		},
		children: [/* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gap: 12
			},
			children: [
				/* @__PURE__ */ jsxs("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: 10
					},
					children: [/* @__PURE__ */ jsxs("label", {
						style: {
							display: "grid",
							gap: 4
						},
						children: [/* @__PURE__ */ jsx("span", {
							style: labelStyle,
							children: "name (id)"
						}), /* @__PURE__ */ jsx("input", {
							style: inputStyle,
							value: f.name,
							onChange: (e) => set({ name: e.currentTarget.value }),
							placeholder: "pizza"
						})]
					}), /* @__PURE__ */ jsxs("label", {
						style: {
							display: "grid",
							gap: 4
						},
						children: [/* @__PURE__ */ jsx("span", {
							style: labelStyle,
							children: "label"
						}), /* @__PURE__ */ jsx("input", {
							style: inputStyle,
							value: f.label,
							onChange: (e) => set({ label: e.currentTarget.value }),
							placeholder: "Pizza"
						})]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					style: {
						display: "grid",
						gap: 4
					},
					children: [/* @__PURE__ */ jsx("span", {
						style: labelStyle,
						children: "type"
					}), /* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							gap: 8,
							flexWrap: "wrap"
						},
						children: [
							/* @__PURE__ */ jsx(Chip, {
								active: f.variant === "count",
								onClick: () => set({ variant: "count" }),
								children: "count of icons"
							}),
							/* @__PURE__ */ jsx(Chip, {
								active: f.variant === "icons",
								onClick: () => set({ variant: "icons" }),
								children: "icon rating"
							}),
							/* @__PURE__ */ jsx(Chip, {
								active: f.variant === "shape",
								onClick: () => set({ variant: "shape" }),
								children: "filling shape"
							})
						]
					})]
				}),
				(f.variant === "count" || f.variant === "icons") && /* @__PURE__ */ jsxs("div", {
					style: {
						display: "grid",
						gridTemplateColumns: f.variant === "icons" ? "1fr 1fr" : "1fr",
						gap: 10
					},
					children: [/* @__PURE__ */ jsxs("label", {
						style: {
							display: "grid",
							gap: 4
						},
						children: [/* @__PURE__ */ jsx("span", {
							style: labelStyle,
							children: "icon (emoji)"
						}), /* @__PURE__ */ jsx("input", {
							style: {
								...inputStyle,
								fontSize: 20
							},
							value: f.icon,
							onChange: (e) => set({ icon: [...e.currentTarget.value][0] ?? "" }),
							placeholder: "🍕"
						})]
					}), f.variant === "icons" && /* @__PURE__ */ jsxs("label", {
						style: {
							display: "grid",
							gap: 4
						},
						children: [/* @__PURE__ */ jsx("span", {
							style: labelStyle,
							children: "how many"
						}), /* @__PURE__ */ jsx("input", {
							style: inputStyle,
							type: "number",
							min: 1,
							max: 12,
							value: f.slots,
							onChange: (e) => set({ slots: Number(e.currentTarget.value) })
						})]
					})]
				}),
				f.variant === "shape" && /* @__PURE__ */ jsxs("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: 10
					},
					children: [/* @__PURE__ */ jsxs("label", {
						style: {
							display: "grid",
							gap: 4
						},
						children: [/* @__PURE__ */ jsx("span", {
							style: labelStyle,
							children: "shape"
						}), /* @__PURE__ */ jsxs("select", {
							style: inputStyle,
							value: f.shape,
							onChange: (e) => set({ shape: e.currentTarget.value }),
							children: [
								/* @__PURE__ */ jsx("option", {
									value: "box",
									children: "box"
								}),
								/* @__PURE__ */ jsx("option", {
									value: "cup",
									children: "cup"
								}),
								/* @__PURE__ */ jsx("option", {
									value: "circle",
									children: "circle (pie)"
								})
							]
						})]
					}), /* @__PURE__ */ jsxs("label", {
						style: {
							display: "grid",
							gap: 4
						},
						children: [/* @__PURE__ */ jsx("span", {
							style: labelStyle,
							children: "colour"
						}), /* @__PURE__ */ jsxs("span", {
							style: {
								display: "flex",
								gap: 6,
								alignItems: "center"
							},
							children: [/* @__PURE__ */ jsx("input", {
								id: uid,
								type: "color",
								value: /^#/.test(f.color) ? f.color : "#7c83ff",
								onChange: (e) => set({ color: e.currentTarget.value }),
								style: {
									width: 34,
									height: 34,
									padding: 0,
									border: "none",
									background: "none"
								}
							}), /* @__PURE__ */ jsx("input", {
								style: inputStyle,
								value: f.color,
								onChange: (e) => set({ color: e.currentTarget.value }),
								placeholder: "#7c83ff"
							})]
						})]
					})]
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				justifyItems: "center",
				gap: 6
			},
			children: [/* @__PURE__ */ jsx("span", {
				style: labelStyle,
				children: "preview"
			}), /* @__PURE__ */ jsx("div", {
				style: {
					minHeight: 150,
					display: "grid",
					placeItems: "center"
				},
				children: preview
			})]
		})]
	});
}

//#endregion
export { SceneStudio };