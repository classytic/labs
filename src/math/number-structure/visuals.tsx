import type { ReactNode } from 'react';
import { FigTag, FigText, Figure, HUE, STROKE, tint } from '../../kit/figure/index.js';
import { arrayState, divisibilityEvidence, factorTree, primeFactors, primePowers, type FactorSplitStrategy, type FactorTreeNode, type NumberStructureMode } from './core.js';

const W = 620, H = 330;
const PRIME_COLORS = [HUE[1], HUE[2], HUE[3]] as const;
const primeColor = (p: number): string => PRIME_COLORS[(primeFactors(p)[0] ?? 2) % PRIME_COLORS.length]!;

function ArrayView({ value, rows }: { value: number; rows: number }): ReactNode {
  const s = arrayState(value, rows), cell = Math.min(38, 220 / Math.max(s.rows, s.columns));
  const hasRemainder = s.remainder > 0;
  const centre = hasRemainder ? 242 : 310;
  const ox = centre - (s.columns * cell) / 2, oy = 156 - (s.rows * cell) / 2;
  return <g aria-label={`${s.rows} rows by ${s.columns} columns with ${s.remainder} left over`}>
    <FigText x={centre} y={35} anchor="middle" size="eyebrow" tone="soft">equal groups</FigText>
    <path d={`M ${ox} ${oy - 13} v -7 H ${ox + s.columns * cell} v 7`} fill="none" stroke={HUE[1]} strokeWidth={STROKE.line}/>
    <FigText x={centre} y={oy - 27} anchor="middle" size="note" tone="hue-1">{s.columns} in each row</FigText>
    {Array.from({ length: s.placed }, (_, i) => {
      const cx = ox + (i % s.columns) * cell + cell / 2;
      const cy = oy + Math.floor(i / s.columns) * cell + cell / 2;
      return <g key={i}><circle cx={cx} cy={cy} r={Math.max(7, cell * .32)} fill={tint(HUE[1], 18)} stroke={HUE[1]} strokeWidth={STROKE.line}/><circle cx={cx - 2} cy={cy - 2} r={Math.max(2, cell * .08)} fill={HUE[1]} opacity=".32"/></g>;
    })}
    <path d={`M ${ox - 13} ${oy} h -7 V ${oy + s.rows * cell} h 7`} fill="none" stroke="var(--stage-muted-foreground)" strokeWidth={STROKE.line}/>
    <FigText x={ox - 30} y={oy + s.rows * cell / 2} anchor="middle" baseline="middle" size="note" tone="soft" rotate={-90}>{s.rows} rows</FigText>
    {hasRemainder ? <g><rect x="454" y="78" width="128" height="150" rx="18" fill={tint(HUE.warn, 5)} stroke="var(--stage-border)"/><FigText x={518} y={103} anchor="middle" size="eyebrow" tone="hot">left over</FigText>{Array.from({ length: s.remainder }, (_, i) => <g key={i}><circle cx={480 + (i % 4) * 25} cy={139 + Math.floor(i / 4) * 27} r="9" fill={tint(HUE.warn, 18)} stroke={HUE.warn} strokeWidth={STROKE.line}/></g>)}<FigText x={518} y={208} anchor="middle" size="note" tone="soft">cannot fill another row</FigText></g> : null}
    <rect x="174" y="276" width="272" height="38" rx="19" fill={s.exact ? tint(HUE.good, 8) : tint(HUE.warn, 7)} />
    <FigText x={310} y={295} anchor="middle" baseline="middle" size="label" tone={s.exact ? 'good' : 'hot'}>{s.exact ? `${s.rows} × ${s.columns} = ${value} · exact` : `${s.rows} × ${s.columns} + ${s.remainder} = ${value}`}</FigText>
  </g>;
}

const leafCount=(node:FactorTreeNode):number=>node.prime?1:leafCount(node.left!)+leafCount(node.right!);
function TreeBranch({node,x,y,width,depth=0}:{node:FactorTreeNode;x:number;y:number;width:number;depth?:number}):ReactNode {
  const radius=node.prime?19:23;
  if(node.prime)return <g><circle cx={x} cy={y} r={radius} fill={tint(primeColor(node.value),20)} stroke={primeColor(node.value)} strokeWidth={STROKE.edge}/><FigText x={x} y={y} anchor="middle" baseline="middle" size="label">{node.value}</FigText></g>;
  const leftLeaves=leafCount(node.left!),total=leftLeaves+leafCount(node.right!),leftX=x-width*(1-leftLeaves/total)/2,rightX=x+width*(leftLeaves/total)/2,childY=y+Math.max(52,68-depth*4);
  return <g><line x1={x} y1={y+radius} x2={leftX} y2={childY-20} stroke="var(--stage-border)" strokeWidth={STROKE.line}/><line x1={x} y1={y+radius} x2={rightX} y2={childY-20} stroke="var(--stage-border)" strokeWidth={STROKE.line}/><circle cx={x} cy={y} r={radius} fill={tint(HUE[1],14)} stroke={HUE[1]} strokeWidth={STROKE.edge}/><FigText x={x} y={y} anchor="middle" baseline="middle" size="label">{node.value}</FigText><TreeBranch node={node.left!} x={leftX} y={childY} width={width*leftLeaves/total} depth={depth+1}/><TreeBranch node={node.right!} x={rightX} y={childY} width={width*(total-leftLeaves)/total} depth={depth+1}/></g>;
}
function PrimeTree({value,strategy}:{value:number;strategy:FactorSplitStrategy}):ReactNode {
  const factors=primeFactors(value);
  return <g aria-label={`${value} decomposes recursively into ${factors.join(' times ')}`}><FigText x={34} y={31} size="eyebrow" tone="soft">split composites until every leaf is prime</FigText><TreeBranch node={factorTree(value,strategy)} x={310} y={54} width={480}/><rect x="154" y="286" width="312" height="32" rx="16" fill={tint(HUE.good,8)}/><FigText x={310} y={302} anchor="middle" baseline="middle" size="label" tone="good">prime inventory · {factors.join(' × ')} = {value}</FigText></g>;
}

function DivisibilityView({value}:{value:number}):ReactNode {
  const evidence=divisibilityEvidence(value),digits=String(value).split(''),digitSum=digits.reduce((sum,d)=>sum+Number(d),0),lastTwo=value%100;
  const works=(divisor:number)=>evidence.find(item=>item.divisor===divisor)?.works;
  const lane=(x:number,divisor:number,label:string,evidenceText:string)=><g><rect x={x-84} y="184" width="168" height="92" rx="16" fill={works(divisor)?tint(HUE.good,7):'var(--stage-card)'} stroke={works(divisor)?HUE.good:'var(--stage-border)'}/><FigTag x={x} y={202} anchor="middle" color={works(divisor)?HUE.good:HUE.soft}>÷ {divisor}</FigTag><FigText x={x} y={235} anchor="middle" size="note" tone="soft">{label}</FigText><FigText x={x} y={257} anchor="middle" size="label" tone={works(divisor)?'good':'soft'}>{evidenceText} · {works(divisor)?'exact':'not exact'}</FigText></g>;
  return <g aria-label={`Divisibility evidence for ${value}`}><FigText x={310} y={34} anchor="middle" size="eyebrow" tone="soft">inspect only the digits each rule needs</FigText>{digits.map((digit,index)=>{const x=310+(index-(digits.length-1)/2)*58;return <g key={`${digit}-${index}`}><rect x={x-23} y={57} width={46} height={58} rx={10} fill={index===digits.length-1?tint(HUE[2],16):tint(HUE[1],10)} stroke={index===digits.length-1?HUE[2]:'var(--stage-border)'}/><FigText x={x} y={86} anchor="middle" baseline="middle" size="title">{digit}</FigText><FigText x={x} y={135} anchor="middle" size="note" tone="soft">{10**(digits.length-index-1)}s</FigText></g>})}{lane(112,2,'look at the last digit',String(digits.at(-1)))}{lane(310,3,'add every digit',String(digitSum))}{lane(508,4,'read the last two digits',String(lastTwo))}<FigText x={310} y={306} anchor="middle" size="note" tone="soft">A green rule gives a complete divisibility proof.</FigText></g>;
}

function PowerView({ a, b, mode }: { a: number; b: number; mode: 'gcd' | 'lcm' }): ReactNode {
  const powers = primePowers(a, b), chosen = mode === 'gcd' ? Math.max(1, powers.reduce((n, p) => n * p.prime ** p.gcdExponent, 1)) : powers.reduce((n, p) => n * p.prime ** p.lcmExponent, 1);
  const inventory = (prime: number, exponent: number, x: number, y: number, selected = false): ReactNode => {
    const color = primeColor(prime);
    return <g aria-label={`${exponent} copies of ${prime}`}>
      {exponent === 0 ? <FigText x={x} y={y} anchor="middle" baseline="middle" size="note" tone="soft">none</FigText> : null}
      {Array.from({ length: exponent }, (_, index) => {
        const cx = x + (index - (exponent - 1) / 2) * 24;
        return <g key={index}>
          <circle cx={cx} cy={y} r={10} fill={selected ? color : tint(color, 17)} stroke={color} strokeWidth={STROKE.line} />
          <FigText x={cx} y={y} anchor="middle" baseline="middle" size="note" tone={selected ? 'inverse' : 'ink'}>{prime}</FigText>
        </g>;
      })}
    </g>;
  };
  return <g aria-label={`${mode} of ${a} and ${b} is ${chosen}`}>
    <FigText x={310} y={30} anchor="middle" size="eyebrow" tone="soft">prime-piece inventory</FigText>
    <FigText x={92} y={91} anchor="start" size="label">{a}</FigText>
    <FigText x={92} y={145} anchor="start" size="label">{b}</FigText>
    <FigText x={92} y={218} anchor="start" size="label" tone="good">{mode === 'gcd' ? 'shared' : 'needed'}</FigText>
    <line x1={82} y1={177} x2={548} y2={177} stroke="var(--stage-border)" />
    {powers.map((power, index) => {
      const gap = Math.min(128, 390 / Math.max(1, powers.length));
      const x = 330 + (index - (powers.length - 1) / 2) * gap;
      const selected = mode === 'gcd' ? power.gcdExponent : power.lcmExponent;
      return <g key={power.prime}>
        <FigText x={x} y={58} anchor="middle" size="note" tone="soft">factor {power.prime}</FigText>
        {inventory(power.prime, power.exponentA, x, 88)}
        {inventory(power.prime, power.exponentB, x, 142)}
        {inventory(power.prime, selected, x, 214, true)}
      </g>;
    })}
    <FigText x={310} y={278} anchor="middle" size="title" tone="good">{mode.toUpperCase()}({a}, {b}) = {chosen}</FigText>
    <FigText x={310} y={307} anchor="middle" size="note" tone="soft">{mode === 'gcd' ? 'Take only copies present in both inventories.' : 'Take enough copies to contain both inventories.'}</FigText>
  </g>;
}

export function NumberStructureFigure({ mode, value, rows, a, b, splitStrategy='balanced' }: { mode: NumberStructureMode; value: number; rows: number; a: number; b: number; splitStrategy?:FactorSplitStrategy }): ReactNode {
  return <Figure viewBox={[W, H]} domain="math" label={`${mode} model for ${value}`}>
    {mode === 'factor-array' ? <ArrayView value={value} rows={rows} /> : null}
    {mode === 'prime-tree' ? <PrimeTree value={value} strategy={splitStrategy} /> : null}
    {mode === 'gcd' || mode === 'lcm' ? <PowerView a={a} b={b} mode={mode} /> : null}
    {mode === 'divisibility' ? <DivisibilityView value={value} /> : null}
  </Figure>;
}
