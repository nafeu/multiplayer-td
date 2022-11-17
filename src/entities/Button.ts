import { Scene } from 'phaser';

export class Button extends Phaser.GameObjects.Text {
  constructor(
    scene: Scene,
    x: number,
    y: number,
    text: string,
    callback: () => void,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ) {
    super(scene, x, y, text, style as Phaser.Types.GameObjects.Text.TextStyle);

    this.scene.add.existing(this);
    this.setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.enterButtonHoverState())
      .on('pointerout', () => this.enterButtonRestState())
      .on('pointerdown', () => this.enterButtonActiveState())
      .on('pointerup', () => {
        this.enterButtonHoverState();
        callback();
      });
  }
  enterButtonHoverState() {
    this.setStyle({ fill: '#ff0' });
  }

  enterButtonRestState() {
    this.setStyle({ fill: '#0f0' });
  }

  enterButtonActiveState() {
    this.setStyle({ fill: '#0ff' });
  }
}
