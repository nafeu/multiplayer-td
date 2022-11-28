import Phaser from 'phaser';
import { Game } from '../scenes/Game';

import { TILE_SIZE, BOARD_HEIGHT, BOARD_WIDTH } from '../constants';

import {
  getTileRowColBySceneXY,
  getValidUnitFormation,
  isTileFreeAtPosition,
} from '../utils';
import { Config } from '../configLoader';

class Pointer extends Phaser.GameObjects.GameObject {
  indicator: Phaser.GameObjects.Graphics;
  indicatorDebugText: Phaser.GameObjects.Text;

  x: number;
  y: number;

  debugTileHighlighterToggleKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Game) {
    super(scene, 'Pointer');

    this.debugTileHighlighterToggleKey =
      this.scene.input.keyboard.addKey('CTRL');
    this.indicator = scene.add.graphics().setDepth(1000);
    this.indicatorDebugText = scene.add
      .text(BOARD_WIDTH, BOARD_HEIGHT, '')
      .setDepth(1000)
      .setOrigin(1, 1);

    this.x = 0;
    this.y = 0;

    scene.input.on(
      Phaser.Input.Events.POINTER_MOVE as string,
      this.setPositionToPointerPosition,
      this
    );

    scene.input.on(
      Phaser.Input.Events.POINTER_DOWN as string,
      this.setPositionToPointerPosition,
      this
    );
  }

  gameScene() {
    return this.scene as Game;
  }

  isDebugKeyDown() {
    return this.gameScene().keyIsDown(this.debugTileHighlighterToggleKey);
  }

  update() {
    this.indicator.clear();
    this.indicatorDebugText.setText('');
    const entities = this.gameScene().entities;

    const selectedUnitCount = entities.selectedUnitGroup.size();
    const hasSelectedUnits = selectedUnitCount > 0;

    if (hasSelectedUnits) {
      const validUnitFormation = getValidUnitFormation(
        this.x,
        this.y,
        entities.selectedUnitGroup.getUnits(),
        this.gameScene().map,
        entities.interaction
      );

      const hasSpaceForUnits = validUnitFormation.length >= selectedUnitCount;

      if (
        hasSpaceForUnits &&
        isTileFreeAtPosition(this.x, this.y, this.gameScene().map)
      ) {
        this.indicator.fillStyle(
          Config.INDICATOR_VALID_SELECTION_COLOR,
          Config.INDICATOR_OPACITY
        );

        entities.selectedUnitGroup.getUnits().forEach((_, index) => {
          this.indicator.fillRect(
            validUnitFormation[index].col * TILE_SIZE,
            validUnitFormation[index].row * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
          );
        });
      } else {
        this.indicator.fillStyle(
          Config.INDICATOR_INVALID_SELECTION_COLOR,
          Config.INDICATOR_OPACITY
        );
        this.indicator.fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE);
      }
    } else {
      if (this.isDebugKeyDown()) {
        this.indicator
          .fillStyle(0xffff00, Config.INDICATOR_OPACITY)
          .fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE);

        const col = this.x / TILE_SIZE;
        const row = this.y / TILE_SIZE;

        this.indicatorDebugText.setText(
          `Pointer x=${this.x} y=${this.y} col=${col} row=${row}`
        );
      }
    }
  }

  setPositionToPointerPosition = (pointer: Phaser.Input.Pointer) => {
    const { row, col } = getTileRowColBySceneXY(pointer.x, pointer.y);

    this.x = col * TILE_SIZE;
    this.y = row * TILE_SIZE;
  };
}

export default Pointer;
