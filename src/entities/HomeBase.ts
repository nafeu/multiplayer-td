import { Scene } from 'phaser';
import { t } from 'xstate';
import {
  HOMEBASE_DAMAGED_TINT,
  HOMEBASE_DEAD_TINT,
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

  _previousDamageTintReset: Phaser.Time.TimerEvent | null;

  constructor(scene: Scene, x = -100, y = -100) {
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

    this._previousDamageTintReset = null;
  }

  setDepth(depth: number) {
    super.setDepth(depth);
    this.healthBar.bar.setDepth(depth);

    return this;
  }

  setNewPosition(x: number, y: number) {
    this.x = x;
    this.y = y;

    this.healthBar.setPosition(this.x - TILE_SIZE / 2, this.y - TILE_SIZE);

    return this;
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

    this.setTint(HOMEBASE_DAMAGED_TINT);

    // don't clober the new tint with a stale reset
    this._previousDamageTintReset?.remove();
    this._previousDamageTintReset = this.scene.time.delayedCall(
      HOMEBASE__SHAKE_DURATION,
      () => {
        this.clearTint();
        this._previousDamageTintReset = null;
      },
      [],
      this
    );

    if (this.hp <= 0) {
      this.hp = 0;

      this._previousDamageTintReset?.remove();
      this.setTint(HOMEBASE_DEAD_TINT);
    }
  }

  update(time: number, delta: number) {
    this.healthBar.setHealth(this.hp).draw();
  }
}

export default HomeBase;