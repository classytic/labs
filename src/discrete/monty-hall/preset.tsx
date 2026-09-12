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

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useFrameLoop, useControlSurface, useInView } from '@classytic/stage';
import { DoorGlyph, CarGlyph, GoatGlyph } from '../../kit/gameshow.js';
import { mulberry32, randInt, type Rng } from '../core/rng.js';
import { RotateCcw } from 'lucide-react';
import { Activity } from '../../kit/activity.js';
import { ActionButton, IconButton } from '../../kit/controls.js';
import {
  ChallengeCard,
  useChallenge,
  useHints,
  HintLadder,
  useCheckpoint,
  type ChallengeQuestion,
} from '../../kit/pedagogy.js';

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
interface Tally {
  switchWins: number;
  switchGames: number;
  stayWins: number;
  stayGames: number;
}

const MONTY_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'best-strategy',
    prompt: 'With three doors, which strategy wins more often in the long run?',
    choices: [
      { value: 'switch', label: 'switch doors' },
      { value: 'stay', label: 'stay with the first pick' },
      { value: 'equal', label: 'both are equally likely' },
    ],
    answer: 'switch',
    explain:
      'The first pick is wrong two-thirds of the time. Monty’s reveal concentrates that two-thirds chance on the one remaining door.',
  },
];

const DW = 116,
  DH = 188,
  GAP = 26,
  PAD = 16;

export function MontyHallLab({
  doors = 3,
  seed = 7,
  title = 'The Monty Hall game',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: MontyHallProps): ReactNode {
  const n = Math.max(3, Math.min(6, doors));
  const rng = useRef<Rng>(mulberry32(seed));
  const hints = useHints(hintList);
  const challenge = useChallenge(MONTY_CHALLENGE);
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

  useEffect(() => {
    setMounted(true);
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);
  const after = (ms: number, fn: () => void): void => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  const newGame = useCallback((): void => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setCar(randInt(rng.current, 0, n - 1));
    setPick(null);
    setOpened([]);
    setSwitchTo(null);
    setFinalPick(null);
    setStrategy(null);
    setRevealAll(false);
    setPhase('pick');
  }, [n]);

  const pickDoor = useCallback(
    (i: number): void => {
      if (phase !== 'pick' || autoRunning) return;
      setPick(i);
      // switch target: if you already nailed the car, Monty steers you to a goat; else to the car
      const others = Array.from({ length: n }, (_, k) => k).filter((k) => k !== i);
      const target =
        i === car ? others.filter((k) => k !== car)[randInt(rng.current, 0, others.length - 2)]! : car;
      setSwitchTo(target);
      // Monty opens every door that is neither your pick nor the switch target, all goats
      setOpened(Array.from({ length: n }, (_, k) => k).filter((k) => k !== i && k !== target));
      after(750, () => setPhase('revealed'));
    },
    [phase, autoRunning, n, car],
  );

  const decide = useCallback(
    (strat: 'stay' | 'switch'): void => {
      if (phase !== 'revealed' || pick == null || switchTo == null) return;
      const fp = strat === 'switch' ? switchTo : pick;
      setFinalPick(fp);
      setStrategy(strat);
      setPhase('result');
      const won = fp === car;
      setTally((t) =>
        strat === 'switch'
          ? { ...t, switchGames: t.switchGames + 1, switchWins: t.switchWins + (won ? 1 : 0) }
          : { ...t, stayGames: t.stayGames + 1, stayWins: t.stayWins + (won ? 1 : 0) },
      );
      after(600, () => setRevealAll(true));
    },
    [phase, pick, switchTo, car],
  );

  const startAuto = useCallback((count: number): void => {
    autoLeft.current = count;
    chunk.current = Math.max(1, Math.ceil(count / 120));
    setAutoRunning(true);
  }, []);

  const resetAll = useCallback((): void => {
    setAutoRunning(false);
    autoLeft.current = 0;
    setTally({ switchWins: 0, switchGames: 0, stayWins: 0, stayGames: 0 });
    rng.current = mulberry32(seed);
    newGame();
    challenge.reset();
  }, [seed, newGame, challenge]);

  useFrameLoop(
    () => {
      if (autoLeft.current <= 0) {
        if (autoRunning) setAutoRunning(false);
        return;
      }
      const c = Math.min(autoLeft.current, chunk.current);
      let sw = 0,
        st = 0;
      for (let k = 0; k < c; k++) {
        const cr = randInt(rng.current, 0, n - 1);
        const pk = randInt(rng.current, 0, n - 1);
        if (pk !== cr) sw++; // switching wins exactly when the first pick was wrong
        if (pk === cr) st++; // staying wins only when the first pick was right
      }
      autoLeft.current -= c;
      setTally((t) => ({
        switchWins: t.switchWins + sw,
        switchGames: t.switchGames + c,
        stayWins: t.stayWins + st,
        stayGames: t.stayGames + c,
      }));
    },
    { running: autoRunning && mounted && inView },
  );

  const won = finalPick != null && finalPick === car;
  useCheckpoint({
    solved: challenge.allCorrect && tally.switchGames >= 100 && tally.stayGames >= 100,
    activity: `monty-hall:${title}`,
    hintsUsed: hints.count,
  });

  useControlSurface(controlId, {
    pick: {
      type: 'number',
      label: 'pick door (0-based)',
      min: 0,
      max: n - 1,
      step: 1,
      get: () => pick ?? 0,
      set: (v: number) => pickDoor(v),
    },
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
  const contentBox = (i: number) => ({
    x: doorX(i) + DW * 0.18,
    y: PAD + DH * 0.2,
    w: DW * 0.64,
    h: DH * 0.62,
  });

  const swRate = tally.switchGames ? tally.switchWins / tally.switchGames : 0;
  const stRate = tally.stayGames ? tally.stayWins / tally.stayGames : 0;
  const swTarget = (n - 1) / n,
    stTarget = 1 / n;

  const narration = (): ReactNode => {
    if (phase === 'pick')
      return pick == null ? (
        <>
          Pick a door. One hides the <b>car</b>; the others hide <b>goats</b>.
        </>
      ) : (
        <>
          You chose <b>Door {pick + 1}</b>. Monty is opening a goat door…
        </>
      );
    if (phase === 'revealed')
      return (
        <>
          Monty opened {opened.map((d) => `Door ${d + 1}`).join(', ')}, revealing a goat. Now <b>stay</b> with
          Door {pick! + 1}, or <b>switch</b> to Door {switchTo! + 1}.
        </>
      );
    return won ? (
      <>
        <b className="discrete-success">You win the car.</b> You{' '}
        {strategy === 'switch' ? 'switched' : 'stayed'}.
      </>
    ) : (
      <>
        <b className="discrete-loss">You found a goat.</b> You {strategy === 'switch' ? 'switched' : 'stayed'}
        ; the car was behind Door {car + 1}.
      </>
    );
  };

  const activateDoor = (event: KeyboardEvent<SVGGElement>, index: number): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pickDoor(index);
    }
  };

  const figure = (
    <>
      {/* narration banner */}
      <div className="monty-narration" aria-live="polite">
        {narration()}
      </div>

      {/* doors */}
      <div ref={viewRef} className="lab-playwrap monty-stage">
        <svg
          className="monty-door-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${n} doors; ${phase}`}
        >
          {Array.from({ length: n }, (_, i) => {
            const isOpen = revealAll || opened.includes(i) || finalPick === i ? 1 : 0;
            const cb = contentBox(i);
            return (
              <g
                key={i}
                className="monty-door-target"
                data-interactive={phase === 'pick' && !autoRunning}
                onClick={() => pickDoor(i)}
                onKeyDown={(event) => activateDoor(event, i)}
                tabIndex={phase === 'pick' && !autoRunning ? 0 : -1}
                role="button"
                aria-label={`door ${i + 1}`}
                aria-disabled={phase !== 'pick' || autoRunning}
              >
                <DoorGlyph
                  x={doorX(i)}
                  y={PAD}
                  w={DW}
                  h={DH}
                  label={i + 1}
                  open={isOpen}
                  picked={phase === 'result' ? finalPick === i : pick === i}
                  dim={phase === 'result' && finalPick !== i && i !== car}
                >
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
    <div className="lab-activity-fields">
      <div className="monty-auto-row">
        <span className="monty-auto-label">Let the robot test the odds:</span>
        <ActionButton disabled={autoRunning} onClick={() => startAuto(100)}>
          Run 100
        </ActionButton>
        <ActionButton disabled={autoRunning} onClick={() => startAuto(1000)}>
          Run 1,000
        </ActionButton>
        {autoRunning && (
          <span className="discrete-success" role="status">
            playing…
          </span>
        )}
      </div>
    </div>
  );

  const evidence = (
    <div className="monty-evidence">
      {/* tally bars, the convergence, earned */}
      <div className="monty-tally">
        {(
          [
            ['switch', swRate, swTarget, tally.switchWins, tally.switchGames],
            ['stay', stRate, stTarget, tally.stayWins, tally.stayGames],
          ] as const
        ).map(([name, rate, target, wins, games]) => (
          <div key={name}>
            <div className="monty-tally-heading">
              <span data-strategy={name}>{name} wins</span>
              <span>
                {games ? `${(rate * 100).toFixed(1)}%` : '-'} · {wins}/{games}{' '}
                <span className="monty-target-copy">(→ {(target * 100).toFixed(0)}%)</span>
              </span>
            </div>
            <div
              className="monty-rate-track"
              data-strategy={name}
              style={{ '--rate': `${rate * 100}%`, '--target': `${target * 100}%` } as CSSProperties}
            >
              <div className="monty-rate-fill" />
              <div className="monty-rate-target" title={`target ${(target * 100).toFixed(0)}%`} />
            </div>
          </div>
        ))}
      </div>
      {controls}
    </div>
  );

  return (
    <Activity.Root className="discrete-monty-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Conditional probability"
          title={title}
          description={
            prompt ??
            `Pick one of ${n} doors, observe the host's informed reveal, then compare staying with switching.`
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{autoRunning ? 'simulating' : phase}</strong>
        <span>{n} doors</span>
        <span>{tally.switchGames + tally.stayGames} trials compared</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Monty Hall doors and current round">{figure}</Activity.Canvas>
        <Activity.Inspector label="Strategy evidence and simulation controls">{evidence}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {phase === 'result'
            ? won
              ? `This ${strategy} decision won, but one round is not enough evidence. Compare many trials.`
              : `This ${strategy} decision lost; aggregate trials reveal the long-run advantage.`
            : tally.switchGames >= 100
              ? `Switching is approaching ${(((n - 1) / n) * 100).toFixed(0)}% because the host concentrates the chance that your first pick was wrong.`
              : 'The host never opens the car and never opens your chosen door, so the reveal carries information.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Predict and explain the Monty Hall strategy">
        <ChallengeCard questions={MONTY_CHALLENGE} state={challenge} title="Predict, then test" />
        <HintLadder hints={hints} />
      </section>
      <Activity.LiveRegion>
        Switch wins {tally.switchWins} of {tally.switchGames}; stay wins {tally.stayWins} of {tally.stayGames}
        .
      </Activity.LiveRegion>
      <Activity.Transport>
        <IconButton label="Reset Monty Hall results" onClick={resetAll}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state" aria-live="polite">
          <strong>
            {autoRunning
              ? 'Robot testing strategies'
              : phase === 'pick'
                ? 'Choose a door'
                : phase === 'revealed'
                  ? 'Stay or switch'
                  : won
                    ? 'Car won'
                    : 'Goat revealed'}
          </strong>
          <span>{tally.switchGames + tally.stayGames} recorded trials</span>
        </div>
        <div className="monty-action-row">
          {phase === 'revealed' ? (
            <>
              <ActionButton onClick={() => decide('stay')}>Stay</ActionButton>
              <ActionButton className="lab-primary-action" onClick={() => decide('switch')}>
                Switch
              </ActionButton>
            </>
          ) : null}
          {phase === 'result' ? (
            <ActionButton className="lab-primary-action" onClick={newGame}>
              Play again
            </ActionButton>
          ) : null}
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
