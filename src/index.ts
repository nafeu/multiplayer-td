import Phaser from 'phaser';

import {
  BOARD_BACKGROUND_COLOR,
  BOARD_HEIGHT,
  BOARD_HEIGHT_TILE,
  BOARD_WIDTH,
  BOARD_WIDTH_TILE,
  BULLET_DAMAGE,
  BULLET_IMG_NAME,
  ENEMY_HP,
  ENEMY_IMG_NAME,
  ENEMY_SPAWN_RATE_MS,
  ORIENTATION_HORIZONTAL,
  ORIENTATION_VERTICAL,
  SPRITE_ATLAS_NAME,
  TANK_IMG_NAME,
  TILE_SIZE,
  TURRET_FIRE_RANGE,
  TURRET_FIRE_RATE_MS,
  VALID_TURRET_POSITION,
  ENEMY_SPEED,
  TURRET_SQUAD_SIZE,
  INVALID_TURRENT_POSITION,
  OCCUPIED_TURRET_POSITION,
} from './constants';

const isDebugMode = true; // window.location.href.indexOf('debug=true') != -1;

const MAP_GRID = Array.from({ length: BOARD_HEIGHT_TILE }).map(() =>
  Array.from({ length: BOARD_WIDTH_TILE }).fill(VALID_TURRET_POSITION)
);

const PATH_SEGMENTS = [
  {
    orientation: ORIENTATION_VERTICAL,
    start: { x: 2, y: 0 },
    size: 6,
  },
  {
    orientation: ORIENTATION_HORIZONTAL,
    start: { x: 2, y: 5 },
    size: 13,
  },
  {
    orientation: ORIENTATION_VERTICAL,
    start: { x: 14, y: 5 },
    size: 11,
  },
];

(function removePathTilesForTurret(map, segments) {
  segments.forEach((args) => {
    const { orientation, start, size } = args;

    const current = { ...start };

    for (let i = 0; i < size; i++) {
      map[current.y][current.x] = INVALID_TURRENT_POSITION;

      if (orientation === ORIENTATION_VERTICAL) {
        current.y += 1;
      } else if (orientation === ORIENTATION_HORIZONTAL) {
        current.x += 1;
      } else {
        throw new Error('Invalid Path Segment');
      }
    }
  });
})(MAP_GRID, PATH_SEGMENTS);

const entities = {
  player: {
    1: null,
  },
  bullets: null as Phaser.GameObjects.Group | null,
  enemyGroup: null as Phaser.GameObjects.Group | null,
  turretGroup: null as Phaser.GameObjects.Group | null,
};

const map = {
  path: null as Phaser.Curves.Path | null,
  graphics: null as Phaser.GameObjects.Graphics | null,
  turretValid: MAP_GRID,
};

function setupPlayerSprite(sprite: Phaser.GameObjects.Image) {
  sprite.on('pointerdown', () => {
    this._isDown = true;
    this._isSelected = !this._isSelected;
    this.setTint(0xff0000);
  });

  sprite.on('pointerout', () => {
    this._isDown && this.clearTint();
  });

  sprite.on('pointerup', () => {
    this._isDown = false;
    this._isSelected || this.clearTint();
  });
}

function drawGrid(graphics: Phaser.GameObjects.Graphics) {
  const lineWidth = 2;
  const halfWidth = Math.floor(lineWidth / 2);
  graphics.lineStyle(2, 0x0000ff, 0.5);

  for (let i = 0; i < Math.floor(BOARD_HEIGHT / TILE_SIZE); i++) {
    graphics.moveTo(0, i * TILE_SIZE - halfWidth);
    graphics.lineTo(BOARD_WIDTH, i * TILE_SIZE - halfWidth);
  }

  for (let j = 0; j < Math.floor(BOARD_WIDTH / TILE_SIZE); j++) {
    graphics.moveTo(j * TILE_SIZE - halfWidth, 0);
    graphics.lineTo(j * TILE_SIZE - halfWidth, BOARD_HEIGHT);
  }

  graphics.strokePath();
}

function drawEnemyPath(
  scene: Phaser.Scene,
  graphics: Phaser.GameObjects.Graphics
) {
  const HALF_TILE = TILE_SIZE / 2;
  const lineWidth = 2;
  const lineOffset = lineWidth / 2;

  const path = scene.add.path(
    3 * TILE_SIZE - HALF_TILE - lineOffset,
    -TILE_SIZE
  );
  path.lineTo(
    3 * TILE_SIZE - HALF_TILE - lineOffset,
    6 * TILE_SIZE - HALF_TILE - lineOffset
  );
  path.lineTo(
    15 * TILE_SIZE - HALF_TILE - lineOffset,
    6 * TILE_SIZE - HALF_TILE - lineOffset
  );
  path.lineTo(15 * TILE_SIZE - HALF_TILE - lineOffset, BOARD_HEIGHT);

  graphics.lineStyle(lineWidth, 0xffffff, 1);

  path.draw(graphics);

  return path;
}

function placeTurret(pointer) {
  const i = Math.floor(pointer.y / TILE_SIZE);
  const j = Math.floor(pointer.x / TILE_SIZE);

  if (map.turretValid[i][j] === VALID_TURRET_POSITION) {
    const turret = entities.turretGroup.get();

    if (turret) {
      turret.setActive(true);
      turret.setVisible(true);
      turret.place(i, j);
      // so it can receive pointer events
      turret.setInteractive();
    }
  }
}

class Scene extends Phaser.Scene {
  nextEnemy: number;
  playerHUD: Phaser.GameObjects.Text;

  constructor() {
    super('main');
  }

  preload() {
    this.load.path = 'public/';
    this.load.atlas(
      SPRITE_ATLAS_NAME,
      'assets/spritesheet.png',
      /*
        ".text" is used to bypass bun dev server turning .json into ESM
        See: https://github.com/oven-sh/bun/issues/1213
      */
      'assets/spritesheet.json.text'
    );
  }

  create() {
    // this.input.on("pointerdown", function (pointer) {
    //   if (entities.player[1]._isDown) {
    //   } else if (entities.player[1]._isSelected) {
    //     entities.player[1].x = Math.floor(pointer.x / TILE_SIZE) * TILE_SIZE;
    //     entities.player[1].y = Math.floor(pointer.y / TILE_SIZE) * TILE_SIZE;
    //     entities.player[1]._isSelected = false;
    //     entities.player[1].clearTint();
    //   } else {
    //     // only deselect if not clicked on
    //     entities.player[1].clearTint();
    //   }
    // });
    this.input.on('pointerdown', placeTurret);

    // entities.player[1] = this.add
    //   .image(0, 0, SPRITE_ATLAS_NAME, TANK_IMG_NAME)
    //   .setOrigin(0, 0)
    //   .setInteractive();

    // setupPlayerSprite(entities.player[1]);

    map.graphics = this.add.graphics();
    if (isDebugMode) {
      drawGrid(map.graphics);
    }

    map.path = drawEnemyPath(this, map.graphics);

    entities.turretGroup = this.add.group({
      classType: Turret,
      runChildUpdate: true,
      maxSize: TURRET_SQUAD_SIZE,
    });

    entities.enemyGroup = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
    });

    // value used to control spawn rate of enemies
    this.nextEnemy = 0;

    entities.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
    });

    this.physics.add.overlap(
      entities.enemyGroup,
      entities.bullets,
      damageEnemy
    );

    this.playerHUD = this.add
      .text(BOARD_WIDTH - 5, 5, `Tanks Available: n/a`, {
        align: 'right',
      })
      .setOrigin(1, 0);
  }

  update(time, delta) {
    this.playerHUD.setText(
      `Tanks Available: ${
        TURRET_SQUAD_SIZE - entities.turretGroup.getTotalUsed()
      }/${TURRET_SQUAD_SIZE}`
    );

    // if its time for the next enemy
    if (time > this.nextEnemy) {
      const enemy = entities.enemyGroup.get();

      if (enemy) {
        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.startOnPath();

        this.nextEnemy = time + ENEMY_SPAWN_RATE_MS;
      }
    }
  }
}

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

/*
  Type Definition in Phaser type files is incomplete, so Phaser.Class throws error.
  And user lands types are difficult because it's using classes...
  oh well, it works? Maybe we can PR on Phaser Github
*/

const Enemy = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,

  initialize: function Enemy(scene) {
    Phaser.GameObjects.Image.call(
      this,
      scene,
      0,
      0,
      SPRITE_ATLAS_NAME,
      ENEMY_IMG_NAME
    );

    this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
    this.hp = ENEMY_HP;
  },

  receiveDamage: function (damage) {
    this.hp -= damage;

    const shouldDeactivateEnemy = this.hp <= 0;

    if (shouldDeactivateEnemy) {
      this.setActive(false);
      this.setVisible(false);
    }
  },

  startOnPath: function () {
    // set the t parameter at the start of the path
    this.follower.t = 0;

    // get x and y of the given t point
    map.path.getPoint(this.follower.t, this.follower.vec);

    // set the x and y of our enemy to the received from the previous step
    this.setPosition(this.follower.vec.x, this.follower.vec.y);
  },

  update: function (time, delta) {
    // move the t point along the path, 0 is the start and 0 is the end
    this.follower.t += ENEMY_SPEED * delta;

    // get the new x and y coordinates in vec
    map.path.getPoint(this.follower.t, this.follower.vec);

    // update enemy x and y to the newly obtained x and y
    this.setPosition(this.follower.vec.x, this.follower.vec.y);
    // if we have reached the end of the path, remove the enemy
    if (this.follower.t >= 1) {
      this.setActive(false);
      this.setVisible(false);
    }
  },
});

const Turret = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,
  initialize: function Turret(scene) {
    Phaser.GameObjects.Image.call(
      this,
      scene,
      0,
      0,
      SPRITE_ATLAS_NAME,
      TANK_IMG_NAME
    );
    this.nextTick = 0;
    this.on('pointerdown', function (pointer) {
      this.destroy();
      map.turretValid[this.tilePositionRow][this.tilePositionCol] =
        VALID_TURRET_POSITION;
    });
  },

  place: function (i, j) {
    this.tilePositionRow = i;
    this.tilePositionCol = j;

    const GRID_PLACEMENT_Y = i * TILE_SIZE + TILE_SIZE / 2;
    const GRID_PLACEMENT_X = j * TILE_SIZE + TILE_SIZE / 2;

    this.y = GRID_PLACEMENT_Y;
    this.x = GRID_PLACEMENT_X;

    map.turretValid[this.tilePositionRow][this.tilePositionCol] =
      OCCUPIED_TURRET_POSITION;
  },

  fire: function () {
    const enemy = getEnemy(this.x, this.y, TURRET_FIRE_RANGE);

    if (enemy) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
      addBullet(this.x, this.y, angle);
      this.angle = (angle + Math.PI / 2) * Phaser.Math.RAD_TO_DEG;
    }
  },
  update: function (time) {
    const shouldShoot = time > this.nextTick;

    if (shouldShoot) {
      this.fire();
      this.nextTick = time + TURRET_FIRE_RATE_MS;
    }
  },
});

const Bullet = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,

  initialize: function Bullet(scene) {
    Phaser.GameObjects.Image.call(
      this,
      scene,
      0,
      0,
      SPRITE_ATLAS_NAME,
      BULLET_IMG_NAME
    );
    this.dx = 0;
    this.dy = 0;
    this.lifespan = 0;
    this.speed = Phaser.Math.GetSpeed(300, 1);
  },

  fire: function (x, y, angle) {
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    this.dx = Math.cos(angle);
    this.dy = Math.sin(angle);
    this.lifespan = 300;
  },

  update: function (time, delta) {
    this.lifespan -= delta;
    this.x += this.dx * (this.speed * delta);
    this.y += this.dy * (this.speed * delta);
    if (this.lifespan <= 0) {
      this.setActive(false);
      this.setVisible(false);
    }
  },
});

function addBullet(x, y, angle) {
  const bullet = entities.bullets.get();

  if (bullet) {
    bullet.fire(x, y, angle);
  }
}

function getEnemy(x, y, distance) {
  const enemyUnits = entities.enemyGroup.getChildren();

  for (let i = 0; i < enemyUnits.length; i++) {
    if (
      enemyUnits[i].active &&
      Phaser.Math.Distance.Between(x, y, enemyUnits[i].x, enemyUnits[i].y) <=
        distance
    )
      return enemyUnits[i];
  }

  return false;
}

function damageEnemy(enemy, bullet) {
  const ifEnemyAndBulletAlive = enemy.active === true && bullet.active === true;

  if (ifEnemyAndBulletAlive) {
    bullet.setActive(false);
    bullet.setVisible(false);

    enemy.receiveDamage(BULLET_DAMAGE);
  }
}
