import {
  TILE_SIZE,
  VALID_UNIT_POSITION,
  AVAILABLE_FORMATIONS,
  OCCUPIED_UNIT_POSITION,
  UNIT_CROSSING,
} from './constants';
import entities from './entities';
import Unit from './entities/Unit';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export const clone = (b): unknown => JSON.parse(JSON.stringify(b));

const ID_MAP: Record<string, number> = {};

export const generateId = (key: string) => {
  ID_MAP[key] = (ID_MAP[key] ?? 0) + 1;
  return `${key}:${ID_MAP[key]}`;
};

/*
  TODO: 'Window' type is not being detected from DOM lib, problematic
        for typechecking, we need to fix this.
*/
export const isDebugMode = !window.location.search.includes('preview=true');

export const hasDebugFlag = (flag: string) =>
  window.location.search.includes(`${flag}=true`);

export const getPositionByTile = (coordinate: number) => {
  return coordinate * TILE_SIZE + TILE_SIZE / 2;
};

/*
  TODO: Remove this and utilize tilemaps built-in
        "get tile coordinate by position" func
*/
export const getTileRowColBySceneXY = (
  x: number,
  y: number
): TileCoordinates => {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);

  return { row, col };
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
  units: readonly Unit[],
  map: number[][]
): Array<TileCoordinates> => {
  const { row, col } = getTileRowColBySceneXY(x, y);

  const spots = AVAILABLE_FORMATIONS[entities.interaction.formationShape].map(
    (formation) => {
      return {
        row: row + formation.row,
        col: col + formation.col,
      };
    }
  );

  const output: Array<TileCoordinates> = [];

  let unitsIndex = 0;
  let spotIndex = 0;

  while (unitsIndex < units.length && spotIndex < spots.length) {
    const unitTilePosition = getTileRowColBySceneXY(
      units[unitsIndex].x,
      units[unitsIndex].y
    );

    const spotRow = spots[spotIndex].row;
    const spotCol = spots[spotIndex].col;

    const hasColumnOption = spotRow >= 0 && map.length > spotRow;
    const hasRowOption = spotCol >= 0 && map[0].length > spotCol;

    const isValidPlacement =
      hasColumnOption &&
      hasRowOption &&
      map[spotRow][spotCol] === VALID_UNIT_POSITION;

    const selectedUnitAlreadyHere =
      unitTilePosition.row === spotRow && unitTilePosition.col === spotCol;

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

export const isTileFreeAtPosition = (x: number, y: number, map: number[][]) => {
  const { row, col } = getTileRowColBySceneXY(x, y);

  return (
    row > 0 &&
    col > 0 &&
    map[row][col] !== OCCUPIED_UNIT_POSITION &&
    map[row][col] !== UNIT_CROSSING
  );
};
