import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../constants';
import { title as GameScene } from './Game';

export const title = 'game-over-menu';

export class GameOver extends Phaser.Scene {
  constructor() {
    super(title);
  }

  create() {
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN as string,
      this.handleRestartGame,
      this
    );

    const verticalPosition = (BOARD_HEIGHT * 2) / 5;
    const initialY = BOARD_HEIGHT / 2;

    const text = this.add
      .text(BOARD_WIDTH / 2, initialY, 'GAME OVER', {
        align: 'center',
        fontSize: '32px',
      })
      .setAlpha(0)
      .setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: text,
      alpha: { value: 1, duration: 2000, ease: 'Power1' },
      y: { value: verticalPosition, duration: 3000, ease: 'Power1' },
    });

    const subtextFinalY = verticalPosition + 48;
    const subtextInitialY = initialY + 16;

    const subtext = this.add
      .text(BOARD_WIDTH / 2, subtextInitialY, 'Click to Restart', {
        align: 'center',
      })
      .setAlpha(0)
      .setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: subtext,
      alpha: { value: 1, delay: 2000, duration: 500, ease: 'Power1' },
      y: {
        value: subtextFinalY,
        delay: 2000,
        duration: 1000,
        ease: 'Power1',
      },
    });
  }

  handleRestartGame = () => {
    this.scene.stop();
    this.scene.get(GameScene).scene.restart();
  };
}
