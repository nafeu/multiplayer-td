import { BOARD_HEIGHT, BOARD_WIDTH } from '../constants';
import { hasDebugFlag } from '../utils';
import { title as GameScene } from './Game';

export const title = 'main-menu';

export class MainMenu extends Phaser.Scene {
  constructor() {
    super(title);
  }

  create() {
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN as string,
      this.handleStartGame,
      this
    );

    this.input.keyboard.on(`keydown-ENTER`, this.handleStartGame, this);

    this.add.rectangle(0, 0, BOARD_WIDTH * 2, BOARD_HEIGHT * 2, 0, 0.5);

    const horizontalPosition = (BOARD_HEIGHT * 2) / 5;

    this.add
      .text(BOARD_WIDTH / 2, horizontalPosition, 'TaNkYbOiZ', {
        align: 'center',
        fontSize: '32px',
      })
      .setOrigin(0.5, 0.5);
    this.add
      .text(BOARD_WIDTH / 2, horizontalPosition + 48, 'Press Enter to start', {
        align: 'center',
      })
      .setOrigin(0.5, 0.5);

    if (hasDebugFlag('quick-start')) {
      this.handleStartGame();
    }
  }

  handleStartGame = () => {
    this.scene.stop();
    this.scene.start(GameScene);
  };
}
