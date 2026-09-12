export interface Vec3Value {
  x: number;
  y: number;
  z: number;
}
export type SpatialFieldMode = 'electric' | 'magnetic' | 'crossed';
export const cross3 = (a: Vec3Value, b: Vec3Value): Vec3Value => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export function lorentzForce3D(q: number, v: Vec3Value, e: Vec3Value, b: Vec3Value): Vec3Value {
  const c = cross3(v, b);
  return { x: q * (e.x + c.x), y: q * (e.y + c.y), z: q * (e.z + c.z) };
}
const add = (a: Vec3Value, b: Vec3Value, s = 1): Vec3Value => ({
  x: a.x + b.x * s,
  y: a.y + b.y * s,
  z: a.z + b.z * s,
});
/** RK4 trajectory for constant fields, in normalized teaching units. */
export function traceLorentz(
  q: number,
  m: number,
  v0: Vec3Value,
  e: Vec3Value,
  b: Vec3Value,
  steps = 180,
  dt = 0.025,
): Vec3Value[] {
  let p = { x: 0, y: 0, z: 0 },
    v = { ...v0 };
  const out = [p];
  for (let i = 0; i < steps; i++) {
    const a = (x: Vec3Value) => {
      const f = lorentzForce3D(q, x, e, b);
      return { x: f.x / m, y: f.y / m, z: f.z / m };
    };
    const k1 = a(v),
      k2 = a(add(v, k1, dt / 2)),
      k3 = a(add(v, k2, dt / 2)),
      k4 = a(add(v, k3, dt));
    v = add(
      v,
      {
        x: (k1.x + 2 * k2.x + 2 * k3.x + k4.x) / 6,
        y: (k1.y + 2 * k2.y + 2 * k3.y + k4.y) / 6,
        z: (k1.z + 2 * k2.z + 2 * k3.z + k4.z) / 6,
      },
      dt,
    );
    p = add(p, v, dt);
    out.push(p);
  }
  return out;
}
export function fieldsFor(mode: SpatialFieldMode, strength: number): { e: Vec3Value; b: Vec3Value } {
  return {
    e: mode === 'magnetic' ? { x: 0, y: 0, z: 0 } : { x: 0, y: strength, z: 0 },
    b: mode === 'electric' ? { x: 0, y: 0, z: 0 } : { x: 0, y: 0, z: strength },
  };
}
