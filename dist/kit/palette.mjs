//#region src/kit/palette.ts
/**
* Categorical colour palette, theme-aware. The eight hues live as CSS custom
* properties (`--stage-cat-1`..`--stage-cat-8`) in @classytic/stage's styles.css,
* with tuned LIGHT (:root) and DARK (.dark) values, so a series/group colour
* adapts to the theme instead of being a fixed hex that only reads on one
* background. Labs import these instead of hardcoding their own hex arrays.
*
*   • SVG / CSS labs        → CATEGORICAL (var(--stage-cat-N) strings)
*   • canvas labs that read tokens via getComputedStyle().getPropertyValue()
*                           → CATEGORICAL_TOKENS (the bare custom-property names)
*
* cat-1/2/3 align with --stage-accent / --stage-accent-2 / --stage-good.
*/
const N = 8;
/** `var(--stage-cat-N)` strings — drop straight into SVG fill/stroke or CSS. */
const CATEGORICAL = Array.from({ length: N }, (_, i) => `var(--stage-cat-${i + 1})`);
/** Bare custom-property names — for canvas labs that resolve via getPropertyValue. */
const CATEGORICAL_TOKENS = Array.from({ length: N }, (_, i) => `--stage-cat-${i + 1}`);
/** The i-th categorical colour (var string), wrapping. */
const catColor = (i) => CATEGORICAL[(i % N + N) % N];
/** The i-th categorical token name (for canvas getPropertyValue), wrapping. */
const catToken = (i) => CATEGORICAL_TOKENS[(i % N + N) % N];

//#endregion
export { CATEGORICAL, catColor, catToken };