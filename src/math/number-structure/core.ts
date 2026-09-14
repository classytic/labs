export type NumberStructureMode = 'factor-array' | 'prime-tree' | 'gcd' | 'lcm' | 'divisibility';
export type FactorSplitStrategy = 'smallest' | 'balanced';
export interface FactorTreeNode { value:number; prime:boolean; left?:FactorTreeNode; right?:FactorTreeNode }

export interface FactorPair { rows: number; columns: number }
export interface PrimePower { prime: number; exponentA: number; exponentB: number; gcdExponent: number; lcmExponent: number }

export function divisors(value: number): number[] {
  const n = Math.max(1, Math.trunc(Math.abs(value)));
  return Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
}

export function factorPairs(value: number): FactorPair[] {
  const n = Math.max(1, Math.trunc(Math.abs(value)));
  const result: FactorPair[] = [];
  for (let rows = 1; rows * rows <= n; rows += 1) {
    if (n % rows === 0) result.push({ rows, columns: n / rows });
  }
  return result;
}

export function isPrime(value: number): boolean {
  const n = Math.trunc(value);
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d += 1) if (n % d === 0) return false;
  return true;
}

export function primeFactors(value: number): number[] {
  let n = Math.max(1, Math.trunc(Math.abs(value)));
  const result: number[] = [];
  for (let d = 2; d * d <= n; d += 1) {
    while (n % d === 0) { result.push(d); n /= d; }
  }
  if (n > 1) result.push(n);
  return result;
}

export function factorTree(value:number, strategy:FactorSplitStrategy='balanced'):FactorTreeNode {
  const n=Math.max(2,Math.trunc(value));
  if (isPrime(n)) return {value:n,prime:true};
  const pairs=factorPairs(n).filter(pair=>pair.rows>1);
  const pair=strategy==='smallest'?pairs[0]:pairs.at(-1);
  if (!pair) return {value:n,prime:true};
  return {value:n,prime:false,left:factorTree(pair.rows,strategy),right:factorTree(pair.columns,strategy)};
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y) [x, y] = [y, x % y];
  return x;
}

export function lcm(a: number, b: number): number {
  const x = Math.abs(Math.trunc(a));
  const y = Math.abs(Math.trunc(b));
  return x && y ? (x / gcd(x, y)) * y : 0;
}

function counts(value: number): Map<number, number> {
  const result = new Map<number, number>();
  for (const p of primeFactors(value)) result.set(p, (result.get(p) ?? 0) + 1);
  return result;
}

export function primePowers(a: number, b: number): PrimePower[] {
  const ca = counts(a), cb = counts(b);
  return [...new Set([...ca.keys(), ...cb.keys()])].sort((x, y) => x - y).map((prime) => {
    const exponentA = ca.get(prime) ?? 0, exponentB = cb.get(prime) ?? 0;
    return { prime, exponentA, exponentB, gcdExponent: Math.min(exponentA, exponentB), lcmExponent: Math.max(exponentA, exponentB) };
  });
}

export function arrayState(value: number, rows: number) {
  const n = Math.max(2, Math.trunc(value));
  const r = Math.max(1, Math.min(n, Math.trunc(rows)));
  return { rows: r, columns: Math.floor(n / r), placed: n - (n % r), remainder: n % r, exact: n % r === 0 };
}

export function divisibilityEvidence(value: number) {
  const digits = String(Math.abs(Math.trunc(value))).split('').map(Number);
  const digitSum = digits.reduce((sum, digit) => sum + digit, 0);
  const last = digits.at(-1) ?? 0;
  const lastTwo = Number(digits.slice(-2).join(''));
  return [
    { divisor: 2, works: last % 2 === 0, reason: `last digit ${last} is ${last % 2 === 0 ? '' : 'not '}even` },
    { divisor: 3, works: digitSum % 3 === 0, reason: `digit sum ${digitSum} is ${digitSum % 3 === 0 ? '' : 'not '}a multiple of 3` },
    { divisor: 5, works: last === 0 || last === 5, reason: `last digit is ${last}` },
    { divisor: 9, works: digitSum % 9 === 0, reason: `digit sum is ${digitSum}` },
    { divisor: 10, works: last === 0, reason: `last digit is ${last}` },
    { divisor: 4, works: lastTwo % 4 === 0, reason: `last two digits make ${lastTwo}` },
  ];
}
