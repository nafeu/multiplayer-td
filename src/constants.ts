export const BOARD_BACKGROUND_COLOR = '#16a085';
export const BOARD_WIDTH = 640;
export const BOARD_HEIGHT = 512;

export const SPRITE_SIZE = 32;

export const SPRITE_ATLAS_NAME = 'sprites';

export const TANK_IMG_NAME = '18.png';
export const BULLET_IMG_NAME = '17.png';
export const ENEMY_IMG_NAME = '05.png';

export const TILE_SIZE = SPRITE_SIZE;

export const BULLET_DAMAGE = 50;
export const ENEMY_HP = 1000;
export const ENEMY_SPAWN_RATE_MS = 1000;
export const ENEMY_SPEED = 1 / 10000;

export const UNIT_FIRE_RANGE = 100;
export const UNIT_FIRE_RATE_MS = 100;
export const UNIT_SQUAD_SIZE = 5;
export const UNIT_SNAP_DISTANCE = 2;
export const UNIT_MOVING_TINT = 0xc0392b;
export const UNIT_SELECTED_TINT = 0xf1c40f;

export const BOARD_WIDTH_TILE = BOARD_WIDTH / TILE_SIZE;
export const BOARD_HEIGHT_TILE = BOARD_HEIGHT / TILE_SIZE;

export const VALID_UNIT_POSITION = 0;
export const INVALID_TURRENT_POSITION = -1;
export const OCCUPIED_UNIT_POSITION = 1;

export const ORIENTATION_HORIZONTAL = 'horizontal';
export const ORIENTATION_VERTICAL = 'vertical';

export const PATH_SEGMENTS = [
  {
    orientation: ORIENTATION_VERTICAL,
    start: { x: 2, y: 0 },
    size: 6,
  },
  {
    orientation: ORIENTATION_HORIZONTAL,
    start: { x: 2, y: 5 },
    size: 13,
  },
  {
    orientation: ORIENTATION_VERTICAL,
    start: { x: 14, y: 5 },
    size: 11,
  },
];
