import Phaser from 'phaser';
import EasyStar from 'easystarjs';

import { Unit, UnitType } from '../entities/Unit';
import Enemy from '../entities/Enemy';
import Bullet from '../entities/Bullet';
import Pointer from '../entities/Pointer';

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
  BOARD_HEIGHT,
  BOARD_WIDTH,
  ENEMY_PATH,
  ENEMY_SPAWN_RATE_MS,
  GLOBAL_KEYS__MENU_KEY,
  INVALID_UNIT_POSITION,
  OCCUPIED_UNIT_POSITION,
  SELECTION_RECTANGLE_COLOR,
  SELECTION_RECTANGLE_OPACITY,
  SPRITE_ATLAS_NAME,
  TILE_SIZE,
  UNIT_CROSSING,
  HOMEBASE_TEXTURE_NAME,
  UNIT_SQUAD_SIZE,
  VALID_UNIT_POSITION,
} from '../constants';

import { getLogger, getLoggingConfig } from '../logger';
import HomeBase from '../entities/HomeBase';
import { sliceFromTexture } from '../texture-utils';
import { TileProperties } from '../entities/Map';

class LevelConfig {
  tilemapKey: string;
  MAP_LAYER_KEY = 'Below Player';

  constructor(tilemapKey: string) {
    this.tilemapKey = tilemapKey;
  }
}

const logger = getLogger('GAME_SCENE');

export const title = 'game';
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
  kills = 0;
  map!: number[][];
  nextEnemy!: number;
  playerHUD!: Phaser.GameObjects.Text;
  pointer!: Phaser.GameObjects.GameObject;
  scoreboard!: Phaser.GameObjects.Text;
  selection!: Phaser.GameObjects.Rectangle;
  tilemap!: Phaser.Tilemaps.Tilemap;
  tileset!: Phaser.Tilemaps.Tileset;
  unitPathfinder!: EasyStar.js;
  enemyPathfinder!: EasyStar.js;

  currentLevel: number;
  levelConfigurations: LevelConfig[];

  constructor() {
    logger.log('### INIT ###');
    super(title);

    this.currentLevel = 0;
    this.levelConfigurations = [
      new LevelConfig('level-0'),
      new LevelConfig('level-1'),
    ];
  }

  preload() {
    logger.log('### PRELOAD ###');
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
    this.levelConfigurations.forEach((config) => {
      this.load.tilemapTiledJSON(
        config.tilemapKey,
        `assets/${config.tilemapKey}.tmj`
      );
    });
  }

  /**
   * Used for loading additional textures that are dependent on `#preload` completion
   */
  loadAdditionalTextures() {
    this.textures.get(HOMEBASE_TEXTURE_NAME).key === '__MISSING' &&
      sliceFromTexture(
        this,
        HOMEBASE_TEXTURE_NAME,
        'grass-biome',
        32 * 3,
        32 * 16
      );
  }

  currentConfiguration() {
    return this.levelConfigurations[this.currentLevel];
  }

  loadCurrentLevel() {
    const config = this.currentConfiguration();

    this.tilemap = this.make.tilemap({ key: config.tilemapKey });
    this.tileset = this.tilemap.addTilesetImage('grass-biome');
    this.tilemap.createLayer('Below Player', this.tileset);

    const belowPlayerLayer = this.tilemap.getLayer('Below Player');

    this.map = belowPlayerLayer.data.map((row) =>
      row.map<number>((col: Phaser.Tilemaps.Tile) => {
        const properties = col.properties as TileProperties;

        if (properties.collision) {
          return INVALID_UNIT_POSITION;
        }

        if (properties.enemyPath) {
          return ENEMY_PATH;
        }

        if (properties.crossing) {
          return UNIT_CROSSING;
        }

        return VALID_UNIT_POSITION;
      })
    );

    // value used to control spawn rate of enemies
    // initialize with delay to let some level intro viz to run
    // Note: on scene restarts, the clock does not reset
    this.nextEnemy = this.time.now + 4_000;

    configureUnitPathfindingGrid(this.unitPathfinder, this.map);
    configureEnemyPathfinding(this.enemyPathfinder, this.map, this);
    configureHomeBase(this);

    // Level Change Notification
    const verticalPosition = (BOARD_HEIGHT * 2) / 5;
    const initialY = BOARD_HEIGHT / 2;

    const text = this.add
      .text(BOARD_WIDTH / 2, initialY, `Level ${this.currentLevel + 1}`, {
        align: 'center',
        fontSize: '32px',
      })
      .setAlpha(0)
      .setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: text,
      alpha: { value: 1, duration: 2000, ease: 'Power1' },
      y: { value: verticalPosition, duration: 3000, ease: 'Power1' },
    });

    this.tweens.add({
      targets: text,
      alpha: { value: 0, delay: 2000, duration: 1000, ease: 'Power1' },
    });
  }

  create() {
    this.loadAdditionalTextures();

    this.unitPathfinder = new EasyStar.js();
    this.enemyPathfinder = new EasyStar.js();

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

    this.selection = addSelectionRectangle(this);

    this.entities = entityManagerFactory(this);

    this.entities.pointer = new Pointer(this);

    this.add.existing(this.entities.homeBase);
    this.physics.add.existing(this.entities.homeBase);

    // COLLISION PHYSICS
    this.physics.add.overlap(
      this.entities.enemyGroup,
      this.entities.bullets,
      (enemy: any, bullet: any) => {
        // this is a type helper
        // because the underlying type is a generic Physics.Arcade.GameObjectWithBody
        // and doesn't technically guarantee ordering of the objects being compared
        // so this wrapper is taking responsibility of this assumption
        return this.damageEnemy(enemy as Enemy, bullet as Bullet);
      }
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

    // GAMEPLAY OVERLAYS
    this.scoreboard = this.add.text(5, 5, `Score: 0`).setDepth(1); //.setOrigin(0, 0);
    this.playerHUD = this.add
      .text(BOARD_WIDTH - 5, 5, `Tanks Available: n/a`, {
        align: 'right',
      })
      .setDepth(1)
      .setOrigin(1, 0);

    this.loadCurrentLevel();

    Object.keys(UnitType).forEach((unitType, idx) => {
      placeUnit(
        this,
        70 + idx * TILE_SIZE,
        250,
        unitType as keyof typeof UnitType
      );
    });
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

  update(time: number, delta: number) {
    this.scoreboard.setText(`Score: ${this.kills}`);
    this.playerHUD.setText([
      `Level: ${this.currentLevel + 1}`,
      // `Next Enemy: ${(this.nextEnemy - time).toFixed()}`,
      // `Units Available: ${
      //   UNIT_SQUAD_SIZE - this.entities.unitGroup.getTotalUsed()
      // }/${UNIT_SQUAD_SIZE}`,
      `Units Selected: ${this.entities.selectedUnitGroup.size()}`,
      `Formation: ${this.entities.interaction.formationShape}`,
      ...this._getKeyboardCtrlStatusDebugLines(),
      ...this._getUnitStatusDebugLines(),
      `${this.entities.homeBase.toString()}`,
    ]);

    const shouldSpawnEnemy =
      time > this.nextEnemy && this.enemyPath !== undefined;

    if (shouldSpawnEnemy) {
      const enemy = this.entities.enemyGroup.get() as Enemy | null;

      if (enemy) {
        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.startOnPath(this.enemyPath);

        this.nextEnemy = time + ENEMY_SPAWN_RATE_MS;
      }
    }

    this.entities.pointer.update();
    this.entities.homeBase.update(time, delta);

    if (this.entities.homeBase.hp === 0) {
      logger.log('### TRIGGERING DEATH LOGIC ###');
      if (this.currentLevel >= this.levelConfigurations.length - 1) {
        sendUiAlert({ message: 'GAME OVER' });
        this.currentLevel = 0;
        this.scene.pause();
        this.scene.start(GameOverScene);
      } else {
        sendUiAlert({ message: 'NEXT LEVEL' });
        // so any enroute enemies are cleaned up before next level starts
        this.entities.enemyGroup.setActive(false);
        this.entities.enemyGroup.setVisible(false);

        this.currentLevel += 1;
        // #restart triggers starts with the preload method on this scene
        this.scene.restart();
      }
    }
  }

  damageEnemy(enemy: Enemy, bullet: Bullet) {
    const ifEnemyAndBulletAlive = enemy.active && bullet.active;

    if (ifEnemyAndBulletAlive) {
      bullet.setActive(false);
      bullet.setVisible(false);

      enemy.receiveDamage(bullet.getDamage());
      if (!enemy.active) {
        this.kills += 1;
      }
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
        this.unitPathfinder.setGrid(this.map);

        this.entities.selectedUnitGroup
          .getUnits()
          .forEach((selectedUnit: Unit, index) => {
            const originY = Math.floor(selectedUnit.y / TILE_SIZE);
            const originX = Math.floor(selectedUnit.x / TILE_SIZE);

            const validMove = validUnitFormation[index];

            this.unitPathfinder.findPath(
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

            this.unitPathfinder.calculate();
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

function drawEnemyPath(scene: Game, enemyPath: MapPath): Phaser.Curves.Path {
  const HALF_TILE = TILE_SIZE / 2;

  const path = scene.add.path(
    enemyPath[0].x * TILE_SIZE + HALF_TILE,
    enemyPath[0].y * TILE_SIZE + HALF_TILE
  );

  for (let i = 1; i < enemyPath.length; i++) {
    path.lineTo(
      enemyPath[i].x * TILE_SIZE + HALF_TILE,
      enemyPath[i].y * TILE_SIZE + HALF_TILE
    );
  }

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

function disableBrowserRightClickMenu(scene: Phaser.Scene) {
  scene.input.mouse.disableContextMenu();
}

function configureUnitPathfindingGrid(
  unitPathfinder: EasyStar.js,
  map: number[][]
) {
  unitPathfinder.setGrid(map);
  unitPathfinder.setAcceptableTiles([
    VALID_UNIT_POSITION,
    OCCUPIED_UNIT_POSITION,
    UNIT_CROSSING,
  ]);
}

function configureEnemyPathfinding(
  enemyPathfinder: EasyStar.js,
  map: number[][],
  scene: Game
) {
  enemyPathfinder.setGrid(map);
  enemyPathfinder.setAcceptableTiles([ENEMY_PATH, UNIT_CROSSING]);

  const { enemyStartCoordinates, enemyEndCoordinates } =
    getEnemyStartEndCoordinates(map);

  enemyPathfinder.findPath(
    enemyStartCoordinates.col,
    enemyStartCoordinates.row,
    enemyEndCoordinates.col,
    enemyEndCoordinates.row,
    (path) => {
      if (path) {
        scene.enemyPath = drawEnemyPath(scene, path);
      } else {
        sendUiAlert({ invalidCommand: `Path not found.` });
      }
    }
  );

  enemyPathfinder.calculate();
}

function configureHomeBase(scene: Game) {
  const { enemyEndCoordinates } = getEnemyStartEndCoordinates(scene.map);

  const { x, y } = getPositionForTileCoordinates({
    row: enemyEndCoordinates.row,
    col: enemyEndCoordinates.col,
  });

  scene.entities.homeBase.setNewPosition(x, y).setDepth(1);
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

function getEnemyStartEndCoordinates(map: number[][]) {
  const [enemyStartCoordinates, enemyEndCoordinates] = map
    .map((row, y) => {
      return row.map((col, x) => ({
        x,
        y,
        isEnemyPathTile: col === ENEMY_PATH,
      }));
    })
    .flat()
    .filter(({ isEnemyPathTile }) => isEnemyPathTile)
    .filter(({ x, y }) => {
      const maxRowIndex = map.length - 1;
      const maxColIndex = map[0].length - 1;

      return x === 0 || y === 0 || x === maxColIndex || y === maxRowIndex;
    })
    .map(({ x: col, y: row }) => ({ row, col }));

  return {
    enemyStartCoordinates,
    enemyEndCoordinates,
  };
}
