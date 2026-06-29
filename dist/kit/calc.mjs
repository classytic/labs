//#region src/kit/calc.ts
/** A tiny fluent builder: calc().step('…','…').step('…').done(value). */
var Calc = class {
	_steps = [];
	step(tex, note) {
		this._steps.push(note === void 0 ? { tex } : {
			tex,
			note
		});
		return this;
	}
	done(value) {
		return {
			value,
			steps: this._steps
		};
	}
};
const calc = () => new Calc();
/** Format a number for inline LaTeX (thin-space thousands so big counts read). */
function texNum(n) {
	if (!Number.isFinite(n)) return "\\text{?}";
	return Math.abs(n) >= 1e4 ? n.toLocaleString("en-US").replace(/,/g, "{,}") : String(n);
}

//#endregion
export { Calc, calc, texNum };