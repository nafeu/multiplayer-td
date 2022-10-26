import Phaser, { Scene } from 'phaser';

import {
  TILE_SIZE,
  INDICATOR_VALID_SELECTION_COLOR,
  INDICATOR_INVALID_SELECTION_COLOR,
  INDICATOR_OPACITY,
} from '../constants';

import {
  getTileCoordinatesByPosition,
  getValidUnitFormation,
  isTileFreeAtPosition,
  isDebugMode,
} from '../utils';

import entities from '../entities';

class Pointer extends Phaser.GameObjects.GameObject {
  indicator: Phaser.GameObjects.Graphics;
  x: number;
  y: number;

  constructor(scene: Scene, graphics: Phaser.GameObjects.Graphics) {
    super(scene, 'Pointer');

    this.indicator = graphics;
    scene.input.on(
      Phaser.Input.Events.POINTER_MOVE as string,
      this.handlePointerMove,
      this
    );

    this.x = 0;
    this.y = 0;
  }

  update() {
    if (!isDebugMode) return;

    this.indicator.clear();

    const selectedUnitCount = entities.selectedUnitGroup.size();
    const hasSelectedUnits = selectedUnitCount > 0;

    if (hasSelectedUnits) {
      const validUnitFormation = getValidUnitFormation(
        this.x,
        this.y,
        entities.selectedUnitGroup.getUnits()
      );

      const hasSpaceForUnits = validUnitFormation.length >= selectedUnitCount;

      if (hasSpaceForUnits && isTileFreeAtPosition(this.x, this.y)) {
        this.indicator.fillStyle(
          INDICATOR_VALID_SELECTION_COLOR,
          INDICATOR_OPACITY
        );

        entities.selectedUnitGroup.getUnits().forEach((_, index) => {
          this.indicator.fillRect(
            validUnitFormation[index].j * TILE_SIZE,
            validUnitFormation[index].i * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
          );
        });
      } else {
        this.indicator.fillStyle(
          INDICATOR_INVALID_SELECTION_COLOR,
          INDICATOR_OPACITY
        );
        this.indicator.fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  handlePointerMove = (pointer: Phaser.Input.Pointer) => {
    const { i: y, j: x } = getTileCoordinatesByPosition(pointer.x, pointer.y);

    this.x = x * TILE_SIZE;
    this.y = y * TILE_SIZE;
  };
}

export default Pointer;
