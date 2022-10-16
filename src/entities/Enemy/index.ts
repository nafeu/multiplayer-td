import Phaser from 'phaser';

import map from '../../map'

import {
  SPRITE_ATLAS_NAME,
  ENEMY_IMG_NAME,
  ENEMY_HP,
  ENEMY_SPEED
} from '../../constants';

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

    this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
    this.hp = ENEMY_HP;
  },

  receiveDamage: function (damage) {
    this.hp -= damage;

    const shouldDeactivateEnemy = this.hp <= 0;

    if (shouldDeactivateEnemy) {
      this.setActive(false);
      this.setVisible(false);
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
      this.setActive(false);
      this.setVisible(false);
    }
  },
});

export default Enemy;
