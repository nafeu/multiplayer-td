import Phaser from 'phaser';
import EasyStar from 'easystarjs';

import { Unit, UnitType, UnitTypeOption } from '../entities/Unit';
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
  ENEMY_IMG_NAME,
  ENEMY_PATH,
  ENEMY_SPAWN_RATE_MS,
  ENEMY_SPEED,
  GLOBAL_KEYS__MENU_KEY,
  HOMEBASE_TEXTURE_NAME,
  INVALID_UNIT_POSITION,
  OCCUPIED_UNIT_POSITION,
  SELECTION_RECTANGLE_COLOR,
  SELECTION_RECTANGLE_OPACITY,
  SPRITE_ATLAS_NAME,
  TILE_SIZE,
  UNIT_CROSSING,
  VALID_UNIT_POSITION,
  WAVE_STATES,
} from '../constants';

import { getLogger, getLoggingConfig } from '../logger';
import HomeBase from '../entities/HomeBase';
import { sliceFromTexture } from '../texture-utils';
import { TileProperties } from '../entities/Map';
import { Button } from '../entities/Button';

class LevelConfig {
  tilemapKey: string;
  totalEnemies: number;
  waves: Wave[];
  MAP_LAYER_KEY = 'Below Player';

  constructor(tilemapKey: string, waves: Wave[]) {
    this.tilemapKey = tilemapKey;
    this.totalEnemies = 40000;
    this.waves = waves;
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
  enemyPathfinder!: EasyStar.js;
  entities!: EntityManager;
  finder!: EasyStar.js;
  kills = 0;
  map!: number[][];
  moveMode = false;
  nextEnemy!: number;
  playerHUD!: Phaser.GameObjects.Text;
  pointer!: Phaser.GameObjects.GameObject;
  scoreboard!: Phaser.GameObjects.Text;
  selection!: Phaser.GameObjects.Rectangle;
  tilemap!: Phaser.Tilemaps.Tilemap;
  tileset!: Phaser.Tilemaps.Tileset;
  touchAssistBtn: Button | undefined;
  unitPathfinder!: EasyStar.js;

  currentLevelIndex: number;
  levelConfigurations: LevelConfig[];

  currentWaveIndex: number;
  enemiesRemainingInWave: number;
  enemySequenceIndex: number;
  enemiesSpawned: number;
  waveState: string;

  constructor() {
    logger.log('### INIT ###');
    super(title);

    this.currentLevelIndex = 0;
    this.currentWaveIndex = 0;
    this.enemySequenceIndex = 0;

    this.enemiesSpawned = 0;
    this.enemiesRemainingInWave = 0;

    this.waveState = WAVE_STATES.SPAWNING;

    /*
      TODO: Store level wave configurations in either
            constants file or some separate folder
    */
    this.levelConfigurations = [
      new LevelConfig('level-0', [
        {
          enemies: [3, 3, 3],
          delay: 3000,
        },
        {
          enemies: [15],
          delay: 1000,
        },
        {
          enemies: [10, 10, 10],
          delay: 3000,
        },
      ]),
      new LevelConfig('level-1', [
        {
          enemies: [5, 5, 5],
          delay: 3000,
        },
        {
          enemies: [8, 8],
          delay: 3000,
        },
      ]),
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

    // load the JSON file for each level configuration
    this.levelConfigurations.forEach((config) => {
      this.load.tilemapTiledJSON(
        config.tilemapKey,
        `assets/${config.tilemapKey}.tmj`
      );
    });

    this.load.spritesheet(ENEMY_IMG_NAME, 'assets/drone1-texture.png', {
      frameWidth: 47,
      frameHeight: 26,
      startFrame: 0,
      endFrame: 3,
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

  getCurrentLevelConfiguration() {
    return this.levelConfigurations[this.currentLevelIndex];
  }

  loadCurrentLevel() {
    const currentLevelConfig = this.getCurrentLevelConfiguration();

    this.tilemap = this.make.tilemap({ key: currentLevelConfig.tilemapKey });
    this.tileset = this.tilemap.addTilesetImage('grass-biome');
    this.tilemap.createLayer(currentLevelConfig.MAP_LAYER_KEY, this.tileset);

    const belowPlayerLayer = this.tilemap.getLayer(
      currentLevelConfig.MAP_LAYER_KEY
    );

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

    // Note: on scene restarts, the clock does not reset
    this.nextEnemy =
      this.time.now + currentLevelConfig.waves[this.currentWaveIndex].delay;

    this.configureUnitPathfindingGrid(this.unitPathfinder, this.map);
    this.configureEnemyPathfinding(this.enemyPathfinder, this.map);
    this.configureHomeBase();

    // Level Change Notification
    const verticalPosition = (BOARD_HEIGHT * 2) / 5;
    const initialY = BOARD_HEIGHT / 2;

    const text = this.add
      .text(
        BOARD_WIDTH / 2,
        initialY,
        `Level ${this.currentLevelIndex + 1}: Wave 1`,
        {
          align: 'center',
          fontSize: '32px',
        }
      )
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
    this.anims.create({
      key: `${ENEMY_IMG_NAME}-walk`,
      frames: this.anims.generateFrameNumbers(ENEMY_IMG_NAME, {
        start: 0,
        end: 3,
      }),
      frameRate: ENEMY_SPEED * 100_000,
    });

    logger.log('### CREATE ###');
    this.loadAdditionalTextures();

    this.unitPathfinder = new EasyStar.js();
    this.enemyPathfinder = new EasyStar.js();

    this.disableBrowserRightClickMenu();

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

    this.selection = this.addSelectionRectangle();

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

    // for the mobile demos
    if (this.sys.game.device.input.touch) this._loadTouchAssistBtn();

    // TODO: Add & use 'unitStart' property via tilemap
    this.placeUnit(70, 250, 'NORMAL' as UnitTypeOption);
  }

  KEYS = {
    SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    CTRL: Phaser.Input.Keyboard.KeyCodes.CTRL,
    SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
  };

  keyIsDown(key: Phaser.Input.Keyboard.Key | number) {
    const keyboardKey = this.input.keyboard.addKey(key);
    return this.input.keyboard.checkDown(keyboardKey);
  }

  // Leaving it as string, so it's easy to stringify
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

  _getHomeBaseDebugLines() {
    if (getLoggingConfig('DEBUG_HUD__HOME_BASE_HP')) {
      return ['', 'Home Base:', '--------', this.entities.homeBase.toString()];
    }
    return [];
  }

  _loadTouchAssistBtn() {
    this.touchAssistBtn = new Button(
      this,
      BOARD_WIDTH - 5,
      BOARD_HEIGHT - 5,
      this.moveMode ? 'MOVE' : 'SELECT',
      () => {
        this.moveMode = !this.moveMode;
        this.touchAssistBtn?.setText(this.moveMode ? 'MOVE' : 'SELECT');
      },
      {
        backgroundColor: 'black',
        padding: {
          x: 10,
          y: 10,
        },
      }
    )
      .setDepth(20)
      .setOrigin(1, 1);
  }

  update(time: number, delta: number) {
    this.scoreboard.setText(`Score: ${this.kills}`);
    this.playerHUD.setText([
      `Level: ${this.currentLevelIndex + 1}, Wave: ${this.currentWaveIndex}`,
      ...this._getKeyboardCtrlStatusDebugLines(),
      ...this._getUnitStatusDebugLines(),
      ...this._getHomeBaseDebugLines(),
    ]);

    const currentLevelConfig = this.getCurrentLevelConfiguration();
    const currentWave = currentLevelConfig.waves[this.currentWaveIndex];

    if (this.waveState === WAVE_STATES.SPAWNING) {
      const shouldSpawnEnemy =
        time > this.nextEnemy && this.enemiesRemainingInWave > 0;

      if (shouldSpawnEnemy) {
        const enemy = this.entities.enemyGroup.get() as Enemy | null;

        if (enemy) {
          enemy.setActive(true);
          enemy.setVisible(true);
          enemy.startOnPath(this.enemyPath);

          this.nextEnemy = time + ENEMY_SPAWN_RATE_MS;
          this.enemiesSpawned += 1;
          this.enemiesRemainingInWave -= 1;
        }
      } else {
        const noMoreEnemiesInWave = this.enemiesRemainingInWave <= 0;

        if (noMoreEnemiesInWave) {
          const noMoreEnemiesInWaveSequence =
            this.enemySequenceIndex >= currentWave.enemies.length;

          if (noMoreEnemiesInWaveSequence) {
            this.enemySequenceIndex = 0;
            this.currentWaveIndex += 1;
            this.waveState = WAVE_STATES.WAITING;
          } else {
            this.enemiesRemainingInWave =
              currentWave.enemies[this.enemySequenceIndex];
            this.enemySequenceIndex += 1;
            this.nextEnemy = time + currentWave.delay;
          }
        }
      }
    }

    if (this.waveState === WAVE_STATES.WAITING) {
      const allEnemiesFromWaveAreDead =
        this.entities.enemyGroup.getFirstAlive() === null;

      if (allEnemiesFromWaveAreDead) {
        const noMoreWavesRemaining =
          this.currentWaveIndex >= currentLevelConfig.waves.length;

        if (noMoreWavesRemaining) {
          const noMoreLevelsRemaining =
            this.currentLevelIndex >= this.levelConfigurations.length - 1;

          if (noMoreLevelsRemaining) {
            sendUiAlert({ message: 'YOU WON' });
            this.currentLevelIndex = 0;
            this.scene.pause();
            this.scene.start(GameOverScene);
          } else {
            sendUiAlert({ message: 'NEXT LEVEL' });
            this.entities.enemyGroup.setActive(false);
            this.entities.enemyGroup.setVisible(false);

            this.currentLevelIndex += 1;
            this.currentWaveIndex = 0;
            this.enemySequenceIndex = 0;

            this.enemiesSpawned = 0;
            this.enemiesRemainingInWave = 0;

            this.scene.restart();
          }
        } else {
          this.waveState = WAVE_STATES.SPAWNING;
          this.placeUnit(70, 250, 'NORMAL' as UnitTypeOption);
          this.nextEnemy = time + currentWave.delay;

          this.triggerUIMessage(`Wave ${this.currentWaveIndex + 1}`);
        }
      }
    }

    this.entities.pointer.update();
    this.entities.homeBase.update(time, delta);

    if (this.entities.homeBase.hp === 0) {
      logger.log('### TRIGGERING DEATH LOGIC ###');
      sendUiAlert({ message: 'GAME OVER' });

      this.currentLevelIndex = 0;
      this.currentWaveIndex = 0;
      this.enemySequenceIndex = 0;

      this.enemiesSpawned = 0;
      this.enemiesRemainingInWave = 0;

      this.scene.pause();
      this.scene.start(GameOverScene);
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
    this.touchAssistBtn?.enterButtonRestState();

    if (this.keyIsDown(this.KEYS.CTRL)) {
      sendUiAlert({ info: 'All your tanks are already on the field!' });
      return;
    }

    if (pointer.rightButtonDown() || this.moveMode) {
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

      if (!this.keyIsDown(this.KEYS.SHIFT)) {
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

  disableBrowserRightClickMenu() {
    this.input.mouse.disableContextMenu();
  }

  configureUnitPathfindingGrid(unitPathfinder: EasyStar.js, map: number[][]) {
    unitPathfinder.setGrid(map);
    unitPathfinder.setAcceptableTiles([
      VALID_UNIT_POSITION,
      OCCUPIED_UNIT_POSITION,
      UNIT_CROSSING,
    ]);
  }

  configureEnemyPathfinding(enemyPathfinder: EasyStar.js, map: number[][]) {
    enemyPathfinder.setGrid(map);
    enemyPathfinder.setAcceptableTiles([ENEMY_PATH, UNIT_CROSSING]);

    const { enemyStartCoordinates, enemyEndCoordinates } =
      getEnemyStartEndCoordinates(map);

    enemyPathfinder.enableSync();
    enemyPathfinder.findPath(
      enemyStartCoordinates.col,
      enemyStartCoordinates.row,
      enemyEndCoordinates.col,
      enemyEndCoordinates.row,
      (path) => {
        if (path) {
          this.enemyPath = this.drawEnemyPath(path);
        } else {
          sendUiAlert({ invalidCommand: `Path not found.` });
        }
      }
    );
    enemyPathfinder.calculate();

    enemyPathfinder.disableSync();
  }

  configureHomeBase() {
    const { enemyEndCoordinates } = getEnemyStartEndCoordinates(this.map);

    const { x, y } = getPositionForTileCoordinates({
      row: enemyEndCoordinates.row,
      col: enemyEndCoordinates.col,
    });

    this.entities.homeBase.setNewPosition(x, y).setDepth(1);
  }

  addSelectionRectangle() {
    return this.add
      .rectangle(
        0,
        0,
        0,
        0,
        SELECTION_RECTANGLE_COLOR,
        SELECTION_RECTANGLE_OPACITY
      )
      .setDepth(1);
  }

  drawEnemyPath(enemyPath: MapPath): Phaser.Curves.Path {
    const HALF_TILE = TILE_SIZE / 2;

    const path = this.add.path(
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

  placeUnit(x: number, y: number, type = 'NORMAL' as UnitTypeOption) {
    const row = Math.floor(y / TILE_SIZE);
    const column = Math.floor(x / TILE_SIZE);

    if (this.map[row][column] === VALID_UNIT_POSITION) {
      const UnitConstructor = UnitType[type];
      const unit = new UnitConstructor(this);
      this.entities.unitGroup.add(unit);
      this.add.existing(unit);

      if (unit) {
        unit.setActive(true);
        unit.setVisible(true);
        unit.place(row, column);
        unit.setInteractive({ useHandCursor: true });
      }
    }
  }

  triggerUIMessage(message: string) {
    const verticalPosition = (BOARD_HEIGHT * 2) / 5;
    const initialY = BOARD_HEIGHT / 2;

    const text = this.add
      .text(BOARD_WIDTH / 2, initialY, message, {
        align: 'center',
        fontSize: '32px',
      })
      .setAlpha(0)
      .setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: text,
      alpha: { value: 1, duration: 500, ease: 'Power1' },
      y: { value: verticalPosition, duration: 1000, ease: 'Power1' },
    });

    this.tweens.add({
      targets: text,
      alpha: { value: 0, delay: 1000, duration: 500, ease: 'Power1' },
    });
  }
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
