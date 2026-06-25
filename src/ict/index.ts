// @classytic/labs/ict — information & communication technology labs.
// Number systems (binary / octal / hex) built on image-based, "won't-forget"
// strategies: place-value odometer wheels + nibble grouping.
export {
  PlaceValueDialLab, type PlaceValueDialProps,
  BitGrouperLab, type BitGrouperProps,
  BaseOdometerLab, type BaseOdometerProps,
  DigitWheel, BitCell, WheelRow, digitChar, toDigits, maxValue, type WheelRowProps,
} from './number-systems/index.js';
