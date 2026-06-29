'use client';

import { jsx } from "react/jsx-runtime";

//#region src/language/icon.tsx
const SVG_ICONS = /* @__PURE__ */ new Map();
/** Register an inline-SVG icon so `{ kind:'svg', id }` resolves to it. */
function registerLabIcon(id, render) {
	SVG_ICONS.set(id, render);
}
/** Normalise any accepted value to an `IconRef` (or null when empty). */
function normalizeIcon(v) {
	if (v == null || v === "") return null;
	return typeof v === "string" ? {
		kind: "emoji",
		id: v,
		alt: ""
	} : v;
}
/** Render an `IconValue`: emoji span, inline SVG (registry), or <img>. */
function Icon({ icon, size = 36, className, style, decorative }) {
	const ref = normalizeIcon(icon);
	if (!ref) return null;
	const labelled = !decorative && !!ref.alt;
	const a11y = labelled ? {
		role: "img",
		"aria-label": ref.alt
	} : { "aria-hidden": true };
	if (ref.kind === "image" && ref.src) return /* @__PURE__ */ jsx("img", {
		src: ref.src,
		alt: labelled ? ref.alt : "",
		className,
		width: size,
		height: size,
		loading: "lazy",
		decoding: "async",
		style: {
			objectFit: "contain",
			...style
		}
	});
	if (ref.kind === "svg" && ref.id) {
		const render = SVG_ICONS.get(ref.id);
		if (render) return /* @__PURE__ */ jsx("span", {
			className,
			style: {
				display: "inline-flex",
				...style
			},
			...a11y,
			children: render({
				size,
				title: labelled ? ref.alt : void 0
			})
		});
	}
	const char = ref.kind === "emoji" ? ref.id ?? ref.src ?? "" : ref.alt;
	return /* @__PURE__ */ jsx("span", {
		className,
		style: {
			...className ? null : {
				fontSize: size,
				lineHeight: 1
			},
			...style
		},
		...a11y,
		children: char
	});
}

//#endregion
export { Icon, normalizeIcon, registerLabIcon };