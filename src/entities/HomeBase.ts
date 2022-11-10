import { Scene } from 'phaser';
import { SPRITE_ATLAS_NAME, TILE_SIZE } from '../constants';
import {
  getPositionByTile,
  getPositionForTileCoordinates,
  getTileCoordinatesByPosition,
} from '../utils';
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

  isShaking = false;
  shakeTimeTotal = 250;
  shakeTimeRemaining: number;

  constructor(scene: Scene, x: number, y: number) {
    sliceFromTexture(scene, 'homebase', 'grass-biome', 32 * 3, 32 * 16);
    super(scene, 0, 0, 'homebase');

    this.x = x;
    this.y = y;
    // used for shake
    this.originalX = this.x;
    this.originalY = this.y;

    this.hp = 100_000;
    this.healthBar = new HealthBar(
      scene,
      this.x - 16,
      this.y - 32,
      this.hp,
      this.hp
    );

    this.isShaking = false;
    this.shakeTimeRemaining = this.shakeTimeTotal;
  }

  toString() {
    return `hp: ${this.hp}`;
  }

  receiveDamage(damage: number) {
    this.hp -= damage;

    this.scene.cameras.main.shake(200, 0.0125);
    // this.isShaking = true;
    // // reset any existing shake timer
    // this.shakeTimeRemaining = this.shakeTimeTotal;

    if (this.hp <= 0) {
      this.hp = 0;
    }
  }

  shake(timeDelta: number) {
    const shakePeriod = 15;
    const offsetX = wiggle(
      this.shakeTimeRemaining / this.shakeTimeTotal,
      shakePeriod,
      shakePeriod * 4
    );

    const offsetY = wiggle(
      this.shakeTimeRemaining / this.shakeTimeTotal,
      shakePeriod * 4,
      shakePeriod
    );

    // if (this.shakeTimeRemaining === this.shakeTimeTotal) {
    //   console.log(
    //     'shake for',
    //     this.shakeTimeRemaining / this.shakeTimeTotal,
    //     shakePeriod,
    //     shakePeriod * 4
    //   );
    // }

    this.x = this.originalX + offsetX * 2;
    this.y = this.originalY + -offsetY * 2;

    this.shakeTimeRemaining -= timeDelta;

    if (this.shakeTimeRemaining <= 0) {
      this.shakeTimeRemaining = 0;
      this.isShaking = false;

      this.x = this.originalX;
      this.y = this.originalY;
    }
  }

  update(time: number, delta: number) {
    this.healthBar.setHealth(this.hp).draw();

    if (this.isShaking) this.shake(delta);

    if (this.hp <= 0) {
      this.setTint(0x0f0f0f);
    }
  }
}

export default HomeBase;

// https://www.html5gamedevs.com/topic/22206-shaking-a-sprite/?do=findComment&comment=126560
function wiggle(aProgress: number, aPeriod1: number, aPeriod2: number): number {
  const current1: number = aProgress * Math.PI * 2 * aPeriod1;
  const current2: number = aProgress * (Math.PI * 2 * aPeriod2 + Math.PI / 2);

  return Math.sin(current1) * Math.cos(current2);
}
