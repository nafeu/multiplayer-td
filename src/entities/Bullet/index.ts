import Phaser from 'phaser';

import {
  SPRITE_ATLAS_NAME,
  BULLET_IMG_NAME
} from '../../constants';

const Bullet = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,

  initialize: function Bullet(scene) {
    Phaser.GameObjects.Image.call(
      this,
      scene,
      0,
      0,
      SPRITE_ATLAS_NAME,
      BULLET_IMG_NAME
    );
    this.dx = 0;
    this.dy = 0;
    this.lifespan = 0;
    this.speed = Phaser.Math.GetSpeed(300, 1);
  },

  fire: function (x, y, angle) {
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    this.dx = Math.cos(angle);
    this.dy = Math.sin(angle);
    this.lifespan = 300;
  },

  update: function (time, delta) {
    this.lifespan -= delta;
    this.x += this.dx * (this.speed * delta);
    this.y += this.dy * (this.speed * delta);
    if (this.lifespan <= 0) {
      this.setActive(false);
      this.setVisible(false);
    }
  },
});

export default Bullet;
