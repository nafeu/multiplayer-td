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
export const ENEMY_PATH_COLOR = 0xecf0f1;

export const UNIT_FIRE_RANGE = 100;
export const UNIT_FIRE_RATE_MS = 100;
export const UNIT_SQUAD_SIZE = 5;
export const UNIT_SNAP_DISTANCE = 2;
export const UNIT_MOVING_TINT = 0xc0392b;
export const UNIT_SELECTED_TILE_BORDER = 0x0000ff;
export const UNIT_SELECTED_TINT = 0xf1c40f;
export const UNIT_PREPARING_TINT = 0x808080;
export const UNIT_PREPARING_ANIMATION_DELAY_MS = 2_000;

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

export const SELECTION_RECTANGLE_COLOR = 0x1d7196;
export const SELECTION_RECTANGLE_OPACITY = 0.5;

export const INDICATOR_VALID_SELECTION_COLOR = 0x27ae60;
export const INDICATOR_INVALID_SELECTION_COLOR = 0xc0392b;
export const INDICATOR_OPACITY = 0.75;

type TileCoordinateOffset = {
  i: number;
  j: number;
};

export const AVAILABLE_FORMATIONS: {
  [key: string]: Array<TileCoordinateOffset>;
} = {
  auto: [
    { i: 0, j: 0 },
    { i: 0, j: 1 },
    { i: 1, j: 0 },
    { i: 0, j: -1 },
    { i: -1, j: 0 },
    { i: 1, j: 1 },
    { i: 1, j: -1 },
    { i: -1, j: 1 },
    { i: -1, j: -1 },
  ],
  horizontal: [
    { i: 0, j: 0 },
    { i: 0, j: 1 },
    { i: 0, j: -1 },
    { i: 0, j: 2 },
    { i: 0, j: -2 },
  ],
  vertical: [
    { i: 0, j: 0 },
    { i: 1, j: 0 },
    { i: -1, j: 0 },
    { i: 2, j: 0 },
    { i: -2, j: 0 },
  ],
};

export const DEFAULT_FORMATION_SHAPE = 'auto';

export const GRID_LINE_COLOR = 0x34495e;
