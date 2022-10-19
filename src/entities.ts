import { DEFAULT_FORMATION_SHAPE } from './constants';

const entities = {
  player: {
    1: null,
  },
  bullets: null as Phaser.GameObjects.Group | null,
  enemyGroup: null as Phaser.GameObjects.Group | null,
  unitGroup: null as Phaser.GameObjects.Group | null,
  pointer: null as Phaser.GameObjects.GameObject | null,
  selectedUnits: [],
  interaction: {
    formationShape: DEFAULT_FORMATION_SHAPE
  }
};

export default entities;
