import Phaser from 'phaser';
import EasyStar from 'easystarjs';

import Unit from '../entities/Unit';
import Enemy from '../entities/Enemy';
import Bullet from '../entities/Bullet';

import map, { MAP_GRID } from '../map';
import entities from '../entities.ts';

import { isDebugMode } from '../utils';

import {
  SPRITE_ATLAS_NAME,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TILE_SIZE,
  UNIT_SQUAD_SIZE,
  ENEMY_SPAWN_RATE_MS,
  VALID_UNIT_POSITION,
  BULLET_DAMAGE,
} from '../constants';

class Game extends Phaser.Scene {
  nextEnemy: number;
  playerHUD: Phaser.GameObjects.Text;
  finder: EasyStar;

  constructor() {
    super('main');
  }

  preload() {
    this.load.path = 'public/';
    this.load.atlas(
      SPRITE_ATLAS_NAME,
      'assets/spritesheet.png',
      /*
        ".text" is used to bypass bun dev server turning .json into ESM
        See: https://github.com/oven-sh/bun/issues/1213
      */
      'assets/spritesheet.json.text'
    );
  }

  create() {
    this.finder = new EasyStar.js();

    configurePathFindingGrid(this.finder);

    disableBrowserRightClickMenu(this);

    this.input.on('pointerdown', (pointer) =>
      handleClickScene(pointer, this.finder)
    );

    map.graphics = this.add.graphics();

    if (isDebugMode) {
      drawGrid(map.graphics);
    }

    map.path = drawEnemyPath(this, map.graphics);

    entities.unitGroup = this.add.group({
      classType: Unit,
      runChildUpdate: true,
      maxSize: UNIT_SQUAD_SIZE,
      // use createCallback to pass the scene for post initialization stuff
      // createCallback: function (unit: typeof Unit) {
      //   console.log('### Unit Created', unit.id);

      //   unit.postInitialize(map, getEnemy, () => entities.bullets.get());
      // },
    });

    entities.enemyGroup = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
      // removeCallback doesn't get triggered for recycled objects - don't rely on this for resets
      // removeCallback: function (enemy: typeof Enemy) {
      //   console.log('### Enemy Removed', enemy.id);
      // },
    });

    // value used to control spawn rate of enemies
    this.nextEnemy = 0;

    entities.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
    });

    this.physics.add.overlap(
      entities.enemyGroup,
      entities.bullets,
      damageEnemy
    );

    this.playerHUD = this.add
      .text(BOARD_WIDTH - 5, 5, `Tanks Available: n/a`, {
        align: 'right',
      })
      .setOrigin(1, 0);

    // Setup Default Units
    placeUnit({ x: 70, y: 250 });
    placeUnit({ x: 100, y: 250 });
  }

  update(time, delta) {
    this.finder.calculate();

    this.playerHUD.setText(
      `Tanks Available: ${
        UNIT_SQUAD_SIZE - entities.unitGroup.getTotalUsed()
      }/${UNIT_SQUAD_SIZE}`
    );

    const shouldSpawnEnemy = time > this.nextEnemy;

    if (shouldSpawnEnemy) {
      const enemy = entities.enemyGroup.get();

      if (enemy) {
        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.startOnPath();

        this.nextEnemy = time + ENEMY_SPAWN_RATE_MS;
      }
    }
  }
}

function drawGrid(graphics: Phaser.GameObjects.Graphics) {
  const lineWidth = 2;
  const halfWidth = Math.floor(lineWidth / 2);
  graphics.lineStyle(2, 0x0000ff, 0.5);

  for (let i = 0; i < Math.floor(BOARD_HEIGHT / TILE_SIZE); i++) {
    graphics.moveTo(0, i * TILE_SIZE - halfWidth);
    graphics.lineTo(BOARD_WIDTH, i * TILE_SIZE - halfWidth);
  }

  for (let j = 0; j < Math.floor(BOARD_WIDTH / TILE_SIZE); j++) {
    graphics.moveTo(j * TILE_SIZE - halfWidth, 0);
    graphics.lineTo(j * TILE_SIZE - halfWidth, BOARD_HEIGHT);
  }

  graphics.strokePath();
}

function drawEnemyPath(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics
) {
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

  graphics.lineStyle(lineWidth, 0xffffff, 1);

  path.draw(graphics);

  return path;
}

function placeUnit(pointer) {
  const i = Math.floor(pointer.y / TILE_SIZE);
  const j = Math.floor(pointer.x / TILE_SIZE);

  if (map.unitValid[i][j] === VALID_UNIT_POSITION) {
    const unit = entities.unitGroup.get();

    if (unit) {
      unit.setActive(true);
      unit.setVisible(true);
      unit.place(i, j);
      // so it can receive pointer events
      unit.setInteractive();
    }
  }
}

function damageEnemy(enemy, bullet) {
  const ifEnemyAndBulletAlive = enemy.active && bullet.active;

  if (ifEnemyAndBulletAlive) {
    bullet.setActive(false);
    bullet.setVisible(false);

    enemy.receiveDamage(BULLET_DAMAGE);
  }
}

function disableBrowserRightClickMenu(scene) {
  scene.input.mouse.disableContextMenu();
}

function handleClickScene(pointer, finder: EasyStar) {
  if (pointer.event.shiftKey) {
    placeUnit(pointer);
  } else if (pointer.rightButtonDown()) {
    entities.selectedUnits.forEach((selectedUnit) => {
      const originY = Math.floor(selectedUnit.y / TILE_SIZE);
      const originX = Math.floor(selectedUnit.x / TILE_SIZE);

      const i = Math.floor(pointer.y / TILE_SIZE);
      const j = Math.floor(pointer.x / TILE_SIZE);

      const isValidMove = map.unitValid[i][j] === VALID_UNIT_POSITION;
      if (isValidMove) {
        finder.findPath(originX, originY, j, i, (path) => {
          if (path) {
            selectedUnit.move(path);
          } else {
            console.log({ issue: `Path not found.` });
          }
        });
      }
    });
  }
}

function configurePathFindingGrid(finder: EasyStar) {
  finder.setGrid(MAP_GRID);
  finder.setAcceptableTiles([0]);
}

export default Game;
