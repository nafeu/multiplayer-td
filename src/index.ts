import Phaser from 'phaser';

import { BOARD_BACKGROUND_COLOR, BOARD_HEIGHT, BOARD_WIDTH } from './constants';

import Scene from './scene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'content',
  width: BOARD_WIDTH,
  height: BOARD_HEIGHT,
  backgroundColor: BOARD_BACKGROUND_COLOR,
  physics: {
    default: 'arcade',
  },
  scene: Scene,
};

const game = new Phaser.Game(config);

console.log('### Game', game);
