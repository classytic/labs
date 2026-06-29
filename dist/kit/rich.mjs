'use client';

import { Fragment } from "react";
import { Fragment as Fragment$1, jsx } from "react/jsx-runtime";
import { parseRichText } from "@classytic/stage";

//#region src/kit/rich.tsx
/**
* RichText, render `_`/`^` notation as real HTML <sub>/<sup> in lab readouts /
* control bars (the DOM counterpart of stage's SVG `<Label>`). Both share the
* ONE grammar, `parseRichText` from @classytic/stage, so "V_C" never reads as a
* dirty underscore and the parsing rule lives in a single source of truth.
*/
function RichText({ children }) {
	const spans = parseRichText(children);
	if (spans.length === 1 && spans[0].script === "base") return children;
	return /* @__PURE__ */ jsx(Fragment$1, { children: spans.map((sp, i) => sp.script === "sub" ? /* @__PURE__ */ jsx("sub", { children: sp.text }, i) : sp.script === "sup" ? /* @__PURE__ */ jsx("sup", { children: sp.text }, i) : /* @__PURE__ */ jsx(Fragment, { children: sp.text }, i)) });
}

//#endregion
export { RichText };