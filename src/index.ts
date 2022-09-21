import Phaser from "phaser";

const SPRITE_ATLAS_NAME = "sprites";
const TANK_IMG_NAME = "36.png";
// 5, 11, 17
const ENEMY_IMG_NAME = "05.png";

const TILE_SIZE = 32; // matches sprite size

const entities = {
  player: {
    1: null,
  },
  enemies: [],
};

const map = {
  path: null,
  graphics: null,
};

function setupPlayerSprite(sprite) {
  sprite.on("pointerdown", function (pointer) {
    this._isDown = true;
    this._isSelected = !this._isSelected;
    this.setTint(0xff0000);
  });

  sprite.on("pointerout", function (pointer) {
    this._isDown && this.clearTint();
  });

  sprite.on("pointerup", function (pointer) {
    this._isDown = false;
    this._isSelected || this.clearTint();
  });
}

class Scene extends Phaser.Scene {
  constructor() {
    super("main");
  }

  preload() {
    // Stole spritesheet from here:
    // https://imgur.com/gallery/mewD6ts
    // Used free web sheet editor here:
    // https://free-tex-packer.com/app/

    // load the game assets – enemy and turret atlas
    this.load.path = "public/";
    this.load.atlas(
      SPRITE_ATLAS_NAME,
      "assets/spritesheet.png",
      "assets/spritesheet.json.text" // this .text is a hack to bypass bun dev server turning .json into ESM -- see: https://github.com/oven-sh/bun/issues/1213
    );
  }

  create() {
    this.input.on("pointerdown", function (pointer) {
      if (entities.player[1]._isDown) {
      } else if (entities.player[1]._isSelected) {
        entities.player[1].x = Math.floor(pointer.x / TILE_SIZE) * TILE_SIZE;
        entities.player[1].y = Math.floor(pointer.y / TILE_SIZE) * TILE_SIZE;
        entities.player[1]._isSelected = false;
        entities.player[1].clearTint();
      } else {
        // only deselect if not clicked on
        entities.player[1].clearTint();
      }
    });

    entities.player[1] = this.add
      .image(32, 32, SPRITE_ATLAS_NAME, TANK_IMG_NAME)
      .setOrigin(0, 0)
      .setInteractive();

    setupPlayerSprite(entities.player[1]);

    entities.enemies.push(
      this.add.image(0, 0, SPRITE_ATLAS_NAME, ENEMY_IMG_NAME).setOrigin(0, 0)
    );

    // this graphics element is only for visualization,
    // its not related to our path
    map.graphics = this.add.graphics();

    // the path for our enemies
    // parameters are the start x and y of our path
    map.path = this.add.path(96, -32);
    map.path.lineTo(96, 164);
    map.path.lineTo(480, 164);
    map.path.lineTo(480, 544);

    map.graphics.lineStyle(3, 0xffffff, 1);
    // visualize the path
    map.path.draw(map.graphics);
  }

  update() {}
}

var config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "content",
  width: 640,
  height: 512,
  scene: Scene,
};

const game = new Phaser.Game(config);

// var Enemy = new Phaser.Class({
//   Extends: Phaser.GameObjects.Image,
//   initialize: function Enemy(scene) {
//     Phaser.GameObjects.Image.call(this, scene, 0, 0, "sprites", "enemy");
//   },
//   this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
//   update: function (time, delta) {},
// });
