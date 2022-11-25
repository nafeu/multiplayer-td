import Phaser, { Scene } from 'phaser';

import {
  SPRITE_ATLAS_NAME,
  BULLET_IMG_NAME,
  SFX_SPRITE_SHEET,
  SFX_BULLET_NORMAL,
} from '../constants';

class Bullet extends Phaser.Physics.Arcade.Image {
  dx: number;
  dy: number;
  lifespan: number;
  speed: number;

  _damage = 0;

  constructor(scene: Scene) {
    super(scene, 0, 0, SPRITE_ATLAS_NAME, BULLET_IMG_NAME);
    this.dx = 0;
    this.dy = 0;
    this.lifespan = 0;
    this.speed = Phaser.Math.GetSpeed(300, 1);
  }

  setCorrectBoundingBox() {
    this.body.setSize(10, 10, true);
  }

  setDamage(damage: number) {
    this._damage = damage;
  }

  getDamage() {
    return this._damage;
  }

  fire(x: number, y: number, angle: number) {
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    this.dx = Math.cos(angle);
    this.dy = Math.sin(angle);
    this.lifespan = 1000;
    // TODO: lifespan should match range...for now just overshoot

    this.scene.sound.playAudioSprite(SFX_SPRITE_SHEET, SFX_BULLET_NORMAL);
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
