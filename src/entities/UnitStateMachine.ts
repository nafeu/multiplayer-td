import { createMachine, interpret } from 'xstate';
import { UNIT_PREPARING_ANIMATION_DELAY_MS } from '../constants';
import { MapPath } from '../map';

import Unit from './Unit';

// Use Visualizer for testing state machine
// Copy and paste everything below this line
// https://stately.ai/viz

interface Context {
  unit: Unit;
}

export const ACTIONS = {
  MOVE_TO: 'MOVE_TO',
  STOP: 'STOP',
};

// We cannot use xstates inbuilt timers,
// because it will fall out of sync with the Phaser timer.
// We need to provide actions that can be triggered by Phaser's ticker,
// but these actions are only for transitions managed by the state machine,
// and should not be called externally.
const _PRIVATE_ACTIONS = {
  COMMIT_MOVE_TO: 'COMMIT_MOVE_TO',
  COMMIT_SEIGE: 'COMMIT_SEIGE',
};

export const STATES = {
  SEIGED: 'SEIGED',
  PREPARING_TO_MOVE: 'PREPARING_TO_MOVE',
  MOVING: 'MOVING',
  PREPARING_TO_SEIGE: 'PREPARING_TO_SEIGE',
};

const unitHasQueuedPath = (context: Context) => context.unit.hasQueuedPath();

// Note: assumes all MOVE_TOs are valid
const fetchMachine = createMachine<Context>(
  {
    id: 'unitMovementMachine',
    initial: STATES.SEIGED,
    context: {
      unit: {} as Unit,
    },
    states: {
      [STATES.SEIGED]: {
        on: {
          '': [{ target: STATES.PREPARING_TO_MOVE, cond: unitHasQueuedPath }],
          [ACTIONS.MOVE_TO]: {
            target: STATES.PREPARING_TO_MOVE,
            actions: ['prepareToMove'],
          },
        },
      },
      [STATES.PREPARING_TO_MOVE]: {
        entry: ['queueTransitionToMove'],
        on: {
          [ACTIONS.MOVE_TO]: {
            actions: ['updateDestination'],
          },
          [_PRIVATE_ACTIONS.COMMIT_MOVE_TO]: {
            target: STATES.MOVING,
            actions: ['moveTo'],
          },
        },
      },
      [STATES.MOVING]: {
        on: {
          [ACTIONS.STOP]: {
            target: STATES.PREPARING_TO_SEIGE,
            actions: ['prepareToSeige'],
          },
          [ACTIONS.MOVE_TO]: {
            target: [STATES.MOVING],
            actions: ['updateDestination'],
          },
        },
      },
      [STATES.PREPARING_TO_SEIGE]: {
        entry: ['queueTransitionToSeige'],
        on: {
          [ACTIONS.MOVE_TO]: {
            // This can be removed if we no longer want
            // to queue move actions during this transition
            actions: ['queueNewMove'],
          },
          [_PRIVATE_ACTIONS.COMMIT_SEIGE]: {
            target: STATES.SEIGED,
            actions: ['seiged'],
          },
        },
      },
    },
  },
  {
    actions: {
      queueNewMove: (context, event) => {
        console.log('queueing path', event.path);
      },
      prepareToMove: (context, event) => {
        console.log('preparing to move from seiged position');
      },
      queueTransitionToMove: (context, event) => {
        console.log('queuing delayed transition using timer');
        setTimeout(() => {
          console.log(
            '### please trigger the state transition using COMMIT_MOVE_TO action'
          );
        }, UNIT_PREPARING_ANIMATION_DELAY_MS);
      },
      moveTo: (context, event) => {
        console.log('moving to position');
      },
      prepareToSeige: (context, event) => {
        console.log('preparing to seiged');
      },
      queueTransitionToSeige: (context, event) => {
        console.log('queuing delayed transition using timer');
        setTimeout(() => {
          console.log(
            '### please trigger the state transition using COMMIT_SEIGE action'
          );
        }, UNIT_PREPARING_ANIMATION_DELAY_MS);
      },
      updateDestination: (context, event) => {
        console.log('moving towards new position');
      },
      seiged: (context, event) => {
        console.log('seiged');
      },
    },
  }
);

export function boundStateMachine(unit: Unit) {
  const boundMachine = fetchMachine.withContext({ unit }).withConfig({
    actions: {
      queueNewMove: (context, event) => {
        console.log(`### [${context.unit.id}]: queueing path`, event.path);
        context.unit.queueNewPath(event.path as MapPath);
      },
      prepareToMove: (context, event) => {
        console.log(
          `### [${context.unit.id}]: preparing to move from seiged position`
        );
        context.unit.queueNewPath(event.path as MapPath);
      },
      queueTransitionToMove: (context, event) => {
        console.log(
          `### [${context.unit.id}]: queuing delayed transition using phaser timer`
        );
        context.unit.scene.time.delayedCall(
          UNIT_PREPARING_ANIMATION_DELAY_MS,
          () => {
            console.log(`### [${context.unit.id}]: commiting move to`);
            context.unit._machine.send({
              type: _PRIVATE_ACTIONS.COMMIT_MOVE_TO,
            });
          }
        );
      },
      moveTo: (context, event) => {
        // no path pathload since it's emitted by the internal state transition,
        // use unit.activePath or just call unit.move()
        console.log(`### [${context.unit.id}]: moving to position`);
        context.unit.startMovingToQueuedPath();
      },
      updateDestination: (context, event) => {
        console.log(
          `### [${context.unit.id}]: moving towards new position`,
          (event.path as MapPath).at(-1),
          'triggered by',
          event.type,
          'using path',
          event.path
        );
        context.unit.overrideActivePath(event.path as MapPath);
      },
      prepareToSeige: (context, event) => {
        console.log(`### [${context.unit.id}]: preparing to be seiged`);
      },
      queueTransitionToSeige: (context, event) => {
        console.log(
          `### [${context.unit.id}]: queuing delayed transition using phaser timer`
        );
        context.unit.scene.time.delayedCall(
          UNIT_PREPARING_ANIMATION_DELAY_MS,
          () => {
            console.log(`### [${context.unit.id}]: commiting siege`);
            context.unit._machine.send({ type: _PRIVATE_ACTIONS.COMMIT_SEIGE });
          }
        );
      },
      seiged: (context, event) => {
        console.log(`### [${context.unit.id}]: seiged`);
      },
    },
  });

  return interpret(boundMachine);
}
