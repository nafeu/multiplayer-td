import { Scene } from 'phaser';

import { Config } from '../configLoader';
import { HOMEBASE_TEXTURE_NAME, TILE_SIZE } from '../constants';
import HealthBar from './HealthBar';

class HomeBase extends Phaser.GameObjects.Image {
  hp: number;
  healthBar: HealthBar;

  _previousDamageTintReset: Phaser.Time.TimerEvent | null;

  constructor(scene: Scene) {
    super(scene, 0, 0, HOMEBASE_TEXTURE_NAME);

    this.hp = Config.HOMEBASE_HP;
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
    this.syncHealthBarPosition();
    return this;
  }

  syncHealthBarPosition() {
    this.healthBar.setPosition(this.x - TILE_SIZE / 2, this.y - TILE_SIZE);
  }

  toString() {
    return `Homebase [hp: ${this.hp}]`;
  }

  receiveDamage(damage: number) {
    this.hp -= damage;

    this.scene.cameras.main.shake(
      Config.HOMEBASE__SHAKE_DURATION,
      Config.HOMEBASE__SHAKE_INTENSITY
    );

    this.setTint(Config.HOMEBASE_DAMAGED_TINT);

    // don't clober the new tint with a stale reset
    this._previousDamageTintReset?.remove();
    this._previousDamageTintReset = this.scene.time.delayedCall(
      Config.HOMEBASE__SHAKE_DURATION,
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
      this.setTint(Config.HOMEBASE_DEAD_TINT);
    }
  }

  update(time: number, delta: number) {
    this.healthBar.setHealth(this.hp).draw();
  }
}

export default HomeBase;
