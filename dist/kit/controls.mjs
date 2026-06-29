'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/controls.tsx
/**
* The `.lab-*` control CSS now SHIPS in `@classytic/labs/styles.css` (imported by
* the host), instead of being injected at runtime. `LabStyles` is a no-op kept
* for back-compat with presets that still render `<LabStyles/>`.
* @deprecated import `@classytic/labs/styles.css` once in your global CSS instead.
*/
function LabStyles() {
	return null;
}
function Stepper({ value, onChange, min = 0, max = 99, step = 1, label }) {
	return /* @__PURE__ */ jsxs("span", {
		className: "lab-stepper",
		role: "group",
		"aria-label": label,
		children: [
			/* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": `decrease${label ? " " + label : ""}`,
				onClick: () => onChange(Math.max(min, value - step)),
				children: "−"
			}),
			/* @__PURE__ */ jsx("b", { children: value }),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": `increase${label ? " " + label : ""}`,
				onClick: () => onChange(Math.min(max, value + step)),
				children: "+"
			})
		]
	});
}
function CheckButton({ onClick, disabled, children = "Check" }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		className: "lab-btn",
		onClick,
		disabled,
		children
	});
}
function StatusPill({ ok, children }) {
	return /* @__PURE__ */ jsx("span", {
		className: "lab-pill",
		"data-state": ok ? "ok" : "no",
		children
	});
}
function Chip({ selected, onClick, children, ...a11y }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		className: "lab-chip",
		"data-sel": selected,
		onClick,
		...a11y,
		children
	});
}
function Slider(props) {
	const pct = props.max > props.min ? Math.max(0, Math.min(100, (props.value - props.min) / (props.max - props.min) * 100)) : 0;
	const fill = `linear-gradient(to right, var(--primary, oklch(0.59 0.22 261)) 0 ${pct}%, color-mix(in oklab, currentColor 20%, transparent) ${pct}% 100%)`;
	return /* @__PURE__ */ jsx("input", {
		type: "range",
		className: "lab-slider",
		value: props.value,
		min: props.min,
		max: props.max,
		step: props.step,
		"aria-label": props.ariaLabel,
		onChange: (e) => props.onChange(Number(e.currentTarget.value)),
		style: {
			background: fill,
			...props.style
		}
	});
}

//#endregion
export { CheckButton, Chip, LabStyles, Slider, StatusPill, Stepper };