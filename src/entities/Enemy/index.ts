import Phaser from 'phaser';

import map from '../../map';

import {
  SPRITE_ATLAS_NAME,
  ENEMY_IMG_NAME,
  ENEMY_HP,
  ENEMY_SPEED,
} from '../../constants';
import HealthBar from '../../HealthBar';
import { generateId } from '../../utils';

const Enemy = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,

  initialize: function Enemy(scene) {
    Phaser.GameObjects.Image.call(
      this,
      scene,
      0,
      0,
      SPRITE_ATLAS_NAME,
      ENEMY_IMG_NAME
    );

    this.id = generateId('Enemy');

    this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
    this.hp = ENEMY_HP;

    this.healthBar = new HealthBar(scene, -100, -100, ENEMY_HP, ENEMY_HP);
    this.recycled = 0;
  },

  _resetValuesForRecycle: function () {
    this.hp = ENEMY_HP;
    this.recycled += 1;
  },

  handleDeadOrRemoved: function () {
    this.setActive(false);
    this.setVisible(false);
    this.healthBar.clear();
    this._resetValuesForRecycle();
  },

  receiveDamage: function (damage) {
    this.hp -= damage;

    const shouldDeactivateEnemy = this.hp <= 0;

    if (shouldDeactivateEnemy) {
      this.handleDeadOrRemoved();
    }
  },

  startOnPath: function () {
    // set the t parameter at the start of the path
    this.follower.t = 0;

    // get x and y of the given t point
    map.path.getPoint(this.follower.t, this.follower.vec);

    // set the x and y of our enemy to the received from the previous step
    this.setPosition(this.follower.vec.x, this.follower.vec.y);
  },

  update: function (time, delta) {
    // move the t point along the path, 0 is the start and 0 is the end
    this.follower.t += ENEMY_SPEED * delta;

    // get the new x and y coordinates in vec
    map.path.getPoint(this.follower.t, this.follower.vec);

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
  },
});

export default Enemy;
