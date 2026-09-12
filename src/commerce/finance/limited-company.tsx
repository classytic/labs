'use client';

/**
 * LimitedCompanyLab — why people form a limited company: LIMITED LIABILITY. A
 * business fails owing money; its own assets are sold to pay creditors, and any
 * shortfall is where the structure matters. A SOLE TRADER is personally liable — the
 * shortfall comes out of their own home and savings. A LIMITED COMPANY is a separate
 * legal person — shareholders lose only what they put in; personal assets are
 * protected and creditors absorb the rest. Toggle the structure and watch the
 * owner's personal exposure switch between "at risk" and "protected".
 *
 * Authorable (the amounts, currency, owner label), predict-first, curriculum-neutral.
 * Interactive, no loop.
 */

import { useState, type ReactNode } from 'react';
import { Slider, Segmented } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { EvidencePanel, MetricList, ScenarioTimeline } from '../activity.js';

export interface LimitedCompanyProps {
  businessAssets?: number;
  businessDebt?: number;
  personalAssets?: number;
  structure?: 'sole' | 'ltd';
  currency?: string;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const W = 660,
  H = 240;
const GOOD = 'var(--stage-good, #16a34a)';
const BAD = 'var(--stage-danger, #e03131)';

const CHALLENGE: AuthoredChoiceQuestion[] = [
  {
    id: 'ltd',
    prompt: 'If a limited company goes bust owing money, its shareholders lose…',
    choices: [
      { value: 'invest', label: 'only what they invested' },
      { value: 'all', label: 'their homes and savings too' },
      { value: 'nothing', label: 'nothing at all' },
    ],
    answer: 'invest',
    explain:
      'Limited liability: the company is a separate legal person, so shareholders can only lose their shares, personal assets are safe.',
  },
  {
    id: 'sole',
    prompt: 'A sole trader is personally liable for…',
    choices: [
      { value: 'alldebt', label: 'all of the business’s debts' },
      { value: 'half', label: 'half the debts' },
      { value: 'none', label: 'none of the debts' },
    ],
    answer: 'alldebt',
    explain:
      'A sole trader and the business are the same in law, unpaid business debts come out of personal assets.',
  },
];
const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Predict the exposure',
    lead: 'Decide what shareholders can lose before opening the failure case.',
    success: 'liability-forecast',
  },
  {
    id: 'trace',
    phase: 'observe',
    title: 'Trace the creditor shortfall',
    lead: 'Follow debt through business assets to the unpaid balance.',
    reveal: ['scenario'],
  },
  {
    id: 'compare',
    phase: 'act',
    title: 'Compare both structures',
    lead: 'Switch between sole trader and limited company and inspect both outcomes.',
    controls: true,
    success: 'both-structures',
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain personal liability',
    lead: 'Explain why the sole trader carries the remaining debt.',
    success: 'sole-explanation',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Stress-test creditor recovery',
    lead: 'Change debt and asset values, then compare the new outcomes.',
    reveal: ['transfer'],
    controls: true,
  },
];

export function LimitedCompanyLab({
  businessAssets = 30000,
  businessDebt = 50000,
  personalAssets = 80000,
  structure: structure0 = 'sole',
  currency = '$',
  title = 'Limited liability, sole trader vs limited company',
  prompt = 'The business fails owing money. Who pays the shortfall, the owner personally, or not? Toggle the structure.',
  objectives = [
    'See a business pay creditors from its own assets first',
    'Sole trader: the owner is personally liable for the shortfall',
    'Limited company: shareholders lose only their investment (limited liability)',
  ],
}: LimitedCompanyProps = {}): ReactNode {
  const [structure, setStructure] = useState<'sole' | 'ltd'>(structure0);
  const [assets, setAssets] = useState(businessAssets);
  const [debt, setDebt] = useState(businessDebt);
  const [personal, setPersonal] = useState(personalAssets);
  const [viewed, setViewed] = useState(() => ({ sole: structure0 === 'sole', ltd: structure0 === 'ltd' }));

  const shortfall = Math.max(0, debt - assets);
  const isSole = structure === 'sole';
  const personalLoss = isSole ? Math.min(shortfall, personal) : 0;
  const fmt = (n: number): string => `${currency}${Math.round(n).toLocaleString('en-US')}`;
  const scale = Math.max(debt, assets, 1);
  const BX = 40,
    BW = 360;
  const bar = (v: number): number => (v / scale) * BW;
  const compareStructure = (next: 'sole' | 'ltd', complete?: AuthoredActivityContext['complete']): void => {
    setStructure(next);
    const updated = { ...viewed, [next]: true };
    setViewed(updated);
    if (updated.sole && updated.ltd) complete?.('both-structures', next);
  };

  const figure = (
    <div className="commerce-scene-frame">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`${isSole ? 'Sole trader' : 'Limited company'}; personal loss ${fmt(personalLoss)}`}
      >
        {/* the business */}
        <text x={BX} y={26} fontSize={12} fontWeight={700} fill="var(--stage-fg)">
          The business fails
        </text>
        <text x={BX} y={52} fontSize={11} fill="var(--stage-muted)">
          owes creditors
        </text>
        <rect x={BX} y={58} width={bar(debt)} height={26} rx={4} fill={BAD} opacity={0.85} />
        <text x={BX + 8} y={76} fontSize={12} fontWeight={700} fill="#fff">
          {fmt(debt)}
        </text>
        <text x={BX} y={106} fontSize={11} fill="var(--stage-muted)">
          can pay from its own assets
        </text>
        <rect x={BX} y={112} width={bar(assets)} height={26} rx={4} fill={GOOD} opacity={0.85} />
        <text x={BX + 8} y={130} fontSize={12} fontWeight={700} fill="#fff">
          {fmt(assets)}
        </text>
        {shortfall > 0 && (
          <>
            <rect
              x={BX + bar(assets)}
              y={112}
              width={bar(shortfall)}
              height={26}
              rx={4}
              fill="none"
              stroke={BAD}
              strokeWidth={2}
              strokeDasharray="4 3"
            />
            <text
              x={BX + bar(assets) + bar(shortfall) / 2}
              y={158}
              textAnchor="middle"
              fontSize={10.5}
              fontWeight={700}
              fill={BAD}
            >
              shortfall {fmt(shortfall)}
            </text>
          </>
        )}

        {/* the owner's personal assets */}
        <text x={470} y={26} fontSize={12} fontWeight={700} fill="var(--stage-fg)">
          Owner’s home &amp; savings
        </text>
        <rect
          x={470}
          y={40}
          width={150}
          height={90}
          rx={10}
          fill={isSole && personalLoss > 0 ? BAD : GOOD}
          opacity={0.14}
          stroke={isSole && personalLoss > 0 ? BAD : GOOD}
          strokeWidth={2}
        />
        <g
          transform="translate(515 52)"
          stroke={isSole && personalLoss > 0 ? BAD : GOOD}
          strokeWidth={2.5}
          fill="none"
          strokeLinejoin="round"
        >
          <path d="M4 24V12L30 0l26 12v30H4Z" />
          <path d="M22 42V27h16v15" />
          {!isSole && (
            <path
              d="M30 6c9 4 14 5 14 5v11c0 10-6 17-14 21-8-4-14-11-14-21V11s5-1 14-5Z"
              fill="var(--stage-bg)"
            />
          )}
          {isSole && personalLoss > 0 && <path d="M58 4v23M58 35v2" />}
        </g>
        <text x={545} y={104} textAnchor="middle" fontSize={11} fill="var(--stage-muted)">
          {fmt(personal)}
        </text>
        <text
          x={545}
          y={150}
          textAnchor="middle"
          fontSize={12}
          fontWeight={800}
          fill={isSole && personalLoss > 0 ? BAD : GOOD}
        >
          {isSole ? (personalLoss > 0 ? `lose ${fmt(personalLoss)}` : 'safe (no shortfall)') : 'protected'}
        </text>
        <text x={545} y={168} textAnchor="middle" fontSize={9.5} fill="var(--stage-muted)">
          {isSole ? 'personally liable' : 'limited liability'}
        </text>
      </svg>
    </div>
  );

  const evidence = (
    <>
      <EvidencePanel title="Failure evidence">
        <MetricList
          items={[
            { label: 'Creditor claim', value: fmt(debt) },
            { label: 'Recovered from business', value: fmt(Math.min(debt, assets)) },
            { label: 'Unpaid shortfall', value: fmt(shortfall), tone: shortfall > 0 ? 'danger' : 'good' },
            {
              label: 'Owner personal loss',
              value: fmt(personalLoss),
              tone: personalLoss > 0 ? 'danger' : 'good',
            },
          ]}
        />
      </EvidencePanel>
      <ScenarioTimeline
        active={shortfall > 0 ? (isSole ? 'owner' : 'creditor') : 'paid'}
        events={[
          { id: 'failure', label: 'Business fails', detail: `${fmt(debt)} owed` },
          { id: 'paid', label: 'Business assets sold', detail: `${fmt(Math.min(debt, assets))} recovered` },
          {
            id: isSole ? 'owner' : 'creditor',
            label: isSole ? 'Owner covers shortfall' : 'Shortfall remains with creditors',
            detail: shortfall > 0 ? fmt(shortfall) : 'nothing remains',
          },
        ]}
      />
    </>
  );

  const controls = (showTransfer: boolean, complete: AuthoredActivityContext['complete']) => (
    <>
      <Field label="structure">
        <Segmented
          ariaLabel="structure"
          value={isSole ? 'sole' : 'ltd'}
          onChange={(v) => compareStructure(v, complete)}
          options={[
            { value: 'sole', label: 'sole trader' },
            { value: 'ltd', label: 'limited company' },
          ]}
        />
      </Field>
      {showTransfer && (
        <Field label="business debt" value={fmt(debt)}>
          <Slider
            value={debt}
            min={0}
            max={100000}
            step={5000}
            onChange={setDebt}
            ariaLabel="business debt"
          />
        </Field>
      )}
      {showTransfer && (
        <Field label="business assets" value={fmt(assets)}>
          <Slider
            value={assets}
            min={0}
            max={100000}
            step={5000}
            onChange={setAssets}
            ariaLabel="business assets"
          />
        </Field>
      )}
      {showTransfer && (
        <Field label="personal assets" value={fmt(personal)}>
          <Slider
            value={personal}
            min={0}
            max={150000}
            step={5000}
            onChange={setPersonal}
            ariaLabel="personal assets"
          />
        </Field>
      )}
    </>
  );

  const activity: AuthoredActivity = {
    pattern: 'scenario',
    title,
    objectives,
    steps: STEPS,
    questions: CHALLENGE,
    success: [
      {
        id: 'liability-forecast',
        source: 'answer',
        key: 'ltd',
        pendingLabel: 'Commit to a limited-liability prediction.',
      },
      {
        id: 'both-structures',
        source: 'action',
        key: 'structure',
        pendingLabel: 'Inspect both legal structures.',
      },
      {
        id: 'sole-explanation',
        source: 'answer',
        key: 'sole',
        pendingLabel: 'Explain the sole trader outcome.',
      },
    ],
  };

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="limited-company"
      eyebrow="Business ownership"
      title={title}
      description={prompt}
      status={
        <>
          <span>{isSole ? 'sole trader' : 'limited company'}</span>
          <span>shortfall {fmt(shortfall)}</span>
          <span>{personalLoss > 0 ? `owner loses ${fmt(personalLoss)}` : 'personal assets protected'}</span>
        </>
      }
      evidence={({ sequence }) => (sequence.shows('scenario') ? evidence : null)}
      controls={({ sequence, complete }) =>
        sequence.current.id === 'compare' || sequence.shows('transfer')
          ? controls(sequence.shows('transfer'), complete)
          : null
      }
      observation={
        isSole
          ? 'The owner and business are one legal person, so unpaid business debt reaches personal assets.'
          : 'The company is a separate legal person; shareholders lose their investment, while personal assets stay outside the creditor claim.'
      }
      transcript={`${isSole ? 'Sole trader' : 'Limited company'} owes ${fmt(debt)} and has ${fmt(assets)} of business assets. The creditor shortfall is ${fmt(shortfall)}. The owner's personal loss is ${fmt(personalLoss)}.`}
    >
      {({ sequence }) =>
        sequence.shows('scenario') ? (
          figure
        ) : (
          <div className="commerce-model-lock">
            <strong>Predict the legal boundary</strong>
            <span>The failure scenario opens after your prediction.</span>
          </div>
        )
      }
    </AuthoredActivityRuntime>
  );
}
