import { Scene } from 'phaser';

import { DEFAULT_FORMATION_SHAPE, UNIT_SQUAD_SIZE } from './constants';
import Bullet from './entities/Bullet';
import Enemy from './entities/Enemy';
import HomeBase from './entities/HomeBase';
import Pointer from './entities/Pointer';
import { Unit } from './entities/Unit';
import { Game } from './scenes/Game';

let selectedUnitsReference: Array<Unit> = [];
const selectedUnitsManager = {
  addUnit: (unit: Unit) => {
    selectedUnitsReference.includes(unit) || selectedUnitsReference.push(unit);
  },
  hasUnit: (unit: Unit) => selectedUnitsReference.includes(unit),
  getUnits: (): readonly Unit[] => selectedUnitsReference.slice(),
  clearUnits: () => (selectedUnitsReference = []),
  removeUnit: (unit: Unit) => {
    selectedUnitsReference = selectedUnitsReference.filter(
      (curr: Unit) => curr !== unit
    );
  },
  toggleUnit: (unit: Unit) => {
    if (selectedUnitsReference.includes(unit)) {
      selectedUnitsReference = selectedUnitsReference.filter(
        (curr: Unit) => curr !== unit
      );
    } else {
      selectedUnitsReference.push(unit);
    }
  },
  size: () => selectedUnitsReference.length,
};

const entities = {
  player: {
    1: null,
  },
  bullets: null as Phaser.GameObjects.Group | null,
  enemyGroup: null as Phaser.GameObjects.Group | null,
  unitGroup: null as Phaser.GameObjects.Group | null,
  homeBase: null as HomeBase | null,
  pointer: null as Pointer | null,
  selectedUnits: [] as Array<Unit>,
  selectedUnitGroup: selectedUnitsManager,
  interaction: {
    formationShape: DEFAULT_FORMATION_SHAPE,
  },
};

export type ValidFormationShapes = 'horizontal' | 'vertical' | 'auto';

export const entityManagerFactory = (scene: Game) => {
  return {
    player: {
      1: null,
    },
    bullets: scene.physics.add.group({
      classType: Bullet,
      createCallback: (bullet: Bullet) => {
        bullet.setCorrectBoundingBox();
      },
      runChildUpdate: true,
    } as Phaser.Types.GameObjects.Group.GroupCreateConfig),
    enemyGroup: scene.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
      createCallback: (enemy: Enemy) => {
        enemy.setCorrectBoundingBox();
      },
      // removeCallback doesn't get triggered for recycled objects - don't rely on this for resets
      // removeCallback: function (enemy: typeof Enemy) {
      //   console.log('### Enemy Removed', enemy.id);
      // },
    } as Phaser.Types.GameObjects.Group.GroupCreateConfig),
    unitGroup: scene.add.group({
      classType: Unit,
      runChildUpdate: true,
      maxSize: UNIT_SQUAD_SIZE,
      // use createCallback to pass the scene for post initialization stuff
      // createCallback: function (unit: Unit) {
      //   console.log('### Unit Created', unit.id, unit);
      //   unit.postInitialize(map, getEnemy, () => entities.bullets.get());
      // },
    }),
    homeBase: new HomeBase(scene),
    pointer: new Pointer(scene),
    selectedUnits: [] as Array<Unit>,
    selectedUnitGroup: selectedUnitsManager,
    interaction: {
      formationShape: DEFAULT_FORMATION_SHAPE as ValidFormationShapes,
    },
  };
};

export type EntityManager = ReturnType<typeof entityManagerFactory>;

// export default entities;
