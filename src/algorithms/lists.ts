/**
 * Array against linked list, running the SAME operation on both and counting the work.
 *
 * The usual framing is that one is better, and students leave with a preference instead of a
 * model. The truth is a trade: an array can jump to any position but has to shift everything to
 * make room at the front, while a list can splice at the front for free but has to walk to reach
 * position k. Running both side by side makes the trade the lesson rather than the footnote.
 *
 * Cost is counted in TOUCHES: a cell read, a cell moved, or a pointer followed. Not seconds,
 * because the point is how the work grows with n, not how fast a machine is.
 */

export type ListKind = 'array' | 'linked';
export type ListOperation = 'get' | 'search' | 'insert-front' | 'insert-end' | 'delete-front';

export const LIST_OPERATIONS: ListOperation[] = [
  'get',
  'search',
  'insert-front',
  'insert-end',
  'delete-front',
];

export const OPERATION_LABEL: Record<ListOperation, string> = {
  get: 'Read position k',
  search: 'Find a value',
  'insert-front': 'Insert at the front',
  'insert-end': 'Insert at the end',
  'delete-front': 'Remove the front',
};

export interface ListStep {
  /** Position being touched, or -1 for work that is not at a position. */
  index: number;
  action: 'hop' | 'read' | 'shift' | 'write' | 'relink';
  /**
   * Contents AFTER this step. Without a per-step snapshot the view can only draw the finished
   * result, which then contradicts its own narration: the caption says "move 42 from position 5
   * to 6" beside a picture where everything has already moved.
   *
   * A shift copies a value forward and leaves the old copy behind until something overwrites it,
   * exactly as it happens in memory, so a snapshot mid-shift legitimately shows a value twice.
   */
  values: number[];
  message: string;
}

export interface ListRun {
  kind: ListKind;
  operation: ListOperation;
  steps: ListStep[];
  /** Total touches. This is the number the two structures are compared on. */
  cost: number;
  values: number[];
  /** One line saying WHY the cost is what it is. */
  note: string;
}

export interface ListComparison {
  operation: ListOperation;
  array: ListRun;
  linked: ListRun;
  /** Which structure did less work, or null when they tie. */
  winner: ListKind | null;
}

/** Run one operation on an array. */
function runArray(values: readonly number[], operation: ListOperation, argument: number): ListRun {
  const steps: ListStep[] = [];
  const next = [...values];
  const n = next.length;

  switch (operation) {
    case 'get': {
      const index = Math.min(Math.max(0, argument), Math.max(0, n - 1));
      steps.push({
        index,
        action: 'read',
        values: [...next],
        message: `Jump straight to position ${index}. Its address is known.`,
      });
      return {
        kind: 'array',
        operation,
        steps,
        cost: 1,
        values: next,
        note: 'One touch, whatever the position.',
      };
    }
    case 'search': {
      for (let index = 0; index < n; index++) {
        steps.push({
          index,
          action: 'read',
          values: [...next],
          message: `Check position ${index}: ${next[index]}${next[index] === argument ? ', found it.' : '.'}`,
        });
        if (next[index] === argument) break;
      }
      return {
        kind: 'array',
        operation,
        steps,
        cost: steps.length,
        values: next,
        note: 'Nothing tells you where a value is, so you look at each in turn.',
      };
    }
    case 'insert-front': {
      // Copy from the back forward, which is the only order that does not overwrite a value
      // before it has been moved.
      const work = [...next];
      if (n === 0) {
        work.push(argument);
        steps.push({
          index: 0,
          action: 'write',
          values: [...work],
          message: `Write ${argument} into position 0.`,
        });
      } else {
        work.push(work[n - 1]!);
        steps.push({
          index: n,
          action: 'shift',
          values: [...work],
          message: `Move ${work[n - 1]} from position ${n - 1} to ${n}.`,
        });
        for (let index = n - 2; index >= 0; index--) {
          work[index + 1] = work[index]!;
          steps.push({
            index: index + 1,
            action: 'shift',
            values: [...work],
            message: `Move ${work[index]} from position ${index} to ${index + 1}.`,
          });
        }
        work[0] = argument;
        steps.push({
          index: 0,
          action: 'write',
          values: [...work],
          message: `Write ${argument} into the space at position 0.`,
        });
      }
      return {
        kind: 'array',
        operation,
        steps,
        cost: steps.length,
        values: work,
        note: 'Everything already there has to move up to free position 0.',
      };
    }
    case 'insert-end': {
      next.push(argument);
      steps.push({
        index: n,
        action: 'write',
        values: [...next],
        message: `Write ${argument} into position ${n}. Nothing moves.`,
      });
      return { kind: 'array', operation, steps, cost: 1, values: next, note: 'The end is already free.' };
    }
    case 'delete-front': {
      const work = [...next];
      for (let index = 1; index < n; index++) {
        work[index - 1] = work[index]!;
        steps.push({
          index: index - 1,
          action: 'shift',
          values: [...work],
          message: `Move ${work[index]} from position ${index} to ${index - 1}.`,
        });
      }
      work.pop();
      // The hole at the end closes as part of the final move, so the last snapshot shows the
      // shortened array rather than a stale copy nobody will overwrite.
      if (steps.length) steps[steps.length - 1]!.values = [...work];
      return {
        kind: 'array',
        operation,
        steps,
        cost: steps.length,
        values: work,
        note: 'Removing the front leaves a hole that everything else has to close.',
      };
    }
  }
}

/** Run the same operation on a singly linked list with a head pointer and no tail pointer. */
function runLinked(values: readonly number[], operation: ListOperation, argument: number): ListRun {
  const steps: ListStep[] = [];
  const next = [...values];
  const n = next.length;

  switch (operation) {
    case 'get': {
      const index = Math.min(Math.max(0, argument), Math.max(0, n - 1));
      for (let hop = 0; hop <= index; hop++) {
        steps.push({
          index: hop,
          action: hop === index ? 'read' : 'hop',
          values: [...next],
          message:
            hop === index
              ? `Arrived at position ${hop}. It holds ${next[hop]}.`
              : `Follow the pointer from position ${hop} to ${hop + 1}.`,
        });
      }
      return {
        kind: 'linked',
        operation,
        steps,
        cost: steps.length,
        values: next,
        note: 'There is no address to jump to, so you follow pointers from the head.',
      };
    }
    case 'search': {
      for (let index = 0; index < n; index++) {
        steps.push({
          index,
          action: 'read',
          values: [...next],
          message: `Check the node at position ${index}: ${next[index]}${next[index] === argument ? ', found it.' : '.'}`,
        });
        if (next[index] === argument) break;
      }
      return {
        kind: 'linked',
        operation,
        steps,
        cost: steps.length,
        values: next,
        note: 'Exactly the same walk as the array. Searching is where they tie.',
      };
    }
    case 'insert-front': {
      next.unshift(argument);
      steps.push({
        index: 0,
        action: 'relink',
        values: [...next],
        message: `Point the new node at the old head, then move the head.`,
      });
      return {
        kind: 'linked',
        operation,
        steps,
        cost: 1,
        values: next,
        note: 'Nothing moves. Only one pointer changes.',
      };
    }
    case 'insert-end': {
      for (let hop = 0; hop < n; hop++) {
        steps.push({
          index: hop,
          action: 'hop',
          values: [...next],
          message: `Follow the pointer past position ${hop}.`,
        });
      }
      next.push(argument);
      steps.push({
        index: n,
        action: 'relink',
        values: [...next],
        message: `Link the last node to the new node.`,
      });
      return {
        kind: 'linked',
        operation,
        steps,
        cost: steps.length,
        values: next,
        note: 'With no tail pointer the end can only be reached by walking there.',
      };
    }
    case 'delete-front': {
      next.shift();
      steps.push({
        index: 0,
        action: 'relink',
        values: [...next],
        message: `Move the head to the second node. The first is now unreachable.`,
      });
      return {
        kind: 'linked',
        operation,
        steps,
        cost: 1,
        values: next,
        note: 'One pointer change, whatever the length.',
      };
    }
  }
}

export function runOperation(
  values: readonly number[],
  kind: ListKind,
  operation: ListOperation,
  argument = 0,
): ListRun {
  return kind === 'array' ? runArray(values, operation, argument) : runLinked(values, operation, argument);
}

/** The same operation on both structures, with the cheaper one named. */
export function compareStructures(
  values: readonly number[],
  operation: ListOperation,
  argument = 0,
): ListComparison {
  const array = runArray(values, operation, argument);
  const linked = runLinked(values, operation, argument);
  return {
    operation,
    array,
    linked,
    winner: array.cost === linked.cost ? null : array.cost < linked.cost ? 'array' : 'linked',
  };
}
