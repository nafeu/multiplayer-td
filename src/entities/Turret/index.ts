import Phaser from 'phaser';

import entities from '../index'
import map from '../../map'

import {
  SPRITE_ATLAS_NAME,
  TANK_IMG_NAME,
  VALID_TURRET_POSITION,
  OCCUPIED_TURRET_POSITION,
  TILE_SIZE,
  TURRET_FIRE_RANGE,
  TURRET_FIRE_RATE_MS
} from '../../constants';

const Turret = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,
  initialize: function Turret(scene) {
    Phaser.GameObjects.Image.call(
      this,
      scene,
      0,
      0,
      SPRITE_ATLAS_NAME,
      TANK_IMG_NAME
    );
    this.nextTick = 0;
    this.on('pointerdown', function (pointer) {
      this.destroy();
      map.turretValid[this.tilePositionRow][this.tilePositionCol] =
        VALID_TURRET_POSITION;
    });
  },

  place: function (i, j) {
    this.tilePositionRow = i;
    this.tilePositionCol = j;

    const GRID_PLACEMENT_Y = i * TILE_SIZE + TILE_SIZE / 2;
    const GRID_PLACEMENT_X = j * TILE_SIZE + TILE_SIZE / 2;

    this.y = GRID_PLACEMENT_Y;
    this.x = GRID_PLACEMENT_X;

    map.turretValid[this.tilePositionRow][this.tilePositionCol] =
      OCCUPIED_TURRET_POSITION;
  },

  fire: function () {
    const enemy = getEnemy(this.x, this.y, TURRET_FIRE_RANGE);

    if (enemy) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
      addBullet(this.x, this.y, angle);
      this.angle = (angle + Math.PI / 2) * Phaser.Math.RAD_TO_DEG;
    }
  },

  update: function (time) {
    const shouldShoot = time > this.nextTick;

    if (shouldShoot) {
      this.fire();
      this.nextTick = time + TURRET_FIRE_RATE_MS;
    }
  },
});

function addBullet(x, y, angle) {
  const bullet = entities.bullets.get();

  if (bullet) {
    bullet.fire(x, y, angle);
  }
}

function getEnemy(x, y, distance) {
  const enemyUnits = entities.enemyGroup.getChildren();

  for (let i = 0; i < enemyUnits.length; i++) {
    if (
      enemyUnits[i].active &&
      Phaser.Math.Distance.Between(x, y, enemyUnits[i].x, enemyUnits[i].y) <=
        distance
    )
      return enemyUnits[i];
  }

  return false;
}

export default Turret;
