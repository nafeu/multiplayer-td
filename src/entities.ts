import { DEFAULT_FORMATION_SHAPE } from './constants';
import HomeBase from './entities/HomeBase';
import Pointer from './entities/Pointer';
import { Unit } from './entities/Unit';

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

export default entities;
