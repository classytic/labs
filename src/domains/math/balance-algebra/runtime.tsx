'use client';

/** Balance-algebra runtime — adapter: default the equation coefficients + answer. */
import type { ReactNode } from 'react';
import { BalanceAlgebraLab } from '../../../math/balance-algebra/index.js';

export default function BalanceAlgebra(a: Record<string, unknown>): ReactNode {
  return (
    <BalanceAlgebraLab
      coef={typeof a.coef === 'number' ? a.coef : 2}
      addend={typeof a.addend === 'number' ? a.addend : 1}
      rhs={typeof a.rhs === 'number' ? a.rhs : 7}
      answer={typeof a.answer === 'number' ? a.answer : 3}
      controlId={a.controlId as string | undefined}
    />
  );
}
