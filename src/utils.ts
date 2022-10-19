import {
  TILE_SIZE,
  VALID_UNIT_POSITION,
  AVAILABLE_FORMATIONS,
  OCCUPIED_UNIT_POSITION
} from './constants';
import map from './map';
import entities from './entities.ts';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export const clone = (b) => JSON.parse(JSON.stringify(b));

export const isDebugMode = !(
  window.location.href.indexOf('preview=true') != -1
);

export const getPositionByTile = (coordinate: number) => {
  return coordinate * TILE_SIZE + TILE_SIZE / 2;
};

const ID_MAP = {};

export const generateId = (key: string) => {
  ID_MAP[key] = (ID_MAP[key] ?? 0) + 1;
  return `${key}:${ID_MAP[key]}`;
};

export const getTileByPosition = (x: number, y: number) => {
  const j = Math.floor(x / TILE_SIZE);
  const i = Math.floor(y / TILE_SIZE);

  return { i, j }
}

export const sendUiAlert = (alertInfo: object) => {
  // TODO: Remove this and utilize a proper UI alert class
  console.info(alertInfo);
}

export const getValidUnitFormation = (
  x: number,
  y: number,
  units: array
) => {
  const { i, j } = getTileByPosition(x, y);

  const spots = AVAILABLE_FORMATIONS[
    entities.interaction.formationShape
  ].map(formation => {
    return {
      i: i + formation.i,
      j: j + formation.j
    }
  })

  const output = [];

  let unitsIndex = 0;
  let spotIndex = 0;

  while (unitsIndex < units.length && spotIndex < spots.length) {
    const unitTilePosition = getTileByPosition(
      units[unitsIndex].x,
      units[unitsIndex].y
    );

    const spotColumn = spots[spotIndex].i;
    const spotRow = spots[spotIndex].j

    const hasColumnOption = spotColumn >= 0 && map.unitValid.length > spotColumn;
    const hasRowOption = spotRow >= 0 && map.unitValid[0].length > spotRow;

    const isValidPlacement = hasColumnOption
      && hasRowOption
      && map.unitValid[spotColumn][spotRow] === VALID_UNIT_POSITION;

    const selectedUnitAlreadyHere = unitTilePosition.i === spotColumn
      && unitTilePosition.j === spotRow

    if (isValidPlacement || selectedUnitAlreadyHere) {
      output.push(spots[spotIndex]);

      unitsIndex += 1;
    }

    spotIndex += 1;
  }

  return output;
}

// TODO: Refactor and move this to some kind of user interaction class
export const rotateFormationShape = () => {
  if (entities.interaction.formationShape === 'auto') {
    entities.interaction.formationShape = 'horizontal';
  } else if (entities.interaction.formationShape === 'horizontal') {
    entities.interaction.formationShape = 'vertical';
  } else {
    entities.interaction.formationShape = 'auto';
  }
}

export const isTileFreeAtPosition = (x: number, y: number) => {
  const { i: row, j: col } = getTileByPosition(x, y);

  return map
    .unitValid[row][col] !== OCCUPIED_UNIT_POSITION;
}
