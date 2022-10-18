import Phaser, { Scene } from 'phaser';

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
  UNIT_SELECTED_TILE_BORDER,
  UNIT_PREPARING_TINT,
} from '../constants';
import entities from '../entities';
import map, { MapPath } from '../map';
import {
  generateId,
  getPositionByTile,
  getTileCoordinatesByPosition,
} from '../utils';
import Bullet from './Bullet';
import Enemy from './Enemy';
import { TileHighlight } from './TileHighlight';
import { ACTIONS, STATES, boundStateMachine } from './UnitStateMachine';

export class Unit extends Phaser.GameObjects.Image {
  id: string;

  target: Phaser.Math.Vector2;
  speed: number;
  nextTick: number;
  isSelected: boolean;
  activePath: MapPath | null;
  _queuedPath: MapPath | null;
  _machine: ReturnType<typeof boundStateMachine>;

  highlight: TileHighlight;

  tilePositionRow: number;
  tilePositionCol: number;

  STATES = STATES; // { SEIGED: 'SEIGED', PREPARING: 'PREPARING', MOVING: 'MOVING' };

  constructor(scene: Scene) {
    super(scene, 0, 0, SPRITE_ATLAS_NAME, TANK_IMG_NAME);

    this.id = generateId('Unit');

    this.target = new Phaser.Math.Vector2();
    this.speed = Phaser.Math.GetSpeed(100, 1);
    this.nextTick = 0;
    this.isSelected = false;
    this._queuedPath = [];
    this.activePath = [];

    this._machine = boundStateMachine(this);
    this._machine.start();

    this.highlight = new TileHighlight(scene, 2, UNIT_SELECTED_TILE_BORDER);

    this.on(
      Phaser.Input.Events.POINTER_DOWN as string,
      this.handlePointerDown,
      this
    );
  }

  destroy(fromScene?: boolean): void {
    this._machine.stop();
    super.destroy(fromScene);
  }

  place(i: number, j: number) {
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

  queueMove(path: MapPath) {
    this._queuedPath = path;
    this._machine.send({ type: ACTIONS.MOVE_TO, path });
  }

  move() {
    const path = this._queuedPath;
    const { x: tilePositionCol, y: tilePositionRow } = path.at(-1);

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
      this._queuedPath = [];
    }

    map.unitValid[this.tilePositionRow][this.tilePositionCol] =
      OCCUPIED_UNIT_POSITION;
  }

  isMoving() {
    return this._machine.getSnapshot().matches(this.STATES.MOVING);
  }

  isSeiged() {
    return this._machine.getSnapshot().matches(this.STATES.SEIGED);
  }

  isPreparing() {
    const snapshot = this._machine.getSnapshot();
    return (
      snapshot.matches(this.STATES.PREPARING_TO_MOVE) ||
      snapshot.matches(this.STATES.PREPARING_TO_SEIGE)
    );
  }

  update(time: number, delta: number) {
    if (this.isMoving()) {
      this.setTint(UNIT_MOVING_TINT);
    } else if (this.isPreparing()) {
      this.setTint(UNIT_PREPARING_TINT);
    } else {
      this.clearTint();
    }

    if (entities.selectedUnitGroup.hasUnit(this)) {
      const { i, j } = getTileCoordinatesByPosition(this.x, this.y);
      this.highlight.updatePositionByTile(i, j).draw();
    } else {
      this.highlight.clear();
    }

    if (this.isPreparing()) {
      return;
    } else if (this.isSeiged()) {
      const shouldShoot = time > this.nextTick;

      if (shouldShoot) {
        this.fire();
        this.nextTick = time + UNIT_FIRE_RATE_MS;
      }
    } else if (this.isMoving()) {
      const isMovingToTarget =
        this.x !== this.target.x || this.y !== this.target.y;

      if (isMovingToTarget) {
        moveTowardsTarget(this, delta);
      }
    }
  }

  handlePointerDown = (pointer: Phaser.Input.Pointer) => {
    const keysDuringPointerEvent = pointer.event as Phaser.Input.Keyboard.Key;

    if (keysDuringPointerEvent.ctrlKey) {
      this.destroy();
      map.unitValid[this.tilePositionRow][this.tilePositionCol] =
        VALID_UNIT_POSITION;
      return;
    }

    if (keysDuringPointerEvent.shiftKey) {
      const unitIsNotSelected = !entities.selectedUnitGroup.hasUnit(this);

      if (unitIsNotSelected) {
        entities.selectedUnitGroup.addUnit(this);
      }
    } else {
      entities.selectedUnitGroup.clearUnits();
      entities.selectedUnitGroup.addUnit(this);
    }
  };
}

function addBullet(x: number, y: number, angle: number) {
  const bullet = entities.bullets.get() as Bullet | null;

  if (bullet) {
    bullet.fire(x, y, angle);
  }
}

function getEnemy(x: number, y: number, distance: number) {
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

function moveTowardsTarget(unit: Unit, delta: number) {
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
    unit._machine.send({ type: ACTIONS.STOP });

    return;
  } else {
    if (!unit.activePath.length) console.error('### FAILURE', unit.activePath);
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
      // Pops first element from array, essentially marking point as consumed
      unit.activePath.shift();
    }
  }
}

export default Unit;
