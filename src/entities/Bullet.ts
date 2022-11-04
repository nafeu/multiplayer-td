import Phaser, { Scene } from 'phaser';

import { SPRITE_ATLAS_NAME, BULLET_IMG_NAME } from '../constants';

class Bullet extends Phaser.GameObjects.Image {
  dx: number;
  dy: number;
  lifespan: number;
  speed: number;

  constructor(scene: Scene) {
    super(scene, 0, 0, SPRITE_ATLAS_NAME, BULLET_IMG_NAME);
    this.dx = 0;
    this.dy = 0;
    this.lifespan = 0;
    this.speed = Phaser.Math.GetSpeed(300, 1);
  }

  fire(x: number, y: number, angle: number) {
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    this.dx = Math.cos(angle);
    this.dy = Math.sin(angle);
    this.lifespan = 300;
  }

  update(time: number, delta: number) {
    this.lifespan -= delta;
    this.x += this.dx * (this.speed * delta);
    this.y += this.dy * (this.speed * delta);

    const shouldDeactivate = this.lifespan <= 0;

    if (shouldDeactivate) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}

export default Bullet;