import Phaser from 'phaser';
import { Game } from '../scenes/Game';

import HealthBar from './HealthBar';

import { generateId } from '../utils';

import {
  SPRITE_ATLAS_NAME,
  ENEMY_IMG_NAME,
  ENEMY_HP,
  ENEMY_SPEED,
} from '../constants';

class Enemy extends Phaser.Physics.Arcade.Image {
  id: string;
  follower: { t: 0; vec: Phaser.Math.Vector2 };
  hp: number;
  healthBar: HealthBar;
  recycled: number;
  enemyPath: Phaser.Curves.Path;

  constructor(scene: Game) {
    super(scene, 0, 0, SPRITE_ATLAS_NAME, ENEMY_IMG_NAME);

    this.id = generateId('Enemy');
    this.enemyPath = scene.enemyPath;

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

  startOnPath() {
    // set the t parameter at the start of the path
    this.follower.t = 0;

    // get x and y of the given t point
    this.enemyPath.getPoint(this.follower.t, this.follower.vec);

    // set the x and y of our enemy to the received from the previous step
    this.setPosition(this.follower.vec.x, this.follower.vec.y);
  }

  getPositionAfterDelta(delta: number) {
    return this.enemyPath.getPoint(
      this.follower.t + ENEMY_SPEED * delta,
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
      this.healthBar.setPosition(this.follower.vec.x, this.follower.vec.y);
      this.healthBar.setHealth(this.hp);
      this.healthBar.draw();
    }
  }
}

export default Enemy;
