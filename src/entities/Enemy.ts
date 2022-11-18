import Phaser from 'phaser';
import { Game } from '../scenes/Game';

import HealthBar from './HealthBar';

import { generateId } from '../utils';

import { ENEMY_HP, ENEMY_IMG_NAME, ENEMY_SPEED, TILE_SIZE } from '../constants';

class Enemy extends Phaser.Physics.Arcade.Sprite {
  id: string;
  follower: { t: 0; vec: Phaser.Math.Vector2 };
  hp: number;
  healthBar: HealthBar;
  recycled: number;
  enemyPath!: Phaser.Curves.Path;

  constructor(scene: Game) {
    super(scene, 0, 0, ENEMY_IMG_NAME);

    this.play({ key: `${ENEMY_IMG_NAME}-walk`, repeat: -1 });

    this.id = generateId('Enemy');

    this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
    this.hp = ENEMY_HP;

    this.healthBar = new HealthBar(scene, -100, -100, ENEMY_HP, ENEMY_HP);
    this.recycled = 0;
  }

  setCorrectBoundingBox() {
    this.body.setSize(20, 20, true);
  }

  _resetValuesForRecycle() {
    this.hp = ENEMY_HP;
    this.recycled += 1;
  }

  handleDeadOrRemoved() {
    this.setActive(false);
    this.setVisible(false);
    this.healthBar.clear();
    this._resetValuesForRecycle();
  }

  receiveDamage(damage: number) {
    this.hp -= damage;

    const shouldDeactivateEnemy = this.hp <= 0;

    if (shouldDeactivateEnemy) {
      this.handleDeadOrRemoved();
    }
  }

  startOnPath(path: Phaser.Curves.Path) {
    this.enemyPath = path;

    this.follower.t = 0;

    // get x and y of the given t point (it is mutated directly within the passed Vector)
    this.enemyPath.getPoint(this.follower.t, this.follower.vec);

    // set the x and y of our enemy to the received from the previous step
    this.setPosition(this.follower.vec.x, this.follower.vec.y);
  }

  getPositionAfterDelta(delta: number) {
    return this.enemyPath.getPoint(
      Math.min(this.follower.t + ENEMY_SPEED * delta, 1),
      this.follower.vec
    );
  }

  update(time: number, delta: number) {
    // move the t point along the path, 0 is the start and 0 is the end
    this.follower.t += ENEMY_SPEED * delta;

    // get the new x and y coordinates in vec
    this.enemyPath.getPoint(this.follower.t, this.follower.vec);

    // update enemy x and y to the newly obtained x and y
    this.setPosition(this.follower.vec.x, this.follower.vec.y);
    // if we have reached the end of the path, remove the enemy
    if (this.follower.t >= 1) {
      this.handleDeadOrRemoved();
    } else {
      this.healthBar.setPosition(
        this.follower.vec.x - TILE_SIZE / 2,
        this.follower.vec.y - (TILE_SIZE * 3) / 4
      );
      this.healthBar.setHealth(this.hp);
      this.healthBar.draw();
    }
  }
}

export default Enemy;
