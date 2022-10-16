import Phaser from 'phaser';

import entities from '../index'
import map from '../../map'

import {
  SPRITE_ATLAS_NAME,
  TANK_IMG_NAME,
  VALID_UNIT_POSITION,
  OCCUPIED_UNIT_POSITION,
  TILE_SIZE,
  UNIT_FIRE_RANGE,
  UNIT_FIRE_RATE_MS,
  UNIT_SNAP_DISTANCE,
  UNIT_MOVING_TINT,
  UNIT_SELECTED_TINT
} from '../../constants';

const Unit = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,
  initialize: function Unit(scene) {
    Phaser.GameObjects.Image.call(
      this,
      scene,
      0,
      0,
      SPRITE_ATLAS_NAME,
      TANK_IMG_NAME
    );

    this.isMoving = false;
    this.target = new Phaser.Math.Vector2();
    this.speed = Phaser.Math.GetSpeed(100, 1);
    this.nextTick = 0;
    this.isSelected = false;

    this.on('pointerdown', function (pointer) {
      if (pointer.event.shiftKey) {
        this.destroy();
        map.unitValid[this.tilePositionRow][this.tilePositionCol] =
          VALID_UNIT_POSITION;
        return;
      }

      entities.selectedUnits = [];
      entities.selectedUnits.push(this);
    });
  },

  place: function (i, j) {
    this.tilePositionRow = i;
    this.tilePositionCol = j;

    const GRID_PLACEMENT_Y = i * TILE_SIZE + TILE_SIZE / 2;
    const GRID_PLACEMENT_X = j * TILE_SIZE + TILE_SIZE / 2;

    this.y = GRID_PLACEMENT_Y;
    this.x = GRID_PLACEMENT_X;
    this.target.x = this.x;
    this.target.y = this.y;

    map.unitValid[this.tilePositionRow][this.tilePositionCol] =
      OCCUPIED_UNIT_POSITION;
  },

  fire: function () {
    const enemy = getEnemy(this.x, this.y, UNIT_FIRE_RANGE);

    if (enemy) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
      addBullet(this.x, this.y, angle);
      this.angle = (angle + Math.PI / 2) * Phaser.Math.RAD_TO_DEG;
    }
  },

  move: function (i, j) {
    map.unitValid[this.tilePositionRow][this.tilePositionCol] =
      VALID_UNIT_POSITION;

    this.tilePositionRow = i;
    this.tilePositionCol = j;

    const GRID_PLACEMENT_Y = i * TILE_SIZE + TILE_SIZE / 2;
    const GRID_PLACEMENT_X = j * TILE_SIZE + TILE_SIZE / 2;

    this.target.y = GRID_PLACEMENT_Y;
    this.target.x = GRID_PLACEMENT_X;

    if (this.target.y !== this.y || this.target.x !== this.x) {
      this.isMoving = true;
    }

    map.unitValid[this.tilePositionRow][this.tilePositionCol] =
      OCCUPIED_UNIT_POSITION;
  },

  update: function (time, delta) {
    if (this.isMoving) {
      this.setTint(UNIT_MOVING_TINT);
    } else if (entities.selectedUnits.includes(this)) {
      this.setTint(UNIT_SELECTED_TINT);
    } else {
      this.clearTint();
    }

    const shouldShoot = time > this.nextTick;

    if (shouldShoot) {
      this.fire();
      this.nextTick = time + UNIT_FIRE_RATE_MS;
    }

    const isMovingToTarget = this.isMoving
      && (this.x !== this.target.x || this.y !== this.target.y)

    if (isMovingToTarget) {
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y,
        this.target.x, this.target.y
      )

      const isAtTarget = distance <= UNIT_SNAP_DISTANCE;

      if (isAtTarget) {
        this.x = this.target.x;
        this.y = this.target.y;
        this.isMoving = false;
      } else {
        const angle = Phaser.Math.Angle.Between(
          this.x,        this.y,
          this.target.x, this.target.y
        );

        this.angle = (angle + Math.PI / 2) * Phaser.Math.RAD_TO_DEG

        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        this.x += dx * this.speed * delta;
        this.y += dy * this.speed * delta;
      }
    }
  }
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

export default Unit;
