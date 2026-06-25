'use client';

/**
 * SexLinkedCrossLab — an X-linked gene cross (colour blindness, haemophilia…) on
 * the shared CrossGrid. The biology that's special — the Y carries no allele, so
 * males are HEMIZYGOUS (a single recessive X shows) — lives here; the grid/tally/
 * predict UI is reused. The payoff: affected sons from a carrier mother, while
 * daughters are carriers, not affected.
 */

import { useRef, useState, type ReactNode } from 'react';
import { useLearner } from '@classytic/stage';
import { CrossGrid, type CrossCell } from './grid.js';

export interface SexLinkedCrossProps {
  allele?: string;        // gene letter, e.g. "B" (X^B normal / X^b colour-blind)
  dominant?: string;      // dominant phenotype, e.g. "normal"
  recessive?: string;     // recessive phenotype, e.g. "colour-blind"
  mother?: [string, string]; // mother's two X alleles as letters, e.g. ["B","b"]
  father?: string;        // father's X allele letter, e.g. "B" (Y implied)
  predictFirst?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const SUP: Record<string, string> = { A: 'ᴬ', B: 'ᴮ', C: 'ᶜ', D: 'ᴰ', G: 'ᴳ', H: 'ᴴ', N: 'ᴺ', R: 'ᴿ', a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', g: 'ᵍ', h: 'ʰ', n: 'ⁿ', r: 'ʳ' };
const xTok = (letter: string): string => `X${SUP[letter] ?? `^${letter}`}`;

const COL = {
  domF: 'var(--stage-good)', recF: 'var(--stage-danger)',
  domM: 'var(--stage-accent)', recM: 'var(--stage-warn)',
};

export function SexLinkedCrossLab({
  allele = 'B', dominant = 'normal', recessive = 'colour-blind',
  mother = ['B', 'b'], father = 'B',
  predictFirst = true, title, prompt, objectives,
}: SexLinkedCrossProps): ReactNode {
  const L = allele;
  const XD = xTok(L.toUpperCase());
  const Xr = xTok(L.toLowerCase());
  const learner = useLearner();
  const reported = useRef(false);

  const toTok = (letter: string): string => (letter.toUpperCase() === letter ? XD : Xr);
  const [mom, setMom] = useState<[string, string]>([toTok(mother[0]), toTok(mother[1])]);
  const [dad, setDad] = useState<string>(toTok(father)); // father's X allele; Y is implied

  const gametes1 = [[mom[0]], [mom[1]]];   // mother → one X each
  const gametes2 = [[dad], ['Y']];          // father → X or Y
  const isDom = (t: string): boolean => t === XD;

  const combine = (g1: string[], g2: string[]): CrossCell => {
    const mx = g1[0]!, fx = g2[0]!;
    if (fx === 'Y') {
      const affected = !isDom(mx);
      return { genotype: `${mx}Y`, phenotype: { label: `${affected ? recessive : dominant} ♂`, color: affected ? COL.recM : COL.domM }, note: ` — males are hemizygous: one ${Xr} is enough to show ${recessive}` };
    }
    const xs = [mx, fx].sort((a, b) => (isDom(a) ? -1 : 1) - (isDom(b) ? -1 : 1));
    const domPresent = isDom(mx) || isDom(fx);
    const carrier = domPresent && (!isDom(mx) || !isDom(fx));
    return { genotype: `${xs[0]}${xs[1]}`, phenotype: { label: `${domPresent ? dominant : recessive} ♀`, color: domPresent ? COL.domF : COL.recF }, note: carrier ? ` — a carrier (one ${Xr}), ${dominant} herself but can pass it on` : '' };
  };

  const cycleMom = (i: 0 | 1): void => setMom((m) => m.map((t, j) => (j === i ? (t === XD ? Xr : XD) : t)) as [string, string]);
  const cycleDad = (): void => setDad((d) => (d === XD ? Xr : XD));
  const tokStyle = (t: string): React.CSSProperties => ({ color: isDom(t) ? 'var(--stage-good)' : 'var(--stage-danger)', fontWeight: 800 });

  const header = (
    <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Mother ♀:
        <button type="button" className="lab-chip" style={{ minWidth: 34, ...tokStyle(mom[0]) }} onClick={() => cycleMom(0)} aria-label="mother first X allele">{mom[0]}</button>
        <button type="button" className="lab-chip" style={{ minWidth: 34, ...tokStyle(mom[1]) }} onClick={() => cycleMom(1)} aria-label="mother second X allele">{mom[1]}</button>
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Father ♂:
        <button type="button" className="lab-chip" style={{ minWidth: 34, ...tokStyle(dad) }} onClick={cycleDad} aria-label="father X allele">{dad}</button>
        <span style={{ fontWeight: 800, color: 'var(--stage-muted)' }}>Y</span>
      </span>
      <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>(tap an X allele to switch {XD}/{Xr})</span>
    </div>
  );

  const legend = (
    <p style={{ fontSize: 12, color: 'var(--stage-muted)', margin: '0 0 8px' }}>
      X-linked gene: <b style={{ color: 'var(--stage-good)' }}>{XD}</b>={dominant} (dominant), <b style={{ color: 'var(--stage-danger)' }}>{Xr}</b>={recessive} (recessive). The <b>Y</b> carries no copy.
    </p>
  );

  return (
    <CrossGrid
      gametes1={gametes1}
      gametes2={gametes2}
      gameteLabel={(g) => g[0]!}
      combine={combine}
      traitLabel="phenotype & sex"
      resetKey={JSON.stringify([mom, dad])}
      predictFirst={predictFirst}
      header={header}
      legend={legend}
      title={title ?? 'Sex linkage — why mostly sons are affected'}
      prompt={prompt ?? 'The gene rides on the X. A carrier mother passes it to half her sons — who, with no second X, show it.'}
      objectives={objectives}
      showGenotypeTally
      onReveal={() => { if (!reported.current) { reported.current = true; learner?.report({ activity: 'sex-linked-cross', correct: true, score: { raw: 1, max: 1 }, completion: true }); } }}
    />
  );
}
