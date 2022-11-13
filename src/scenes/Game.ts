import Phaser from 'phaser';
import EasyStar from 'easystarjs';

import { Unit, UnitType } from '../entities/Unit';
import Enemy from '../entities/Enemy';
import Bullet from '../entities/Bullet';

import { EntityManager, entityManagerFactory } from '../entities';

import { title as PauseMenuScene } from './PauseMenu';
import { title as GameOverScene } from './GameOver';

import {
  sendUiAlert,
  getValidUnitFormation,
  rotateFormationShape,
  isTileFreeAtPosition,
  getPositionForTileCoordinates,
} from '../utils';

import {
  SPRITE_ATLAS_NAME,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TILE_SIZE,
  UNIT_SQUAD_SIZE,
  ENEMY_SPAWN_RATE_MS,
  VALID_UNIT_POSITION,
  OCCUPIED_UNIT_POSITION,
  SELECTION_RECTANGLE_COLOR,
  SELECTION_RECTANGLE_OPACITY,
  GLOBAL_KEYS__MENU_KEY,
  UNIT_CROSSING,
  INVALID_TURRENT_POSITION,
  HOMEBASE_TEXTURE_NAME,
} from '../constants';
import { getLoggingConfig } from '../logger';
import HomeBase from '../entities/HomeBase';
import { sliceFromTexture } from '../texture-utils';
import { TileProperties } from '../entities/Map';

export const title = 'game';

class LevelConfig {
  tilemapKey: string;
  MAP_LAYER_KEY = 'Below Player';

  constructor(tilemapKey: string) {
    this.tilemapKey = tilemapKey;
  }
}
export class Game extends Phaser.Scene {
  /**
   * TypeScript note:
   * although these attributes are not initialized in the constructor,
   * they are populated in `created` which is where Phaser starts
   * letting you do cool stuff. So this should be okay...
   * */
  enemyPath!: Phaser.Curves.Path;
  entities!: EntityManager;
  finder!: EasyStar.js;
  map!: number[][];
  nextEnemy!: number;
  playerHUD!: Phaser.GameObjects.Text;
  pointer!: Phaser.GameObjects.GameObject;
  scoreboard!: Phaser.GameObjects.Text;
  selection!: Phaser.GameObjects.Rectangle;
  tilemap!: Phaser.Tilemaps.Tilemap;
  tileset!: Phaser.Tilemaps.Tileset;

  currentLevelIdx = 0;
  levels = [new LevelConfig('level-0')];

  kills = 0;

  constructor() {
    super(title);
  }

  preload() {
    // Why so convoluted?
    // - Vite (our bundler) uses BASE_URL, but bun does not
    // - bun prefers to use public/ dir for assets https://github.com/oven-sh/bun#using-bun-with-single-page-apps
    //   however, Vite prefers to use actual directory structure to determine routing
    //   (with a special case for public/ https://vitejs.dev/guide/assets.html#the-public-directory)

    // tl;dr public is for bun (local dev) and BASE_URL is for Vite (bundled deployment using relative paths)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Unreachable code error
    this.load.path = (import.meta.env?.BASE_URL as string) ?? 'public/';

    this.load.atlas(
      SPRITE_ATLAS_NAME,
      'assets/spritesheet.png',
      /*
        ".text" is used to bypass bun dev server turning .json into ESM
        See: https://github.com/oven-sh/bun/issues/1213
      */
      'assets/spritesheet.json.text'
    );
    // load the PNG file
    this.load.image('grass-biome', 'assets/grass-biome.png');

    // load the JSON file
    this.levels.forEach((config) => {
      this.load.tilemapTiledJSON(
        config.tilemapKey,
        `assets/${config.tilemapKey}.tmj`
      );
    });
  }

  currentLevelConfig() {
    return this.levels[this.currentLevelIdx];
  }

  loadCurrentLevel() {
    const levelConfig = this.currentLevelConfig();

    this.enemyPath = drawLegacyEnemyPath(this);

    this.tilemap = this.make.tilemap({ key: levelConfig.tilemapKey });
    this.tileset = this.tilemap.addTilesetImage('grass-biome');
    this.tilemap.createLayer('Below Player', this.tileset);

    const newMapGrid = this.tilemap.getLayer('Below Player').data.map((row) =>
      row.map((col) => {
        const properties = col.properties as TileProperties;

        if (properties.collision || properties.enemyPath) {
          return INVALID_TURRENT_POSITION;
        }

        if (properties.crossing) {
          return UNIT_CROSSING;
        }

        return VALID_UNIT_POSITION;
      })
    );

    this.map = newMapGrid;

    configurePathFindingGrid(this.finder, this.map);

    // value used to control spawn rate of enemies
    this.nextEnemy = 0;

    // TODO: homebase position comes from configuration
    const home = getPositionForTileCoordinates({ row: 12 + 2, col: 15 });
    this.entities.homeBase.setNewPosition(home.x, home.y);

    // TODO: starting positions come from configuration
    Object.keys(UnitType).forEach((unitType, idx) => {
      placeUnit(
        this,
        70 + idx * TILE_SIZE,
        250,
        unitType as keyof typeof UnitType
      );
    });
  }

  loadAdditionalTextures() {
    // TODO: remove after we figure out objects for map
    this.textures.get(HOMEBASE_TEXTURE_NAME).key === '__MISSING' &&
      sliceFromTexture(
        this,
        HOMEBASE_TEXTURE_NAME,
        'grass-biome',
        32 * 3,
        32 * 16
      );
  }

  create() {
    this.finder = new EasyStar.js();

    disableBrowserRightClickMenu(this);

    this.input.keyboard.on(`keydown-${GLOBAL_KEYS__MENU_KEY}`, () => {
      this.scene.pause();
      this.scene.launch(PauseMenuScene);
    });

    this.input.on(
      Phaser.Input.Events.POINTER_DOWN as string,
      this.handlePointerDown,
      this
    );
    this.input.on(
      Phaser.Input.Events.POINTER_MOVE as string,
      this.handlePointerMove,
      this
    );
    this.input.on(
      Phaser.Input.Events.POINTER_UP as string,
      this.handlePointerUp,
      this
    );
    this.input.keyboard.on(
      Phaser.Input.Keyboard.Events.ANY_KEY_DOWN as string,
      this.handleKeyDown,
      this
    );

    this.loadAdditionalTextures();

    this.selection = addSelectionRectangle(this);

    this.entities = entityManagerFactory(this);

    this.add.existing(this.entities.homeBase).setDepth(1);
    this.physics.add.existing(this.entities.homeBase);

    // this is a type helper
    // because the underlying type is a generic Physics.Arcade.GameObjectWithBody
    // and doesn't technically guarantee ordering of the objects being compared
    // so this wrapper is taking responsibility of this assumption
    function wrappedDamageEnemy(enemy: any, bullet: any) {
      return damageEnemy(enemy as Enemy, bullet as Bullet);
    }

    this.physics.add.overlap(
      this.entities.enemyGroup,
      this.entities.bullets,
      wrappedDamageEnemy
    );

    this.physics.add.overlap(
      this.entities.enemyGroup,
      this.entities.homeBase,
      // nasty bug source: ordering of objects in callback is not guaranteed from registration order
      (homebase, enemy) => {
        if (!enemy.active) return;

        const enemyHP = (enemy as Enemy).hp;
        (homebase as HomeBase).receiveDamage(enemyHP);
        (enemy as Enemy).receiveDamage(enemyHP);
      }
    );

    this.scoreboard = this.add
      .text(5, 5, `Kills: 0`, {
        align: 'left',
      })
      .setDepth(1) // above the current depth -- should move to a constant
      .setOrigin(0, 0);

    this.playerHUD = this.add
      .text(BOARD_WIDTH - 5, 5, `Tanks Available: n/a`, {
        align: 'right',
      })
      .setDepth(1) // above the current depth -- should move to a constant
      .setOrigin(1, 0);

    // Scene is initialized at the correct level.
    this.loadCurrentLevel();
  }

  KEYS_TO_WATCH = ['SHIFT', 'CTRL'];

  _getKeyboardCtrlStatusDebugLines() {
    if (getLoggingConfig('DEBUG_HUD__KEYBOARD_STATUS')) {
      return [
        '',
        'Keyboard Keys:',
        '---------------',
        ...this.KEYS_TO_WATCH.map(
          (k) =>
            `${k}: ${this.input.keyboard
              .checkDown(this.input.keyboard.addKey(k))
              .toString()}`
        ),
      ];
    }

    return [];
  }

  _getUnitStatusDebugLines() {
    if (getLoggingConfig('DEBUG_HUD__UNIT_STATUS')) {
      return [
        '',
        'Units:',
        '--------',
        ...this.entities.unitGroup
          .getChildren()
          .map((u) => (u as Unit).toString()),
      ];
    }
    return [];
  }

  onEnemyKilled(enemy: Enemy) {
    this.kills += 1;
  }

  update(time: number, delta: number) {
    this.scoreboard.setText(`Kills: ${this.kills}`);

    this.playerHUD.setText([
      `Level: ${this.currentLevelConfig().tilemapKey}`,
      `Units Available: ${
        UNIT_SQUAD_SIZE - this.entities.unitGroup.getTotalUsed()
      }/${UNIT_SQUAD_SIZE}`,
      // `Units Selected: ${this.entities.selectedUnitGroup.size()}`,
      `Formation: ${this.entities.interaction.formationShape}`,
      ...this._getKeyboardCtrlStatusDebugLines(),
      ...this._getUnitStatusDebugLines(),
      // `${this.entities.homeBase.toString()}`,
    ]);

    const shouldSpawnEnemy = time > this.nextEnemy;

    if (shouldSpawnEnemy) {
      const enemy = this.entities.enemyGroup.get() as Enemy | null;

      if (enemy) {
        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.startOnPath();

        this.nextEnemy = time + ENEMY_SPAWN_RATE_MS;
      }
    }

    this.entities.pointer.update();
    this.entities.homeBase.update(time, delta);

    if (this.entities.homeBase.hp === 0) {
      sendUiAlert({ message: 'GAME OVER' });
      this.scene.pause();
      this.scene.start(GameOverScene);
    }
  }

  handlePointerDown = (pointer: Phaser.Input.Pointer) => {
    const isHoldingCtrlKey = (
      pointer.event as unknown as Phaser.Input.Keyboard.Key
    ).ctrlKey;
    if (isHoldingCtrlKey) {
      sendUiAlert({ info: 'All your tanks are already on the field!' });
      return;
    }

    if (pointer.rightButtonDown()) {
      const validUnitFormation = getValidUnitFormation(
        pointer.x,
        pointer.y,
        this.entities.selectedUnitGroup.getUnits(),
        this.map,
        this.entities.interaction
      );

      const selectedUnitCount = this.entities.selectedUnitGroup.size();
      const hasSpaceForUnits = validUnitFormation.length >= selectedUnitCount;

      if (
        hasSpaceForUnits &&
        isTileFreeAtPosition(pointer.x, pointer.y, this.map)
      ) {
        this.finder.setGrid(this.map);

        this.entities.selectedUnitGroup
          .getUnits()
          .forEach((selectedUnit: Unit, index) => {
            const originY = Math.floor(selectedUnit.y / TILE_SIZE);
            const originX = Math.floor(selectedUnit.x / TILE_SIZE);

            const validMove = validUnitFormation[index];

            this.finder.findPath(
              originX,
              originY,
              validMove.col,
              validMove.row,
              (path) => {
                if (path) {
                  selectedUnit.queueMove(path);
                } else {
                  sendUiAlert({ invalidCommand: `Path not found.` });
                }
              }
            );

            this.finder.calculate();
          });
      }
    } else {
      this.selection.x = pointer.x;
      this.selection.y = pointer.y;
    }
  };

  handlePointerMove = (pointer: Phaser.Input.Pointer) => {
    if (!pointer.isDown) return;
    if (pointer.rightButtonDown()) return;

    const dx = pointer.x - pointer.prevPosition.x;
    const dy = pointer.y - pointer.prevPosition.y;

    this.selection.width += dx;
    this.selection.height += dy;
  };

  handlePointerUp = (pointer: Phaser.Input.Pointer) => {
    const allUnits = this.entities.unitGroup.getChildren() as Array<Unit>;
    const isBoxSelection =
      this.selection.width !== 0 || this.selection.height !== 0;

    if (isBoxSelection) {
      const selectionRect = new Phaser.Geom.Rectangle(
        this.selection.x,
        this.selection.y,
        this.selection.width,
        this.selection.height
      );

      const isNegativeWidthSelection = selectionRect.width < 0;

      if (isNegativeWidthSelection) {
        selectionRect.x += selectionRect.width;
        selectionRect.width *= -1;
      }

      const isNegativeHeightSelection = selectionRect.height < 0;

      if (isNegativeHeightSelection) {
        selectionRect.y += selectionRect.height;
        selectionRect.height *= -1;
      }

      const selected = allUnits.filter((unit) => {
        const rect = unit.getBounds();

        return Phaser.Geom.Rectangle.Overlaps(selectionRect, rect);
      });

      const shiftKeyIsNotPressed = !(
        pointer.event as unknown as Phaser.Input.Keyboard.Key
      ).shiftKey;
      if (shiftKeyIsNotPressed) {
        this.entities.selectedUnitGroup.clearUnits();
      }

      selected.forEach(this.entities.selectedUnitGroup.addUnit);

      this.selection.width = 0;
      this.selection.height = 0;
    } else {
      const hasNotClickedAnyUnits = !allUnits.find((unit) =>
        unit.getBounds().contains(pointer.x, pointer.y)
      );

      const hasClickedOnEmptySpace =
        hasNotClickedAnyUnits && !pointer.rightButtonReleased();

      if (hasClickedOnEmptySpace) {
        this.entities.selectedUnitGroup.clearUnits();
      }
    }
  };

  handleKeyDown = (event: { key: string }) => {
    if (event.key === 'a') {
      rotateFormationShape(this.entities.interaction);
    }
  };
}

function drawLegacyEnemyPath(scene: Phaser.Scene): Phaser.Curves.Path {
  const HALF_TILE = TILE_SIZE / 2;
  const lineWidth = 2;
  const lineOffset = lineWidth / 2;

  const path = scene.add.path(
    3 * TILE_SIZE - HALF_TILE - lineOffset,
    -TILE_SIZE
  );
  path.lineTo(
    3 * TILE_SIZE - HALF_TILE - lineOffset,
    6 * TILE_SIZE - HALF_TILE - lineOffset
  );
  path.lineTo(
    15 * TILE_SIZE - HALF_TILE - lineOffset,
    6 * TILE_SIZE - HALF_TILE - lineOffset
  );
  path.lineTo(15 * TILE_SIZE - HALF_TILE - lineOffset, BOARD_HEIGHT);

  return path;
}

function placeUnit(
  scene: Game,
  x: number,
  y: number,
  type = 'NORMAL' as keyof typeof UnitType
) {
  const map = scene.map;
  const row = Math.floor(y / TILE_SIZE);
  const column = Math.floor(x / TILE_SIZE);

  if (map[row][column] === VALID_UNIT_POSITION) {
    const UnitConstructor = UnitType[type];
    const unit = new UnitConstructor(scene.entities.unitGroup.scene as Game);
    scene.entities.unitGroup.add(unit);
    scene.entities.unitGroup.scene.add.existing(unit);

    if (unit) {
      unit.setActive(true);
      unit.setVisible(true);
      unit.place(row, column);
      unit.setInteractive({ useHandCursor: true });
    }
  }
}

function damageEnemy(enemy: Enemy, bullet: Bullet) {
  const ifEnemyAndBulletAlive = enemy.active && bullet.active;

  if (ifEnemyAndBulletAlive) {
    bullet.setActive(false);
    bullet.setVisible(false);

    enemy.receiveDamage(bullet.getDamage());
  }
}

function disableBrowserRightClickMenu(scene: Phaser.Scene) {
  scene.input.mouse.disableContextMenu();
}

function configurePathFindingGrid(finder: EasyStar.js, map: number[][]) {
  finder.setGrid(map);
  finder.setAcceptableTiles([
    VALID_UNIT_POSITION,
    OCCUPIED_UNIT_POSITION,
    UNIT_CROSSING,
  ]);
}

function addSelectionRectangle(scene: Phaser.Scene) {
  return scene.add.rectangle(
    0,
    0,
    0,
    0,
    SELECTION_RECTANGLE_COLOR,
    SELECTION_RECTANGLE_OPACITY
  );
}

export type MapPath = Array<{ x: number; y: number }>;

export type TileCoordinates = {
  i: number;
  j: number;
};
