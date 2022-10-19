import Phaser from 'phaser';

import {
  TILE_SIZE,
  INDICATOR_VALID_SELECTION_COLOR,
  INDICATOR_INVALID_SELECTION_COLOR,
  INDICATOR_OPACITY,
} from '../constants';

import {
  getTileByPosition,
  getValidUnitFormation,
  isTileFreeAtPosition,
  isDebugMode
} from '../utils';

import entities from '../entities.ts'

const Pointer = new Phaser.Class({
  Extends: Phaser.GameObjects.GameObject,

  initialize: function Pointer(scene, graphics) {
    this.indicator = graphics;
    scene.input.on(
      Phaser.Input.Events.POINTER_MOVE,
      this.handlePointerMove,
      this
    );

    this.x = 0;
    this.y = 0;
  },

  update: function () {
    if (!isDebugMode) return;

    this.indicator.clear();

    const selectedUnitCount = entities.selectedUnits.length
    const hasSelectedUnits = selectedUnitCount > 0

    if (hasSelectedUnits) {
      const validUnitFormation = getValidUnitFormation(
        this.x,
        this.y,
        entities.selectedUnits
      )

      const hasSpaceForUnits = validUnitFormation.length >= selectedUnitCount

      if (hasSpaceForUnits && isTileFreeAtPosition(this.x, this.y)) {
        this.indicator.fillStyle(
          INDICATOR_VALID_SELECTION_COLOR,
          INDICATOR_OPACITY
        );

        entities.selectedUnits.forEach((_, index) => {
          this.indicator.fillRect(
            validUnitFormation[index].j * TILE_SIZE,
            validUnitFormation[index].i * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
          );
        })
      } else {
        this.indicator.fillStyle(
          INDICATOR_INVALID_SELECTION_COLOR,
          INDICATOR_OPACITY
        );
        this.indicator.fillRect(
          this.x,
          this.y,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }
  },

  handlePointerMove: function(pointer) {
    const { i: y, j: x } = getTileByPosition(pointer.x, pointer.y);

    this.x = x * TILE_SIZE;
    this.y = y * TILE_SIZE;
  }
});

export default Pointer;
