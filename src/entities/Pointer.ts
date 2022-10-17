import Phaser from 'phaser';

import { TILE_SIZE } from '../constants';
import { getTileByPosition } from '../utils';

const Pointer = new Phaser.Class({
  Extends: Phaser.GameObjects.GameObject,

  initialize: function Pointer(scene, graphics) {
    this.indicator = graphics;
    scene.input.on(
      Phaser.Input.Events.POINTER_MOVE,
      this.handlePointerMove,
      this
    );
  },

  update: function () {
    this.indicator.clear();
    this.indicator.fillStyle(0x00ff00);
    this.indicator.fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE);
  },

  handlePointerMove: function(pointer) {
    const { i: y, j: x } = getTileByPosition(pointer.x, pointer.y);

    this.x = x * TILE_SIZE;
    this.y = y * TILE_SIZE;
  }
});

export default Pointer;
