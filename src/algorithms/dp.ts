import type { DPTrace } from './contract.js';

/** Count monotone paths through a rows×cols grid, moving only right or down. */
export function gridPaths(rows: number, cols: number): DPTrace {
  const r = Math.max(1, Math.floor(rows));
  const c = Math.max(1, Math.floor(cols));
  const table = Array.from({ length: r }, () => Array<number>(c).fill(0));
  const events: DPTrace['events'] = [];
  for (let row = 0; row < r; row++)
    for (let col = 0; col < c; col++) {
      const dependencies: [number, number][] = [];
      if (row > 0) dependencies.push([row - 1, col]);
      if (col > 0) dependencies.push([row, col - 1]);
      const value =
        row === 0 && col === 0 ? 1 : dependencies.reduce((sum, [dr, dc]) => sum + table[dr]![dc]!, 0);
      table[row]![col] = value;
      events.push({
        type: 'set-cell',
        row,
        col,
        value,
        dependencies,
        message: dependencies.length
          ? `Cell (${row + 1}, ${col + 1}) = ${dependencies.map(([dr, dc]) => table[dr]![dc]).join(' + ')} = ${value}.`
          : 'The starting cell has one path.',
      });
    }
  return { rows: r, cols: c, table, events };
}
