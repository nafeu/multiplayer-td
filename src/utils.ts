import {
  TILE_SIZE,
  VALID_UNIT_POSITION,
  AVAILABLE_FORMATIONS,
  OCCUPIED_UNIT_POSITION,
} from './constants';
import map from './map';
import entities from './entities';
import Unit from './entities/Unit';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export const clone = (b): unknown => JSON.parse(JSON.stringify(b));

/*
  TODO: 'Window' type is not being detected from DOM lib, problematic
        for typechecking, we need to fix this.
*/
export const isDebugMode = !window.location.search.includes('preview=true');

export const getPositionByTile = (coordinate: number) => {
  return coordinate * TILE_SIZE + TILE_SIZE / 2;
};

const ID_MAP: Record<string, number> = {};

export const generateId = (key: string) => {
  ID_MAP[key] = (ID_MAP[key] ?? 0) + 1;
  return `${key}:${ID_MAP[key]}`;
};

export const getTileCoordinatesByPosition = (
  x: number,
  y: number
): TileCoordinates => {
  const j = Math.floor(x / TILE_SIZE);
  const i = Math.floor(y / TILE_SIZE);

  return { i, j };
};

/*
  TODO: Remove this and utilize a proper UI alert class.
        Set an 'unknown' type for the time being so we can
        experiment with different alertInfo payloads
*/
export const sendUiAlert = (alertInfo: unknown) => {
  console.info(alertInfo);
};

export const getValidUnitFormation = (
  x: number,
  y: number,
  units: readonly Unit[]
): Array<TileCoordinates> => {
  const { i, j } = getTileCoordinatesByPosition(x, y);

  const spots = AVAILABLE_FORMATIONS[entities.interaction.formationShape].map(
    (formation) => {
      return {
        i: i + formation.i,
        j: j + formation.j,
      };
    }
  );

  const output: Array<TileCoordinates> = [];

  let unitsIndex = 0;
  let spotIndex = 0;

  while (unitsIndex < units.length && spotIndex < spots.length) {
    const unitTilePosition = getTileCoordinatesByPosition(
      units[unitsIndex].x,
      units[unitsIndex].y
    );

    const spotColumn = spots[spotIndex].i;
    const spotRow = spots[spotIndex].j;

    const hasColumnOption =
      spotColumn >= 0 && map.unitValid.length > spotColumn;
    const hasRowOption = spotRow >= 0 && map.unitValid[0].length > spotRow;

    const isValidPlacement =
      hasColumnOption &&
      hasRowOption &&
      map.unitValid[spotColumn][spotRow] === VALID_UNIT_POSITION;

    const selectedUnitAlreadyHere =
      unitTilePosition.i === spotColumn && unitTilePosition.j === spotRow;

    if (isValidPlacement || selectedUnitAlreadyHere) {
      output.push(spots[spotIndex]);

      unitsIndex += 1;
    }

    spotIndex += 1;
  }

  return output;
};

// TODO: Refactor and move this to some kind of user interaction class
export const rotateFormationShape = () => {
  if (entities.interaction.formationShape === 'auto') {
    entities.interaction.formationShape = 'horizontal';
  } else if (entities.interaction.formationShape === 'horizontal') {
    entities.interaction.formationShape = 'vertical';
  } else {
    entities.interaction.formationShape = 'auto';
  }
};

export const isTileFreeAtPosition = (x: number, y: number) => {
  const { i: row, j: col } = getTileCoordinatesByPosition(x, y);

  return map.unitValid[row][col] !== OCCUPIED_UNIT_POSITION;
};
