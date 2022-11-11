import Phaser from 'phaser';
import { Game } from '../scenes/Game';

import {
  SPRITE_ATLAS_NAME,
  VALID_UNIT_POSITION,
  OCCUPIED_UNIT_POSITION,
  TILE_SIZE,
  UNIT_FIRE_RANGE,
  UNIT_FIRE_RATE_MS,
  UNIT_SNAP_DISTANCE,
  UNIT_MOVING_TINT,
  UNIT_SELECTED_TILE_BORDER,
  UNIT_PREPARING_TINT,
  BULLET_DAMAGE,
  UNIT_IMG_NAME__NORMAL,
  UNIT_IMG_NAME__CHONKY,
  UNIT_IMG_NAME__SPEEDY,
  UNIT_IMG_NAME__SNIPEY,
} from '../constants';
import entities from '../entities';
import { getLogger } from '../logger';
import {
  generateId,
  getPositionByTile,
  getTileRowColBySceneXY,
} from '../utils';
import Bullet from './Bullet';
import Enemy from './Enemy';
import { TileHighlight } from './TileHighlight';
import { ACTIONS, STATES, boundStateMachine } from './UnitStateMachine';

const logger = getLogger('UNIT_ENTITY');

export class Unit extends Phaser.GameObjects.Image {
  id: string;

  target: Phaser.Math.Vector2;
  speed: number;
  nextTick: number;
  isSelected: boolean;

  // path queued to be moving towards
  // only used persist requests when in transition states
  // to request new destination
  _queuedPath: MapPath;

  // path currently being consumed by Unit
  // only used when unit is moving
  activePath: MapPath;

  _machine: ReturnType<typeof boundStateMachine>;

  highlight: TileHighlight;

  tilePositionRow: number;
  tilePositionCol: number;

  map: number[][];

  STATES = STATES; // { SEIGED: 'SEIGED', PREPARING: 'PREPARING', MOVING: 'MOVING' };

  constructor(scene: Game, _spriteKey = UNIT_IMG_NAME__NORMAL) {
    super(scene, 0, 0, SPRITE_ATLAS_NAME, _spriteKey);

    this.id = generateId('Unit');
    this.map = scene.map;

    logger.log('### NEW TANKY', this);

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

  getDamage() {
    return BULLET_DAMAGE;
  }

  getFireRange() {
    return UNIT_FIRE_RANGE;
  }

  getFireRate() {
    return UNIT_FIRE_RATE_MS;
  }

  getMovementSpeed() {
    return this.speed;
  }

  toString() {
    const selected = entities.selectedUnitGroup.hasUnit(this) ? '*' : '';

    let movingStatus = '';
    const destination = this.activePath.at(-1);
    if (this.isMoving() && destination) {
      const destinationTile = getTileRowColBySceneXY(
        destination.x,
        destination.y
      );
      movingStatus = ` -> (${destinationTile.row},${destinationTile.col})`;
    }

    const currentTile = getTileRowColBySceneXY(this.x, this.y);
    const currentState = this._machine.getSnapshot().value.toString();

    return `${selected}${this.id} [${currentState}] (${currentTile.row}, ${currentTile.col})${movingStatus}`;
  }

  destroy(fromScene?: boolean): void {
    this._machine.stop();
    super.destroy(fromScene);
  }

  place(row: number, col: number) {
    this.tilePositionRow = row;
    this.tilePositionCol = col;

    const GRID_PLACEMENT_Y = row * TILE_SIZE + TILE_SIZE / 2;
    const GRID_PLACEMENT_X = col * TILE_SIZE + TILE_SIZE / 2;

    this.y = GRID_PLACEMENT_Y;
    this.x = GRID_PLACEMENT_X;
    this.target.x = this.x;
    this.target.y = this.y;

    this.map[this.tilePositionRow][this.tilePositionCol] =
      OCCUPIED_UNIT_POSITION;
  }

  fire() {
    const enemy = getEnemy(this.x, this.y, this.getFireRange());

    if (enemy) {
      this.shootBullet(enemy);
    }
  }

  shootBullet(enemy: Enemy) {
    const bullet = entities.bullets.get() as Bullet | null;

    if (bullet) {
      // When the bounding box is tighter, the collision detection precision is more important
      // And in order to be more precise,
      // we have to predict where the Enemy will be when the Bullet hits it

      // First: figure out distance to target
      // assume bullet speed >>> enemy speed (footgun: speedy units...)
      // therefore, current distance ~= distance till collision
      const approximateDistance = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        enemy.x,
        enemy.y
      );

      // Second: using distance and speed, make a prediction
      // of when the bullet will collide with the enemy
      const futurePosition = enemy.getPositionAfterDelta(
        approximateDistance / bullet.speed
      );

      const angle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        futurePosition.x,
        futurePosition.y
      );

      bullet.setDamage(this.getDamage());
      bullet.fire(this.x, this.y, angle);
    }
  }

  /**
   * queues unit to move along path
   * @param path {MapPath}
   */
  queueMove(path: MapPath) {
    this._machine.send({ type: ACTIONS.MOVE_TO, path });
  }

  /**
   * [Semi-Private API] called by State Machine
   * persists path object as queued path
   *
   * @param path {MapPath}
   */
  queueNewPath(path: MapPath) {
    this._queuedPath = path;
  }

  /**
   * [Semi-Private API] called by State Machine
   */
  hasQueuedPath() {
    return this._queuedPath.length > 0;
  }

  /**
   * [Semi-Private API] called by State Machine
   * override destination for this Unit while it is moving
   *
   * should only be called when Unit is already moving (state === MOVING)
   * towards original destination
   *
   * @param path {MapPath}
   */
  overrideActivePath(path: MapPath) {
    if (!path.length) {
      console.error(
        `${this.id} sent invalid .overrideActivePath() command`,
        path
      );
      return;
    }

    if (this.activePath.length === 0) {
      console.error(
        `${this.id} sent invalid .overrideActivePath() command | no active path`,
        this.activePath
      );
    }

    this._queuedPath = path;
    this.startMovingToQueuedPath();
  }

  /**
   * [Semi-Private API] called by State Machine
   * start moving this Unit towards queued destination
   *
   * currently also does destination validation
   */
  startMovingToQueuedPath() {
    const path = this._queuedPath;

    // find Final position
    const { x: tilePositionCol, y: tilePositionRow } = path.at(-1);

    // mark current tile as vacant
    this.map[this.tilePositionRow][this.tilePositionCol] = VALID_UNIT_POSITION;

    this.tilePositionRow = tilePositionRow;
    this.tilePositionCol = tilePositionCol;

    const GRID_PLACEMENT_Y = tilePositionRow * TILE_SIZE + TILE_SIZE / 2;
    const GRID_PLACEMENT_X = tilePositionCol * TILE_SIZE + TILE_SIZE / 2;

    this.target.y = GRID_PLACEMENT_Y;
    this.target.x = GRID_PLACEMENT_X;

    if (this.target.y !== this.y || this.target.x !== this.x) {
      this.activePath = path;
    }
    this._queuedPath = [];

    // mark final tile as occupied
    this.map[this.tilePositionRow][this.tilePositionCol] =
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
      const { row, col } = getTileRowColBySceneXY(this.x, this.y);
      this.highlight.updatePositionByTile(row, col).draw();
    } else {
      this.highlight.clear();
    }

    if (this.isPreparing()) {
      return;
    } else if (this.isSeiged()) {
      const shouldShoot = time > this.nextTick;

      if (shouldShoot) {
        this.fire();
        this.nextTick = time + this.getFireRate();
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
    const keysDuringPointerEvent =
      pointer.event as unknown as Phaser.Input.Keyboard.Key;

    if (keysDuringPointerEvent.shiftKey) {
      entities.selectedUnitGroup.toggleUnit(this);
    } else {
      entities.selectedUnitGroup.clearUnits();
      entities.selectedUnitGroup.addUnit(this);
    }
  };
}

function getEnemy(x: number, y: number, distance: number) {
  // TODO: should also allow biasing for enemies closer to HomeBase
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

    unit.activePath = [];
    unit._machine.send({ type: ACTIONS.STOP });

    return;
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

    unit.x += dx * unit.getMovementSpeed() * delta;
    unit.y += dy * unit.getMovementSpeed() * delta;

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

export class ChonkyUnit extends Unit {
  // used to toggle burst mode; see #getFireRate
  __fireRateToggle = true;

  constructor(scene: Game) {
    super(scene, UNIT_IMG_NAME__CHONKY);
  }

  getDamage() {
    return BULLET_DAMAGE * 4;
  }

  getFireRange() {
    return (UNIT_FIRE_RANGE * 2) / 3;
  }

  getFireRate() {
    // TODO: different burst options, current only double-tap
    this.__fireRateToggle = !this.__fireRateToggle;
    return UNIT_FIRE_RATE_MS * (this.__fireRateToggle ? 1 : 2);
  }

  getMovementSpeed() {
    return this.speed / 4;
  }
}

export class SpeedyUnit extends Unit {
  constructor(scene: Game) {
    super(scene, UNIT_IMG_NAME__SPEEDY);
  }

  getDamage() {
    return BULLET_DAMAGE / 4;
  }

  getFireRange() {
    return UNIT_FIRE_RANGE;
  }

  getFireRate() {
    return UNIT_FIRE_RATE_MS / 2;
  }

  getMovementSpeed() {
    return this.speed * 2;
  }
}

export class SnipeyUnit extends Unit {
  constructor(scene: Game) {
    super(scene, UNIT_IMG_NAME__SNIPEY);
  }

  getDamage() {
    return BULLET_DAMAGE * 2;
  }

  getFireRange() {
    return UNIT_FIRE_RANGE * 3;
  }

  getFireRate() {
    return UNIT_FIRE_RATE_MS * 6;
  }

  getMovementSpeed() {
    return this.speed / 2;
  }
}

export default Unit;

export const UnitType = {
  NORMAL: Unit,
  SPEEDY: SpeedyUnit,
  CHONKY: ChonkyUnit,
  SNIPEY: SnipeyUnit,
};

export type UnitTypeOption = keyof typeof UnitType;
