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

export const STATES = {
  SEIGED: 'SEIGED',
  PREPARING_TO_MOVE: 'PREPARING_TO_MOVE',
  MOVING: 'MOVING',
  PREPARING_TO_SEIGE: 'PREPARING_TO_SEIGE',
};

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
          [ACTIONS.MOVE_TO]: {
            target: STATES.PREPARING_TO_MOVE,
            actions: ['prepareToMove'],
          },
        },
      },
      [STATES.PREPARING_TO_MOVE]: {
        on: {
          [ACTIONS.MOVE_TO]: {
            actions: ['updateDestination'],
          },
        },
        after: {
          [UNIT_PREPARING_ANIMATION_DELAY_MS]: {
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
        on: {
          [ACTIONS.MOVE_TO]: {
            // TODO: handle move commands when transitioning to seige mode
            // target: [STATES.MOVING],
            // actions: ['updateDestination'],
          },
        },
        after: {
          [UNIT_PREPARING_ANIMATION_DELAY_MS]: {
            target: STATES.SEIGED,
            actions: ['seiged'],
          },
        },
      },
    },
  },
  {
    actions: {
      prepareToMove: (context, event) => {
        console.log('preparing to move from seiged position');
      },
      moveTo: (context, event) => {
        console.log('moving to position');
      },
      prepareToSeige: (context, event) => {
        console.log('preparing to seiged');
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
      prepareToMove: (context, event) => {
        console.log(
          `### [${context.unit.id}]: preparing to move from seiged position`
        );
        console.assert(
          context.unit._queuedPath === event.path,
          `${unit.id} failed to set _queuedPath`
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
      seiged: (context, event) => {
        console.log(`### [${context.unit.id}]: seiged`);
      },
    },
  });

  return interpret(boundMachine);
}
