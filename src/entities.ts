import { DEFAULT_FORMATION_SHAPE } from './constants';
import { Unit } from './entities/Unit';

const entities = {
  player: {
    1: null,
  },
  bullets: null as Phaser.GameObjects.Group | null,
  enemyGroup: null as Phaser.GameObjects.Group | null,
  unitGroup: null as Phaser.GameObjects.Group | null,
  pointer: null as Phaser.GameObjects.GameObject | null,
  selectedUnits: [] as Array<Unit>,
  interaction: {
    formationShape: DEFAULT_FORMATION_SHAPE
  }
};

export default entities;
