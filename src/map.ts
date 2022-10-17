import Phaser from 'phaser';

import {
  BOARD_HEIGHT_TILE,
  BOARD_WIDTH_TILE,
  VALID_UNIT_POSITION,
  INVALID_TURRENT_POSITION,
  ORIENTATION_VERTICAL,
  ORIENTATION_HORIZONTAL,
  PATH_SEGMENTS
} from './constants';

export const MAP_GRID = Array.from({ length: BOARD_HEIGHT_TILE }).map(() =>
  Array.from({ length: BOARD_WIDTH_TILE }).fill(VALID_UNIT_POSITION)
);

(function removePathTilesForUnit(map, segments) {
  segments.forEach((args) => {
    const { orientation, start, size } = args;

    const current = { ...start };

    for (let i = 0; i < size; i++) {
      map[current.y][current.x] = INVALID_TURRENT_POSITION;

      if (orientation === ORIENTATION_VERTICAL) {
        current.y += 1;
      } else if (orientation === ORIENTATION_HORIZONTAL) {
        current.x += 1;
      } else {
        throw new Error('Invalid Path Segment');
      }
    }
  });
})(MAP_GRID, PATH_SEGMENTS);

const map = {
  path: null as Phaser.Curves.Path | null,
  graphics: null as Phaser.GameObjects.Graphics | null,
  unitValid: MAP_GRID,
};

export default map;
