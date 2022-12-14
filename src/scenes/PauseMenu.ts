import { BOARD_HEIGHT, BOARD_WIDTH, GLOBAL_KEYS__MENU_KEY } from '../constants';
import { getLogger } from '../logger';
import { title as GameScene } from './Game';

const logger = getLogger('PAUSE_MENU');

export const title = 'pause-menu';

export class PauseMenu extends Phaser.Scene {
  constructor() {
    super(title);
  }

  create() {
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN as string,
      this.handleToggleMenu,
      this
    );

    this.input.keyboard.on(
      `keydown-${GLOBAL_KEYS__MENU_KEY}`,
      this.handleToggleMenu,
      this
    );

    this.add.rectangle(0, 0, BOARD_WIDTH * 2, BOARD_HEIGHT * 2, 0, 0.5);

    const horizontalPosition = (BOARD_HEIGHT * 2) / 5;

    this.add
      .text(BOARD_WIDTH / 2, horizontalPosition, 'PAUSED', {
        align: 'center',
        fontSize: '32px',
      })
      .setOrigin(0.5, 0.5);
    this.add
      .text(BOARD_WIDTH / 2, horizontalPosition + 48, 'Press ESC to continue', {
        align: 'center',
      })
      .setOrigin(0.5, 0.5);
  }

  handleToggleMenu = () => {
    logger.log('### MENU:', 'unpausing...');
    this.scene.stop();
    this.scene.resume(GameScene);
  };
}
