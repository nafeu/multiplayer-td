import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import { generateId } from '../utils';

class HealthBar {
  id: string;

  bar: Phaser.GameObjects.Graphics;
  xPos: number;
  yPos: number;

  currentValue: number;
  totalValue: number;

  width: number;

  constructor(scene, x, y, currentValue, totalValue, width = TILE_SIZE) {
    this.id = generateId('HealthBar');

    this.bar = new Phaser.GameObjects.Graphics(scene);

    this.xPos = x;
    this.yPos = y;

    this.currentValue = currentValue;
    this.totalValue = totalValue;

    this.width = width;

    scene.add.existing(this.bar);
  }

  setHealth(currentValue) {
    this.currentValue = currentValue;
  }

  setPosition(xPos, yPos) {
    this.xPos = xPos;
    this.yPos = yPos;
  }

  clear() {
    this.bar.clear();
  }

  destroy() {
    this.bar.destroy();
  }

  draw() {
    const BAR_HEIGHT = 10;
    const BORDER_WIDTH = 2;
    const BAR_COLOUR_HEALTHY = 0x00ff00;
    const BAR_COLOUR_LOW = 0xff0000;
    const BAR_LOW_THRESHOLD = 0.4;

    this.bar.clear();

    // BG - Black Border
    this.bar.fillStyle(0x000000);
    this.bar.fillRect(this.xPos, this.yPos, this.width, BAR_HEIGHT);

    // BG - White Background
    this.bar.fillStyle(0xffffff);
    this.bar.fillRect(
      this.xPos + BORDER_WIDTH,
      this.yPos + BORDER_WIDTH,
      this.width - 2 * BORDER_WIDTH,
      BAR_HEIGHT - 2 * BORDER_WIDTH
    );

    //  Health
    const percentage = this.currentValue / this.totalValue;

    // Danger Health
    if (percentage < BAR_LOW_THRESHOLD) {
      this.bar.fillStyle(BAR_COLOUR_LOW);
    } else {
      this.bar.fillStyle(BAR_COLOUR_HEALTHY);
    }

    this.bar.fillRect(
      this.xPos + BORDER_WIDTH,
      this.yPos + BORDER_WIDTH,
      percentage * this.width - 2 * BORDER_WIDTH,
      BAR_HEIGHT - 2 * BORDER_WIDTH
    );
  }
}

export default HealthBar;
