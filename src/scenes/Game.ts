import Phaser from 'phaser';
import EasyStar from 'easystarjs';

import Unit from '../entities/Unit';
import Enemy from '../entities/Enemy';
import Bullet from '../entities/Bullet';
import Pointer from '../entities/Pointer';

import map from '../map';
import entities from '../entities';

import {
  isDebugMode,
  sendUiAlert,
  getValidUnitFormation,
  rotateFormationShape,
  isTileFreeAtPosition,
} from '../utils';

import {
  SPRITE_ATLAS_NAME,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TILE_SIZE,
  UNIT_SQUAD_SIZE,
  ENEMY_SPAWN_RATE_MS,
  ENEMY_PATH_COLOR,
  VALID_UNIT_POSITION,
  OCCUPIED_UNIT_POSITION,
  BULLET_DAMAGE,
  SELECTION_RECTANGLE_COLOR,
  SELECTION_RECTANGLE_OPACITY,
  GRID_LINE_COLOR,
} from '../constants';

export class Game extends Phaser.Scene {
  finder: EasyStar.js;
  nextEnemy: number;
  playerHUD: Phaser.GameObjects.Text;
  pointer: Phaser.GameObjects.GameObject;
  selection: Phaser.GameObjects.Rectangle;

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
    this.finder = new EasyStar.js();

    configurePathFindingGrid(this.finder);

    disableBrowserRightClickMenu(this);

    this.selection = addSelectionRectangle(this);

    this.input.on(
      Phaser.Input.Events.POINTER_DOWN as string,
      this.handlePointerDown,
      this
    );
    this.input.on(
      Phaser.Input.Events.POINTER_MOVE as string,
      this.handlePointerMove,
      this
    );
    this.input.on(
      Phaser.Input.Events.POINTER_UP as string,
      this.handlePointerUp,
      this
    );
    this.input.keyboard.on(
      Phaser.Input.Keyboard.Events.ANY_KEY_DOWN as string,
      this.handleKeyDown,
      this
    );

    entities.pointer = new Pointer(this, this.add.graphics());

    map.graphics = this.add.graphics();

    if (isDebugMode) {
      drawGrid(map.graphics);
    }

    map.path = drawEnemyPath(this, map.graphics);

    entities.unitGroup = this.add.group({
      classType: Unit,
      runChildUpdate: true,
      maxSize: UNIT_SQUAD_SIZE,
      // use createCallback to pass the scene for post initialization stuff
      createCallback: function (unit: Unit) {
        console.log('### Unit Created', unit.id, unit);

        // unit.postInitialize(map, getEnemy, () => entities.bullets.get());
      },
    });

    entities.enemyGroup = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
      // removeCallback doesn't get triggered for recycled objects - don't rely on this for resets
      // removeCallback: function (enemy: typeof Enemy) {
      //   console.log('### Enemy Removed', enemy.id);
      // },
    });

    // value used to control spawn rate of enemies
    this.nextEnemy = 0;

    entities.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
    });

    // this is a type helper
    // because the underlying type is a generic Physics.Arcade.GameObjectWithBody
    // and doesn't technically guarantee ordering of the objects being compared
    // so this wrapper is taking responsibility of this assumption
    function wrappedDamageEnemy(enemy, bullet) {
      return damageEnemy(enemy as Enemy, bullet as Bullet);
    }

    this.physics.add.overlap(
      entities.enemyGroup,
      entities.bullets,
      wrappedDamageEnemy
    );

    this.playerHUD = this.add
      .text(BOARD_WIDTH - 5, 5, `Tanks Available: n/a`, {
        align: 'right',
      })
      .setOrigin(1, 0);

    // Setup Default Units
    placeUnit(70, 250);
    placeUnit(100, 250);
  }

  KEYS_TO_WATCH = ['SHIFT', 'CTRL'];

  update(time: number) {
    this.playerHUD.setText([
      `Units Available: ${
        UNIT_SQUAD_SIZE - entities.unitGroup.getTotalUsed()
      }/${UNIT_SQUAD_SIZE}`,
      `Units Selected: ${entities.selectedUnitGroup.size()}`,
      `Formation: ${entities.interaction.formationShape}`,
      // '',
      // 'Keyboard Keys:',
      // '---------------',
      // ...this.KEYS_TO_WATCH.map(
      //   (k) =>
      //     `${k}: ${this.input.keyboard
      //       .checkDown(this.input.keyboard.addKey(k))
      //       .toString()}`
      // ),
      '',
      'Units:',
      '--------',
      ...entities.unitGroup.getChildren().map((u: Unit) => u.toString()),
    ]);

    const shouldSpawnEnemy = time > this.nextEnemy;

    if (shouldSpawnEnemy) {
      const enemy = entities.enemyGroup.get() as Enemy | null;

      if (enemy) {
        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.startOnPath();

        this.nextEnemy = time + ENEMY_SPAWN_RATE_MS;
      }
    }

    entities.pointer.update();
  }

  handlePointerDown = (pointer: Phaser.Input.Pointer) => {
    const isHoldingCtrlKey = (pointer.event as Phaser.Input.Keyboard.Key)
      .ctrlKey;
    if (isHoldingCtrlKey) {
      placeUnit(pointer.x, pointer.y);
      return;
    }

    if (pointer.rightButtonDown()) {
      const validUnitFormation = getValidUnitFormation(
        pointer.x,
        pointer.y,
        entities.selectedUnitGroup.getUnits()
      );

      const selectedUnitCount = entities.selectedUnitGroup.size();
      const hasSpaceForUnits = validUnitFormation.length >= selectedUnitCount;

      if (hasSpaceForUnits && isTileFreeAtPosition(pointer.x, pointer.y)) {
        this.finder.setGrid(map.unitValid);

        entities.selectedUnitGroup
          .getUnits()
          .forEach((selectedUnit: Unit, index) => {
            const originY = Math.floor(selectedUnit.y / TILE_SIZE);
            const originX = Math.floor(selectedUnit.x / TILE_SIZE);

            const validMove = validUnitFormation[index];

            this.finder.findPath(
              originX,
              originY,
              validMove.j,
              validMove.i,
              (path) => {
                if (path) {
                  console.log('### Path Found: ', path);
                  selectedUnit.queueMove(path);
                } else {
                  sendUiAlert({ invalidCommand: `Path not found.` });
                }
              }
            );

            this.finder.calculate();
          });
      }
    } else {
      this.selection.x = pointer.x;
      this.selection.y = pointer.y;
    }
  };

  handlePointerMove = (pointer: Phaser.Input.Pointer) => {
    if (!pointer.isDown) return;
    if (pointer.rightButtonDown()) return;

    const dx = pointer.x - pointer.prevPosition.x;
    const dy = pointer.y - pointer.prevPosition.y;

    this.selection.width += dx;
    this.selection.height += dy;
  };

  handlePointerUp = (pointer: Phaser.Input.Pointer) => {
    const allUnits = entities.unitGroup.getChildren() as Array<Unit>;
    const isBoxSelection =
      this.selection.width !== 0 || this.selection.height !== 0;

    if (isBoxSelection) {
      const selectionRect = new Phaser.Geom.Rectangle(
        this.selection.x,
        this.selection.y,
        this.selection.width,
        this.selection.height
      );

      const isNegativeWidthSelection = selectionRect.width < 0;

      if (isNegativeWidthSelection) {
        selectionRect.x += selectionRect.width;
        selectionRect.width *= -1;
      }

      const isNegativeHeightSelection = selectionRect.height < 0;

      if (isNegativeHeightSelection) {
        selectionRect.y += selectionRect.height;
        selectionRect.height *= -1;
      }

      const selected = allUnits.filter((unit) => {
        const rect = unit.getBounds();

        return Phaser.Geom.Rectangle.Overlaps(selectionRect, rect);
      });

      const shiftKeyIsNotPressed = !(pointer.event as Phaser.Input.Keyboard.Key)
        .shiftKey;
      if (shiftKeyIsNotPressed) {
        entities.selectedUnitGroup.clearUnits();
      }

      selected.forEach(entities.selectedUnitGroup.addUnit);

      this.selection.width = 0;
      this.selection.height = 0;
    } else {
      const hasNotClickedAnyUnits = !allUnits.find((unit) =>
        unit.getBounds().contains(pointer.x, pointer.y)
      );

      const hasClickedOnEmptySpace =
        hasNotClickedAnyUnits && !pointer.rightButtonReleased();

      if (hasClickedOnEmptySpace) {
        entities.selectedUnitGroup.clearUnits();
      }
    }
  };

  handleKeyDown = (event: { key: string }) => {
    if (event.key === 'a') {
      rotateFormationShape();
    }
  };
}

function drawGrid(graphics: Phaser.GameObjects.Graphics) {
  const lineWidth = 2;
  const halfWidth = Math.floor(lineWidth / 2);
  graphics.lineStyle(2, GRID_LINE_COLOR, 0.5);

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

  graphics.lineStyle(lineWidth, ENEMY_PATH_COLOR, 1);

  path.draw(graphics);

  return path;
}

function placeUnit(x: number, y: number) {
  const row = Math.floor(y / TILE_SIZE);
  const column = Math.floor(x / TILE_SIZE);

  if (map.unitValid[row][column] === VALID_UNIT_POSITION) {
    const unit = entities.unitGroup.get() as Unit;

    if (unit) {
      unit.setActive(true);
      unit.setVisible(true);
      unit.place(row, column);
      unit.setInteractive();
    }
  }
}

function damageEnemy(enemy: Enemy, bullet: Bullet) {
  const ifEnemyAndBulletAlive = enemy.active && bullet.active;

  if (ifEnemyAndBulletAlive) {
    bullet.setActive(false);
    bullet.setVisible(false);

    enemy.receiveDamage(BULLET_DAMAGE);
  }
}

function disableBrowserRightClickMenu(scene: Phaser.Scene) {
  scene.input.mouse.disableContextMenu();
}

function configurePathFindingGrid(finder: EasyStar.js) {
  finder.setGrid(map.unitValid);
  finder.setAcceptableTiles([VALID_UNIT_POSITION, OCCUPIED_UNIT_POSITION]);
}

function addSelectionRectangle(scene: Phaser.Scene) {
  return scene.add.rectangle(
    0,
    0,
    0,
    0,
    SELECTION_RECTANGLE_COLOR,
    SELECTION_RECTANGLE_OPACITY
  );
}

export default Game;
