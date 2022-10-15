import Phaser from 'phaser';

import Turret from '../entities/Turret';
import Enemy from '../entities/Enemy';
import Bullet from '../entities/Bullet';

import map from '../map';
import entities from '../entities';

import { isDebugMode } from '../utils';

import {
  SPRITE_ATLAS_NAME,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TILE_SIZE,
  TURRET_SQUAD_SIZE,
  ENEMY_SPAWN_RATE_MS,
  VALID_TURRET_POSITION,
  BULLET_DAMAGE
} from '../constants';

class Scene extends Phaser.Scene {
  nextEnemy: number;
  playerHUD: Phaser.GameObjects.Text;

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
    this.input.on('pointerdown', placeTurret);

    map.graphics = this.add.graphics();
    if (isDebugMode) {
      drawGrid(map.graphics);
    }

    map.path = drawEnemyPath(this, map.graphics);

    entities.turretGroup = this.add.group({
      classType: Turret,
      runChildUpdate: true,
      maxSize: TURRET_SQUAD_SIZE,
    });

    entities.enemyGroup = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
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
  }

  update(time, delta) {
    this.playerHUD.setText(
      `Tanks Available: ${
        TURRET_SQUAD_SIZE - entities.turretGroup.getTotalUsed()
      }/${TURRET_SQUAD_SIZE}`
    );

    const shouldSpawnEnemy = time > this.nextEnemy

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

function placeTurret(pointer) {
  const i = Math.floor(pointer.y / TILE_SIZE);
  const j = Math.floor(pointer.x / TILE_SIZE);

  if (map.turretValid[i][j] === VALID_TURRET_POSITION) {
    const turret = entities.turretGroup.get();

    if (turret) {
      turret.setActive(true);
      turret.setVisible(true);
      turret.place(i, j);
      // so it can receive pointer events
      turret.setInteractive();
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

export default Scene;
