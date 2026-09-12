'use client';

/** Bohr-atom runtime — adapter: coerce protons + title (a raw MDX attr may be missing). */
import type { ReactNode } from 'react';
import { BohrAtom } from '../../../chem/bohr-atom.js';

export default function BohrAtomRuntime(a: Record<string, unknown>): ReactNode {
  return (
    <BohrAtom
      protons={typeof a.protons === 'number' ? a.protons : 6}
      title={(a.title as string) ?? 'Bohr model of the atom'}
    />
  );
}
