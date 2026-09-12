export interface LinearBody {
  position: number;
  speed: number;
  acceleration?: number;
  startTime?: number;
}

export interface LinearPursuitState {
  leader: LinearBody;
  chaser: LinearBody;
}

export const linearPositionAt = (body: LinearBody, time: number): number => {
  const elapsed = Math.max(0, time - (body.startTime ?? 0));
  return body.position + body.speed * elapsed + 0.5 * (body.acceleration ?? 0) * elapsed * elapsed;
};

/** First meeting at or after the chaser starts. Null means no meeting within the authored horizon. */
export function firstLinearMeeting(state: LinearPursuitState, horizon = 300): number | null {
  const start = Math.max(0, state.chaser.startTime ?? 0);
  const gap = (t: number): number => linearPositionAt(state.leader, t) - linearPositionAt(state.chaser, t);
  if (gap(start) <= 0) return start;

  const steps = 1200;
  let lo = start;
  let gLo = gap(lo);
  for (let i = 1; i <= steps; i += 1) {
    const hi = start + ((horizon - start) * i) / steps;
    const gHi = gap(hi);
    if (gLo * gHi <= 0) {
      let a = lo;
      let b = hi;
      for (let j = 0; j < 48; j += 1) {
        const mid = (a + b) / 2;
        if (gap(mid) > 0) a = mid;
        else b = mid;
      }
      return (a + b) / 2;
    }
    lo = hi;
    gLo = gHi;
  }
  return null;
}
