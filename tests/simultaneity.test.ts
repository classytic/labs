import { describe, expect, it } from 'vitest';
import { simultaneityState } from '../src/physics/modern/relativity/simultaneity-core.js';
describe('relativity of simultaneity', () => {
  it('keeps platform flashes simultaneous', () =>
    expect(simultaneityState(0.6).platform.deltaTimeNs).toBe(0));
  it('orders the front flash earlier for rightward motion', () => {
    const s = simultaneityState(0.6, 300);
    expect(s.firstInTrain).toBe('right');
    expect(s.train.deltaTimeNs).toBeLessThan(0);
  });
  it('reverses order with velocity', () => expect(simultaneityState(-0.6).firstInTrain).toBe('left'));
  it('scales with separation and vanishes at rest', () => {
    expect(simultaneityState(0).train.deltaTimeNs).toBeCloseTo(0);
    expect(Math.abs(simultaneityState(0.5, 600).train.deltaTimeNs)).toBeCloseTo(
      2 * Math.abs(simultaneityState(0.5, 300).train.deltaTimeNs),
    );
  });
});
