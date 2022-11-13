import { AnyEventObject, createMachine, interpret } from 'xstate';
import { UNIT_PREPARING_ANIMATION_DELAY_MS } from '../constants';
import { getLogger } from '../logger';

import Unit from './Unit';

const logger = getLogger('UNIT_STATE_MACHINE');

// Use Visualizer for testing state machine
// https://stately.ai/viz
//
// Copy and paste everything below this line
// const UNIT_PREPARING_ANIMATION_DELAY_MS = 2000;
// type Unit = {}

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

const PLACEHOLDER_ACTIONS = {
  queueNewMove: (context: Context, event: AnyEventObject) => {
    logger.log('queueing path', event.path);
  },
  startNewQueuedMove: (context: Context, event: AnyEventObject) => {
    logger.log('start on new queued path');
  },
  prepareToMove: (context: Context, event: AnyEventObject) => {
    logger.log('preparing to move from seiged position');
  },
  queueTransitionToMove: (context: Context, event: AnyEventObject) => {
    logger.log('queuing delayed transition using timer');
    setTimeout(() => {
      logger.log(
        '### please trigger the state transition using COMMIT_MOVE_TO action'
      );
    }, UNIT_PREPARING_ANIMATION_DELAY_MS);
  },
  startMovingToDestination: (context: Context, event: AnyEventObject) => {
    logger.log('moving to position');
  },
  prepareToSeige: (context: Context, event: AnyEventObject) => {
    logger.log('preparing to seiged');
  },
  queueTransitionToSeige: (context: Context, event: AnyEventObject) => {
    logger.log('queuing delayed transition using timer');
    setTimeout(() => {
      logger.log(
        '### please trigger the state transition using COMMIT_SEIGE action'
      );
    }, UNIT_PREPARING_ANIMATION_DELAY_MS);
  },
  updateQueuedDestination: (context: Context, event: AnyEventObject) => {
    logger.log('queueing new position');
  },
  updateDestination: (context: Context, event: AnyEventObject) => {
    logger.log('moving towards new position');
  },
  transitionToSiege: (context: Context, event: AnyEventObject) => {
    logger.log('transition to siege');
  },
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
        always: [
          {
            target: STATES.PREPARING_TO_MOVE,
            cond: unitHasQueuedPath,
            actions: ['startNewQueuedMove'],
          },
        ],
        on: {
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
            actions: ['updateQueuedDestination'],
          },
          [_PRIVATE_ACTIONS.COMMIT_MOVE_TO]: {
            target: STATES.MOVING,
            actions: ['startMovingToDestination'],
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
            actions: ['transitionToSiege'],
          },
        },
      },
    },
  },
  {
    actions: PLACEHOLDER_ACTIONS,
  }
);

export function boundStateMachine(unit: Unit) {
  const boundMachine = fetchMachine.withContext({ unit }).withConfig({
    actions: {
      queueNewMove: (context, event) => {
        logger.log(`### [${context.unit.id}]: queueing path`, event.path);
        context.unit.queueNewPath(event.path as MapPath);
      },
      startNewQueuedMove: (context, event) => {
        logger.log(
          `### [${context.unit.id}]: start on new queued path`,
          context.unit._queuedPath
        );
      },
      prepareToMove: (context, event) => {
        logger.log(
          `### [${context.unit.id}]: preparing to move from seiged position`
        );
        context.unit.queueNewPath(event.path as MapPath);
      },
      queueTransitionToMove: (context, event) => {
        logger.log(
          `### [${context.unit.id}]: queuing delayed transition using phaser timer`
        );
        logger.assert(
          !!context.unit._queuedPath.length,
          `### [${context.unit.id}]: has no _queuedPath`,
          context.unit._queuedPath
        );
        context.unit.scene.time.delayedCall(
          UNIT_PREPARING_ANIMATION_DELAY_MS,
          () => {
            logger.log(
              `### [${context.unit.id}]: commiting move to`,
              context.unit._queuedPath
            );
            context.unit._machine.send({
              type: _PRIVATE_ACTIONS.COMMIT_MOVE_TO,
            });
          }
        );
      },
      startMovingToDestination: (context, event) => {
        // no path pathload since it's emitted by the internal state transition,
        // use unit.activePath or just call unit.move()
        logger.log(
          `### [${context.unit.id}]: moving to position`,
          context.unit._queuedPath
        );
        context.unit.startMovingToQueuedPath();
      },
      updateQueuedDestination: (context, event) => {
        logger.log(
          `### [${context.unit.id}]: queueing new position`,
          (event.path as MapPath).at(-1),
          'triggered by',
          event.type,
          'using path',
          event.path
        );
        context.unit.queueNewPath(event.path as MapPath);
      },
      updateDestination: (context, event) => {
        logger.log(
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
        logger.log(`### [${context.unit.id}]: preparing to be seiged`);
      },
      queueTransitionToSeige: (context, event) => {
        logger.log(
          `### [${context.unit.id}]: queuing delayed transition using phaser timer`
        );
        context.unit.scene.time.delayedCall(
          UNIT_PREPARING_ANIMATION_DELAY_MS,
          () => {
            logger.log(`### [${context.unit.id}]: commiting siege`);
            context.unit._machine.send({ type: _PRIVATE_ACTIONS.COMMIT_SEIGE });
          }
        );
      },
      transitionToSiege: (context, event) => {
        logger.log(`### [${context.unit.id}]: transition to siege`);
      },
    },
  });

  return interpret(boundMachine);
}
