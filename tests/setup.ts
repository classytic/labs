/**
 * Vitest setup — runs before each test file.
 *
 * happy-dom serves documents in quirks mode, which makes KaTeX log a noisy
 * "KaTeX doesn't work in quirks mode" warning on every <Tex> render. The gallery
 * snapshot test normalises KaTeX out entirely (it judges geometry, not maths), so
 * this warning is pure log noise — drop just that one line, pass everything else
 * through untouched.
 */
const realWarn = console.warn.bind(console);
console.warn = (...args: unknown[]): void => {
  if (typeof args[0] === 'string' && args[0].includes('quirks mode')) return;
  realWarn(...args);
};
