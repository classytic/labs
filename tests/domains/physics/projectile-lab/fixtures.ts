import type { ProjectileInput } from '../../../../src/domains/physics/projectile-lab/core/types.js';

/** Known projectile launches with their hand-computed range / peak / time-of-flight. */
export const launches: { name: string; input: ProjectileInput; range: number; peak: number; tof: number }[] =
  [
    {
      name: '45° · 28 m/s · g=9.8',
      input: { angleDeg: 45, speed: 28, g: 9.8 },
      range: 80.0,
      peak: 20.0,
      tof: 4.04,
    },
    {
      name: 'straight up 90° · 20 m/s · g=10',
      input: { angleDeg: 90, speed: 20, g: 10 },
      range: 0,
      peak: 20,
      tof: 4,
    },
    {
      name: '30° · 30 m/s · g=9.8',
      input: { angleDeg: 30, speed: 30, g: 9.8 },
      range: 79.53,
      peak: 11.48,
      tof: 3.06,
    },
  ];
