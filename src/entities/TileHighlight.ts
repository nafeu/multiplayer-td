import { Scene } from 'phaser';
import { TILE_SIZE } from '../constants';
import { generateId } from '../utils';

export class TileHighlight {
  id: string;

  lineColour: number;
  fillColour: number;
  borderSize: number;

  shape: Phaser.GameObjects.Graphics;

  xPos: number;
  yPos: number;

  constructor(
    scene: Scene,
    borderSize: number,
    lineColour: number,
    fillColour = -1
  ) {
    this.id = generateId('TileHighlight');

    this.shape = new Phaser.GameObjects.Graphics(scene);
    scene.add.existing(this.shape);

    this.xPos = -100;
    this.yPos = -100;

    this.lineColour = lineColour;
    this.fillColour = fillColour >= 0 ? fillColour : null;
    this.borderSize = borderSize;
  }

  /**
   * @deprecated Use #updatePositionByTile instead
   */
  updatePosition(xPos: number, yPos: number) {
    this.xPos = xPos;
    this.yPos = yPos;
  }

  updatePositionByTile(tileRow: number, tileCol: number) {
    this.xPos = tileCol * TILE_SIZE;
    this.yPos = tileRow * TILE_SIZE;

    return this;
  }

  clear() {
    this.shape.clear();

    return this;
  }

  destory() {
    this.shape.destroy();
  }

  draw() {
    this.clear();

    const LINE_WIDTH = this.borderSize;
    const LINE_COLOUR = this.lineColour;
    const FILL_COLOUR = this.fillColour ?? this.lineColour;

    const x = this.xPos,
      y = this.yPos;

    this.shape.moveTo(x, y);
    this.shape.lineStyle(LINE_WIDTH, LINE_COLOUR);
    this.shape.fillStyle(FILL_COLOUR, 0.25);

    this.shape.beginPath();
    this.shape.lineTo(x + TILE_SIZE, y);
    this.shape.lineTo(x + TILE_SIZE, y + TILE_SIZE);
    this.shape.lineTo(x, y + TILE_SIZE);
    this.shape.lineTo(x, y);

    this.shape.closePath();
    this.shape.fillPath();
    this.shape.strokePath();

    return this;
  }
}
