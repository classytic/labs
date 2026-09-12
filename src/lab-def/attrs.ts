/**
 * Tolerant parsing for authored block attributes.
 *
 * A lab's structured props (a vocab deck, a question list, a rows table) travel as MDX JSX
 * attributes. MDX itself accepts any JavaScript expression, so a perfectly ordinary lesson can
 * carry:
 *
 *     <WordMatch deck={{termLang:"en-US",items:[{term:"water",translation:"পানি"}]}} />
 *
 * That is valid MDX and renders correctly through the MDX compiler, but the editor's
 * MDX↔Slate round-trip reads expression attributes with `JSON.parse`, which rejects unquoted
 * keys. The value then arrives at the lab as a raw string and the lab throws ("Language deck
 * must be valid JSON") — a dead block for content that was never actually wrong.
 *
 * A second shape shows up when a structured prop was a STRING at save time: it is written as a
 * QUOTED attribute, so the JSON's own double quotes come back HTML-entity-escaped (`&#x22;`).
 *
 * `parseAuthoredValue` accepts strict JSON, entity-escaped JSON, and plain JS object-literal
 * syntax, and returns the input untouched when it is none of those — so a genuine string prop
 * is never mangled and genuinely broken data still surfaces as an error the author can see.
 */

/** Undo the entity escaping a quoted MDX attribute applies to the text inside it. */
function decodeEntities(source: string): string {
  return source
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Quote bare object keys so a JS object literal becomes JSON. Only keys immediately after `{`
 * or `,` are touched, and the result is validated by the caller's `JSON.parse`, so a false
 * positive inside a string value fails closed rather than corrupting the value.
 */
function quoteBareKeys(source: string): string {
  return source.replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":');
}

const STRUCTURED = /^\s*(?:[[{]|&#x5[BD];|&lt;)/;

/**
 * Parse an authored attribute that is meant to be structured. Returns the parsed value, or the
 * original input when it is not structured text or cannot be recovered.
 */
export function parseAuthoredValue(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  if (!STRUCTURED.test(raw)) return raw;
  const attempts = [
    (s: string) => s,
    decodeEntities,
    quoteBareKeys,
    (s: string) => quoteBareKeys(decodeEntities(s)),
  ];
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt(raw.trim())) as unknown;
    } catch {
      // try the next shape
    }
  }
  return raw;
}

/** Apply `parseAuthoredValue` to every attribute of a block node. */
export function parseAuthoredAttrs(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    const parsed = parseAuthoredValue(value);
    if (parsed !== value) out[key] = parsed;
  }
  return out;
}
