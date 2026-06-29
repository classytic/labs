'use client';

/**
 * MontyHallLab, the paradox as a GAME you play, not a chart you stare at. Three
 * doors (one hides a car, the rest goats); you pick, Monty throws open a goat, and
 * you choose to STAY or SWITCH and watch the door swing open on your fate. Every
 * game you (and the auto-player) finish feeds two growing win-rate bars, so the
 * shocking truth, switch ≈ 2/3, stay ≈ 1/3, is something you EARN by watching it
 * happen, the law of large numbers built from felt experience.
 *
 * Doors/car/goat are stage glyphs (DoorGlyph swings open via CSS); the round logic
 * is a small seeded state machine (replayable). Narration + controls + the tally
 * bars are HTML around the SVG so nothing overlaps. Generalises to N doors (Monty
 * opens all goats but one, so switching wins (N−1)/N).
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrameLoop, useControlSurface, useInView } from '@classytic/stage';
import { DoorGlyph, CarGlyph, GoatGlyph } from '../../kit/gameshow.js';
import { mulberry32, randInt, type Rng } from '../core/rng.js';
import { LabFrame, ControlBar, Callout } from '../../kit/frame.js';
import { useHints, HintLadder, useCheckpoint } from '../../kit/pedagogy.js';

export interface MontyHallProps {
  doors?: number;
  seed?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

type Phase = 'pick' | 'revealed' | 'result';
interface Tally { switchWins: number; switchGames: number; stayWins: number; stayGames: number }

const DW = 116, DH = 188, GAP = 26, PAD = 16;

export function MontyHallLab({ doors = 3, seed = 7, title = 'The Monty Hall game', prompt, objectives, hints: hintList, controlId }: MontyHallProps): ReactNode {
  const n = Math.max(3, Math.min(6, doors));
  const rng = useRef<Rng>(mulberry32(seed));
  const hints = useHints(hintList);
  const timers = useRef<number[]>([]);
  const [mounted, setMounted] = useState(false);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const [phase, setPhase] = useState<Phase>('pick');
  const [car, setCar] = useState(() => randInt(rng.current, 0, n - 1));
  const [pick, setPick] = useState<number | null>(null);
  const [opened, setOpened] = useState<number[]>([]);
  const [switchTo, setSwitchTo] = useState<number | null>(null);
  const [finalPick, setFinalPick] = useState<number | null>(null);
  const [strategy, setStrategy] = useState<'stay' | 'switch' | null>(null);
  const [revealAll, setRevealAll] = useState(false);
  const [tally, setTally] = useState<Tally>({ switchWins: 0, switchGames: 0, stayWins: 0, stayGames: 0 });

  // auto-player
  const [autoRunning, setAutoRunning] = useState(false);
  const autoLeft = useRef(0);
  const chunk = useRef(1);

  useEffect(() => { setMounted(true); return () => { timers.current.forEach(clearTimeout); }; }, []);
  const after = (ms: number, fn: () => void): void => { const id = window.setTimeout(fn, ms); timers.current.push(id); };

  const newGame = useCallback((): void => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setCar(randInt(rng.current, 0, n - 1));
    setPick(null); setOpened([]); setSwitchTo(null); setFinalPick(null); setStrategy(null); setRevealAll(false); setPhase('pick');
  }, [n]);

  const pickDoor = useCallback((i: number): void => {
    if (phase !== 'pick' || autoRunning) return;
    setPick(i);
    // switch target: if you already nailed the car, Monty steers you to a goat; else to the car
    const others = Array.from({ length: n }, (_, k) => k).filter((k) => k !== i);
    const target = i === car ? others.filter((k) => k !== car)[randInt(rng.current, 0, others.length - 2)]! : car;
    setSwitchTo(target);
    // Monty opens every door that is neither your pick nor the switch target, all goats
    setOpened(Array.from({ length: n }, (_, k) => k).filter((k) => k !== i && k !== target));
    after(750, () => setPhase('revealed'));
  }, [phase, autoRunning, n, car]);

  const decide = useCallback((strat: 'stay' | 'switch'): void => {
    if (phase !== 'revealed' || pick == null || switchTo == null) return;
    const fp = strat === 'switch' ? switchTo : pick;
    setFinalPick(fp); setStrategy(strat); setPhase('result');
    const won = fp === car;
    setTally((t) => strat === 'switch'
      ? { ...t, switchGames: t.switchGames + 1, switchWins: t.switchWins + (won ? 1 : 0) }
      : { ...t, stayGames: t.stayGames + 1, stayWins: t.stayWins + (won ? 1 : 0) });
    after(600, () => setRevealAll(true));
  }, [phase, pick, switchTo, car]);

  const startAuto = useCallback((count: number): void => {
    autoLeft.current = count; chunk.current = Math.max(1, Math.ceil(count / 120)); setAutoRunning(true);
  }, []);

  const resetAll = useCallback((): void => {
    setAutoRunning(false); autoLeft.current = 0;
    setTally({ switchWins: 0, switchGames: 0, stayWins: 0, stayGames: 0 });
    rng.current = mulberry32(seed); newGame();
  }, [seed, newGame]);

  useFrameLoop(() => {
    if (autoLeft.current <= 0) { if (autoRunning) setAutoRunning(false); return; }
    const c = Math.min(autoLeft.current, chunk.current);
    let sw = 0, st = 0;
    for (let k = 0; k < c; k++) {
      const cr = randInt(rng.current, 0, n - 1);
      const pk = randInt(rng.current, 0, n - 1);
      if (pk !== cr) sw++;          // switching wins exactly when the first pick was wrong
      if (pk === cr) st++;          // staying wins only when the first pick was right
    }
    autoLeft.current -= c;
    setTally((t) => ({ switchWins: t.switchWins + sw, switchGames: t.switchGames + c, stayWins: t.stayWins + st, stayGames: t.stayGames + c }));
  }, { running: autoRunning && mounted && inView });

  const won = finalPick != null && finalPick === car;
  useCheckpoint({ solved: tally.switchGames >= 1 && tally.stayGames >= 1, activity: `monty-hall:${title}`, hintsUsed: hints.count });

  useControlSurface(controlId, {
    pick: { type: 'number', label: 'pick door (0-based)', min: 0, max: n - 1, step: 1, get: () => pick ?? 0, set: (v: number) => pickDoor(v) },
    stay: { type: 'action', label: 'stay', invoke: () => decide('stay') },
    switch: { type: 'action', label: 'switch', invoke: () => decide('switch') },
    again: { type: 'action', label: 'play again', invoke: newGame },
    auto100: { type: 'action', label: 'auto-play 100', invoke: () => startAuto(100) },
    reset: { type: 'action', label: 'reset stats', invoke: resetAll },
  });

  // layout
  const W = n * DW + (n - 1) * GAP + PAD * 2;
  const H = DH + PAD * 2;
  const doorX = (i: number): number => PAD + i * (DW + GAP);
  const contentBox = (i: number) => ({ x: doorX(i) + DW * 0.18, y: PAD + DH * 0.2, w: DW * 0.64, h: DH * 0.62 });

  const swRate = tally.switchGames ? tally.switchWins / tally.switchGames : 0;
  const stRate = tally.stayGames ? tally.stayWins / tally.stayGames : 0;
  const swTarget = (n - 1) / n, stTarget = 1 / n;

  const narration = (): ReactNode => {
    if (phase === 'pick') return pick == null ? <>🎬 Pick a door, one hides the <b>car</b>, the others <b>goats</b>.</> : <>You chose <b>Door {pick + 1}</b>. Monty is opening a goat…</>;
    if (phase === 'revealed') return <>Monty opened {opened.map((d) => `Door ${d + 1}`).join(', ')}, a goat! 🐐 Now: <b>stay</b> with Door {pick! + 1}, or <b>switch</b> to Door {switchTo! + 1}?</>;
    return won ? <><b style={{ color: 'var(--stage-good)' }}>🎉 You win the car!</b> You {strategy === 'switch' ? 'switched' : 'stayed'}.</> : <><b style={{ color: 'var(--stage-bad)' }}>🐐 A goat.</b> You {strategy === 'switch' ? 'switched' : 'stayed'}, the car was behind Door {car + 1}.</>;
  };

  const btn: React.CSSProperties = { padding: '9px 18px', borderRadius: 999, border: '1.5px solid var(--stage-grid)', background: 'var(--stage-bg)', color: 'var(--stage-fg)', fontWeight: 700, fontSize: 14, cursor: 'pointer' };
  const btnHot: React.CSSProperties = { ...btn, borderColor: 'var(--stage-good)', background: 'color-mix(in oklab, var(--stage-good) 16%, transparent)' };

  const figure = (
    <>
      {/* narration banner */}
      <div style={{ minHeight: 24, fontSize: 15, fontWeight: 500, margin: '4px 0 8px', textAlign: 'center' }} aria-live="polite">{narration()}</div>

      {/* doors */}
      <div ref={viewRef} className="lab-playwrap" style={{ borderRadius: 16, background: 'color-mix(in oklab, var(--stage-accent) 6%, var(--stage-bg))', border: '1px solid var(--stage-grid)', padding: 8 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, height: 'auto', display: 'block', margin: '0 auto' }} role="img" aria-label={`${n} doors; ${phase}`}>
          {Array.from({ length: n }, (_, i) => {
            const isOpen = revealAll || opened.includes(i) || finalPick === i ? 1 : 0;
            const cb = contentBox(i);
            return (
              <g key={i} onClick={() => pickDoor(i)} style={{ cursor: phase === 'pick' && !autoRunning ? 'pointer' : 'default' }} role="button" aria-label={`door ${i + 1}`}>
                <DoorGlyph x={doorX(i)} y={PAD} w={DW} h={DH} label={i + 1} open={isOpen} picked={phase === 'result' ? finalPick === i : pick === i} dim={phase === 'result' && finalPick !== i && i !== car}>
                  {i === car ? <CarGlyph {...cb} /> : <GoatGlyph {...cb} />}
                </DoorGlyph>
              </g>
            );
          })}
        </svg>
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      {/* action row */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {phase === 'revealed' && <>
          <button style={btn} onClick={() => decide('stay')}>🛑 Stay (Door {pick! + 1})</button>
          <button style={btnHot} onClick={() => decide('switch')}>🔄 Switch (Door {switchTo! + 1})</button>
        </>}
        {phase === 'result' && <button style={btnHot} onClick={newGame}>▶ Play again</button>}
        {phase === 'pick' && pick == null && <span style={{ fontSize: 13, color: 'var(--stage-muted)' }}>↑ tap a door to start</span>}
      </div>
      {/* auto-play */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--stage-muted)' }}>Too slow? Let the robot play:</span>
        <button style={btn} disabled={autoRunning} onClick={() => startAuto(100)}>⚡ 100 games</button>
        <button style={btn} disabled={autoRunning} onClick={() => startAuto(1000)}>⚡ 1000 games</button>
        <button style={btn} onClick={resetAll}>↺ reset</button>
        {autoRunning && <span style={{ fontSize: 13, color: 'var(--stage-good)' }}>playing…</span>}
      </div>
    </ControlBar>
  );

  const aside = (
    <Callout tone="result">
      {/* tally bars, the convergence, earned */}
      <div style={{ display: 'grid', gap: 10 }}>
        {([['switch', swRate, swTarget, tally.switchWins, tally.switchGames, 'var(--stage-good)'], ['stay', stRate, stTarget, tally.stayWins, tally.stayGames, 'var(--stage-muted)']] as const).map(([name, rate, target, wins, games, color]) => (
          <div key={name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
              <span style={{ color, textTransform: 'capitalize' }}>{name} wins</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--stage-muted)' }}>{games ? `${(rate * 100).toFixed(1)}%` : ', '} · {wins}/{games} <span style={{ opacity: 0.7 }}>(→ {(target * 100).toFixed(0)}%)</span></span>
            </div>
            <div style={{ position: 'relative', height: 16, borderRadius: 8, background: 'color-mix(in oklab, var(--stage-grid) 60%, transparent)', overflow: 'hidden' }}>
              <div style={{ width: `${rate * 100}%`, height: '100%', background: color, borderRadius: 8, transition: 'width .12s linear' }} />
              <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${target * 100}%`, width: 2, background: 'var(--stage-fg)', opacity: 0.5 }} title={`target ${(target * 100).toFixed(0)}%`} />
            </div>
          </div>
        ))}
      </div>
    </Callout>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={<HintLadder hints={hints} />}>{figure}</LabFrame>;
}
