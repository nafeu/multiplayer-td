import Phaser from 'phaser';

import entities from '../entities';
import map, { MapPath } from '../map';

import { generateId, getPositionByTile } from '../utils';

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
  UNIT_SELECTED_TINT,
} from '../constants';
import Enemy from './Enemy';

class Unit extends Phaser.GameObjects.Image {
  id: string;

  isMoving: boolean;
  target: Phaser.Math.Vector2;
  speed: number;
  nextTick: number;
  isSelected: boolean;
  activePath: MapPath | null;

  tilePositionRow: number;
  tilePositionCol: number;

  constructor(scene) {
    super(scene, 0, 0, SPRITE_ATLAS_NAME, TANK_IMG_NAME);

    this.id = generateId('Unit');

    this.isMoving = false;
    this.target = new Phaser.Math.Vector2();
    this.speed = Phaser.Math.GetSpeed(100, 1);
    this.nextTick = 0;
    this.isSelected = false;
    this.activePath = [];

    this.on('pointerdown', function (pointer) {
      if (pointer.event.ctrlKey) {
        this.destroy();
        map.unitValid[this.tilePositionRow][this.tilePositionCol] =
          VALID_UNIT_POSITION;
        return;
      }

      if (pointer.event.shiftKey) {
        const unitIsNotSelected =
          entities.selectedUnits.find((unit) => unit.id === this.id) ===
          undefined;

        if (unitIsNotSelected) {
          entities.selectedUnits.push(this);
        }
      } else {
        entities.selectedUnits = [];
        entities.selectedUnits.push(this);
      }
    });
  }

  place(i, j) {
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
  }

  fire() {
    const enemy = getEnemy(this.x, this.y, UNIT_FIRE_RANGE);

    if (enemy) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
      addBullet(this.x, this.y, angle);
      this.angle = (angle + Math.PI / 2) * Phaser.Math.RAD_TO_DEG;
    }
  }

  move(path: MapPath) {
    const { x: tilePositionCol, y: tilePositionRow } = path[path.length - 1];

    map.unitValid[this.tilePositionRow][this.tilePositionCol] =
      VALID_UNIT_POSITION;

    this.tilePositionRow = tilePositionRow;
    this.tilePositionCol = tilePositionCol;

    const GRID_PLACEMENT_Y = tilePositionRow * TILE_SIZE + TILE_SIZE / 2;
    const GRID_PLACEMENT_X = tilePositionCol * TILE_SIZE + TILE_SIZE / 2;

    this.target.y = GRID_PLACEMENT_Y;
    this.target.x = GRID_PLACEMENT_X;

    if (this.target.y !== this.y || this.target.x !== this.x) {
      this.activePath = path;
      this.isMoving = true;
    }

    map.unitValid[this.tilePositionRow][this.tilePositionCol] =
      OCCUPIED_UNIT_POSITION;
  }

  update(time, delta) {
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

    const isMovingToTarget =
      this.isMoving && (this.x !== this.target.x || this.y !== this.target.y);

    if (isMovingToTarget) {
      moveTowardsTarget(this, delta);
    }
  }
}

function addBullet(x, y, angle) {
  const bullet = entities.bullets.get();

  if (bullet) {
    bullet.fire(x, y, angle);
  }
}

function getEnemy(x, y, distance) {
  const enemyUnits = entities.enemyGroup.getChildren() as Array<Enemy>;

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

function moveTowardsTarget(unit, delta) {
  const distance = Phaser.Math.Distance.Between(
    unit.x,
    unit.y,
    unit.target.x,
    unit.target.y
  );

  const isAtTarget = distance <= UNIT_SNAP_DISTANCE;

  if (isAtTarget) {
    unit.x = unit.target.x;
    unit.y = unit.target.y;
    unit.isMoving = false;
  } else {
    const activePathTargetX = getPositionByTile(unit.activePath[0].x);
    const activePathTargetY = getPositionByTile(unit.activePath[0].y);

    const angle = Phaser.Math.Angle.Between(
      unit.x,
      unit.y,
      activePathTargetX,
      activePathTargetY
    );

    unit.angle = (angle + Math.PI / 2) * Phaser.Math.RAD_TO_DEG;

    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    unit.x += dx * unit.speed * delta;
    unit.y += dy * unit.speed * delta;

    const distance = Phaser.Math.Distance.Between(
      unit.x,
      unit.y,
      activePathTargetX,
      activePathTargetY
    );

    const isAtActiveTarget = distance <= UNIT_SNAP_DISTANCE;

    if (isAtActiveTarget) {
      unit.activePath.shift();
    }
  }
}

export default Unit;
