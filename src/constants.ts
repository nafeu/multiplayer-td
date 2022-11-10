export const BOARD_BACKGROUND_COLOR = '#16a085';
export const BOARD_WIDTH = 640;
export const BOARD_HEIGHT = 512;

export const SPRITE_SIZE = 32;

export const SPRITE_ATLAS_NAME = 'sprites';

export const TANK_IMG_NAME = '18.png';
export const UNIT_IMG_NAME__NORMAL = '18.png';
export const UNIT_IMG_NAME__SPEEDY = 'speedy.png';
export const UNIT_IMG_NAME__CHONKY = 'chonky.png';
export const UNIT_IMG_NAME__SNIPEY = 'snipey.png';
export const BULLET_IMG_NAME = '17.png';
export const ENEMY_IMG_NAME = '05.png';

export const TILE_SIZE = SPRITE_SIZE;

export const BULLET_DAMAGE = 50;
export const ENEMY_HP = 1000;
export const ENEMY_SPAWN_RATE_MS = 1000;
export const ENEMY_SPEED = 1 / 1000;

export const HOMEBASE_HP = 100_000;
export const HOMEBASE__SHAKE_DURATION = 200;
export const HOMEBASE__SHAKE_INTENSITY = 0.0125 / 2;

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
export const UNIT_CROSSING = 2;

export const ORIENTATION_HORIZONTAL = 'horizontal';
export const ORIENTATION_VERTICAL = 'vertical';

export const SELECTION_RECTANGLE_COLOR = 0x1d7196;
export const SELECTION_RECTANGLE_OPACITY = 0.5;

export const INDICATOR_VALID_SELECTION_COLOR = 0x27ae60;
export const INDICATOR_INVALID_SELECTION_COLOR = 0xc0392b;
export const INDICATOR_OPACITY = 0.75;

export const AVAILABLE_FORMATIONS: {
  [key: string]: Array<TileCoordinates>;
} = {
  auto: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: -1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: -1 },
    { row: -1, col: 1 },
    { row: -1, col: -1 },
  ],
  horizontal: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: -1 },
    { row: 0, col: 2 },
    { row: 0, col: -2 },
  ],
  vertical: [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: -1, col: 0 },
    { row: 2, col: 0 },
    { row: -2, col: 0 },
  ],
};

export const DEFAULT_FORMATION_SHAPE = 'auto';

export const GLOBAL_KEYS__MENU_KEY = 'ESC';
