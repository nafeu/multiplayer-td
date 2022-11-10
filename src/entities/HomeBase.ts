import { Scene } from 'phaser';
import {
  HOMEBASE_HP,
  HOMEBASE_TEXTURE_NAME,
  HOMEBASE__SHAKE_DURATION,
  HOMEBASE__SHAKE_INTENSITY,
  TILE_SIZE,
} from '../constants';
import HealthBar from './HealthBar';

class HomeBase extends Phaser.GameObjects.Image {
  hp: number;
  healthBar: HealthBar;

  constructor(scene: Scene, x: number, y: number) {
    super(scene, 0, 0, HOMEBASE_TEXTURE_NAME);

    this.x = x;
    this.y = y;

    this.hp = HOMEBASE_HP;
    this.healthBar = new HealthBar(
      scene,
      this.x - TILE_SIZE / 2,
      this.y - TILE_SIZE,
      this.hp,
      this.hp
    );
  }

  toString() {
    return `Homebase [hp: ${this.hp}]`;
  }

  receiveDamage(damage: number) {
    this.hp -= damage;

    this.scene.cameras.main.shake(
      HOMEBASE__SHAKE_DURATION,
      HOMEBASE__SHAKE_INTENSITY
    );

    if (this.hp <= 0) {
      this.hp = 0;
    }
  }

  update(time: number, delta: number) {
    this.healthBar.setHealth(this.hp).draw();

    if (this.hp <= 0) {
      this.setTint(0x0f0f0f);
    }
  }
}

export default HomeBase;
