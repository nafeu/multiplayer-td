import { Scene } from 'phaser';
import {
  HOMEBASE_HP,
  HOMEBASE__SHAKE_DURATION,
  HOMEBASE__SHAKE_INTENSITY,
  TILE_SIZE,
} from '../constants';
import HealthBar from './HealthBar';

// canvas splicing trick stolen from here:
// https://codesandbox.io/s/3tuus?file=/src/Play.js
function sliceFromTexture(
  scene: Scene,
  newTextureName: string,
  sourceTextureName: string,
  sourceTextureX: number,
  sourceTextureY: number
) {
  const tileSize = TILE_SIZE;

  const grass = scene.textures.get(sourceTextureName);
  const source = grass.getSourceImage();

  const newT = scene.textures.createCanvas(newTextureName, 32, 32);

  const newCtx = (newT.getSourceImage() as HTMLCanvasElement).getContext('2d');

  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
  newCtx.drawImage(
    source as HTMLImageElement,
    sourceTextureX,
    sourceTextureY,
    tileSize,
    tileSize,
    0,
    0,
    tileSize,
    tileSize
  );

  newT.refresh();
}

class HomeBase extends Phaser.GameObjects.Image {
  hp: number;
  healthBar: HealthBar;

  originalX: number;
  originalY: number;

  constructor(scene: Scene, x: number, y: number) {
    sliceFromTexture(scene, 'homebase', 'grass-biome', 32 * 3, 32 * 16);
    super(scene, 0, 0, 'homebase');

    this.x = x;
    this.y = y;
    // used for shake
    this.originalX = this.x;
    this.originalY = this.y;

    this.hp = HOMEBASE_HP;
    this.healthBar = new HealthBar(
      scene,
      this.x - 16,
      this.y - 32,
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
