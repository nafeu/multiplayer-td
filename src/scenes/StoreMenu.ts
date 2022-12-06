import { BOARD_HEIGHT, BOARD_WIDTH } from '../constants';
import { title as GameScene } from './Game';

export const title = 'store-menu';

/* eslint-disable */
export class StoreMenu extends Phaser.Scene {
  isAssigningUpgrade: boolean;
  isReconfiguringTanks: boolean;
  queuedActionContainer: any;

  constructor() {
    super(title);
    this.isAssigningUpgrade = false;
    this.isReconfiguringTanks = false;
    this.queuedActionContainer = null;
  }

  createBackground = () => {
    this.add.rectangle(
      0,               0,
      BOARD_WIDTH * 2, BOARD_HEIGHT * 2,
      0,               0.5
    );
  }

  createSquadCells = squadEntities => {
    const squadCells = [];

    const squadCellsMarginX   = 100;
    const squadCellsMarginTop = (BOARD_HEIGHT / 4) - 20;
    const squadCellsWidth     = BOARD_WIDTH - (squadCellsMarginX * 2)

    const squadCellWidth  = (squadCellsWidth / 4)
    const squadCellHeight = 100
    const squadCellGap    = 30

    for (let i = 0; i < squadEntities.length; i++) {
      const squadEntity = squadEntities[i] || { name: 'Empty', desc: 'No unit in this slot' } ;

      const containerWidth = squadCellWidth - squadCellGap;
      const containerHeight = squadCellHeight;

      const xPos = squadCellsMarginX + (squadCellWidth * i) + (squadCellGap / 2) + (containerWidth / 2);
      const yPos = squadCellsMarginTop + (containerHeight / 2);

      const container = this.add.container(xPos, yPos);
      container.setData('entity', squadEntity);

      const cell = this.add.rectangle(
        0,
        0,
        containerWidth,
        containerHeight,
        0x34495e,
        1.0
      );

      cell.setInteractive();
      cell.setName('cell');

      const text = this.add.text(
        0,
        0,
        squadEntity.name
      )

      text.setOrigin(0.5);
      text.setName('text');

      container.add([
        cell,
        text
      ]);

      squadCells.push(container);
    }

    return squadCells;
  }

  createItemCells = itemEntities => {
    const itemCells = [];

    const itemCellsMarginX   = 50;
    const itemCellsMarginTop = ((BOARD_HEIGHT / 4) * 2) - 20;
    const itemCellsWidth     = BOARD_WIDTH - (itemCellsMarginX * 2)

    const itemCellWidth  = (itemCellsWidth / 6)
    const itemCellHeight = 75
    const itemCellGap    = 10

    for (let i = 0; i < itemEntities.length; i++) {
      const itemEntity = itemEntities[i];

      const containerWidth = itemCellWidth - itemCellGap;
      const containerHeight = itemCellHeight;

      const xPos = itemCellsMarginX + (itemCellWidth * i) + (itemCellGap / 2) + (containerWidth / 2);
      const yPos = itemCellsMarginTop + (containerHeight / 2);

      const container = this.add.container(xPos, yPos);
      container.setData('entity', itemEntity);

      const cell = this.add.rectangle(
        0,
        0,
        containerWidth,
        containerHeight,
        0x34495e,
        1.0
      );

      cell.setInteractive();
      cell.setName('cell');

      const text = this.add.text(
        0,
        0,
        itemEntity.name
      )

      text.setOrigin(0.5);
      text.setName('text');

      container.add([
        cell,
        text
      ]);

      itemCells.push(container);
    }

    return itemCells;
  }

  createInfoBox = () => {
    const infoBoxMarginX   = 75;
    const infoBoxMarginTop = ((BOARD_HEIGHT / 4) * 2.75) - 20;
    const infoBoxWidth     = (BOARD_WIDTH - (infoBoxMarginX * 2)) / 2
    const infoBoxHeight    = BOARD_HEIGHT / 5;
    const infoBoxGap       = 20;

    const containerWidth = infoBoxWidth - infoBoxGap;
    const containerHeight = infoBoxHeight - infoBoxGap;

    const xPos = infoBoxMarginX + (infoBoxGap / 2) + (containerWidth / 2);
    const yPos = infoBoxMarginTop + (containerHeight / 2);

    const container = this.add.container(xPos, yPos);

    const box = this.add.rectangle(
      0,
      0,
      containerWidth,
      containerHeight,
      0x34495e,
      1.0
    );

    box.setOrigin(0.5);

    const text = this.add.text(
      0,
      -(containerHeight / 4),
      '',
      { fontSize: 12, wordWrap: { width: containerWidth } }
    )

    text.setOrigin(0.5);
    text.setName('infoBoxText');

    container.add([
      box,
      text
    ]);

    return container;
  }

  createMutatorsBox = () => {
    const mutatorsBoxMarginX   = 75;
    const mutatorsBoxMarginTop = ((BOARD_HEIGHT / 4) * 2.75) - 20;
    const mutatorsBoxWidth     = (BOARD_WIDTH - (mutatorsBoxMarginX * 2)) / 2
    const mutatorsBoxHeight    = BOARD_HEIGHT / 5;
    const mutatorsBoxGap       = 20;

    const containerWidth = mutatorsBoxWidth - mutatorsBoxGap;
    const containerHeight = mutatorsBoxHeight - mutatorsBoxGap;

    const xPos = BOARD_WIDTH - mutatorsBoxMarginX - (mutatorsBoxWidth / 2);
    const yPos = mutatorsBoxMarginTop + (containerHeight / 2);

    const container = this.add.container(xPos, yPos);

    const box = this.add.rectangle(
      0,
      0,
      containerWidth,
      containerHeight,
      0x34495e,
      1.0
    );

    box.setOrigin(0.5);

    const text = this.add.text(
      0,
      -(containerHeight / 4),
      '',
      { fontSize: 12, wordWrap: { width: containerWidth } }
    )

    text.setOrigin(0.5);
    text.setName('mutatorsBoxText');

    container.add([
      box,
      text
    ]);

    return container;
  }

  createMoneyIndicator = () => {
    const moneyIndicatorMarginX   = 75;
    const moneyIndicatorMarginTop = (BOARD_HEIGHT / 8);
    const moneyIndicatorWidth     = BOARD_WIDTH / 10
    const moneyIndicatorHeight    = BOARD_HEIGHT / 10;

    const containerWidth = moneyIndicatorWidth;
    const containerHeight = moneyIndicatorHeight;

    const xPos = moneyIndicatorMarginX;
    const yPos = moneyIndicatorMarginTop;

    const container = this.add.container(xPos, yPos);

    const box = this.add.rectangle(
      0,
      0,
      containerWidth,
      containerHeight,
      0x34495e,
      1.0
    );

    box.setOrigin(0.5);

    const text = this.add.text(
      0,
      0,
      '$5k'
    )

    text.setOrigin(0.5);
    text.setName('moneyIndicatorText');

    container.add([
      box,
      text
    ]);

    return container;
  }

  createRerollButton = () => {
    const rerollButtonMarginX   = 75;
    const rerollButtonMarginTop = (BOARD_HEIGHT / 8);
    const rerollButtonWidth     = BOARD_WIDTH / 10
    const rerollButtonHeight    = BOARD_HEIGHT / 10;

    const containerWidth = rerollButtonWidth;
    const containerHeight = rerollButtonHeight;

    const xPos = BOARD_WIDTH - rerollButtonMarginX;
    const yPos = rerollButtonMarginTop;

    const container = this.add.container(xPos, yPos);

    const box = this.add.rectangle(
      0,
      0,
      containerWidth,
      containerHeight,
      0x34495e,
      1.0
    );

    box.setOrigin(0.5);
    box.setInteractive();
    box.setName('box');

    const text = this.add.text(
      0,
      0,
      'Re-roll',
      { fontSize: 12 }
    )

    text.setOrigin(0.5);
    text.setName('moneyIndicatorText');

    container.add([
      box,
      text
    ]);

    return container;
  }

  createDoneButton = () => {
    const doneText = this.add
      .text(BOARD_WIDTH - 50, BOARD_HEIGHT - 50, 'DONE', {
        fontSize: '20px',
      })
      .setOrigin(0.5, 0.5);

    doneText.setInteractive();
    doneText.on('pointerup', this.handleResumeGame);
  }

  assignSquadCellInteractivity = (itemCellContainers, squadCellContainers, infoBox) => {
    squadCellContainers.forEach(cellContainer => {
      const cell = cellContainer.getByName('cell');
      const entity = cellContainer.getData('entity');

      cell.on("pointerover", () => {
        if (isNotSelected(cell)) {
          if (this.isAssigningUpgrade) {
            highlightCellAssignmentOption(cell);
          } else if (this.isReconfiguringTanks) {
            highlightTankReconfigurationOption(cell);
          } else {
            highlightCell(cell);
            updateInfoBox(infoBox, entity.desc);
          }
        }
      });

      cell.on("pointerout", () => {
        if (isNotModifying(this)) {
          clearInfoBox(infoBox);
        }

        clearCellHighlight(cell);
      });

      cell.on("pointerup", () => {
        if (this.isAssigningUpgrade) {
          confirmUpgrade(this, itemCellContainers, squadCellContainers);
        }
      })
    })
  }

  assignItemCellInteractivity = (itemCellContainers, squadCellContainers, infoBox) => {
    itemCellContainers.forEach(itemCellContainer => {
      const cell = itemCellContainer.getByName('cell');
      const text = itemCellContainer.getByName('text');
      const entity = itemCellContainer.getData('entity');

      cell.on("pointerover", () => {
        if (cell.getData('purchased')) return;

        if (isNotSelected(cell)) {
          highlightCell(cell);
        }

        if (isNotModifying(this)) {
          updateInfoBox(infoBox, entity.desc)
        }
      });

      cell.on("pointerout", () => {
        if (isNotSelected(cell)) {
          clearCellHighlight(cell);
        }

        if (isNotModifying(this)) {
          clearInfoBox(infoBox);
        }
      });

      cell.on("pointerup", () => {
        if (cell.getData('purchased')) return;

        if (isSelected(cell)) {
          dequeueItemSelection(this, itemCellContainer, itemCellContainers, infoBox);
        } else {
          resetAllCellSelections(itemCellContainers);
          selectCell(cell);

          if (entity.type === 'upgrade') {
            queueItemSelection(this, itemCellContainer, infoBox);
          } else {
            confirmItemSelection(this, itemCellContainer, itemCellContainers, squadCellContainers);
          }
        }
      });
    })
  }

  assignRerollInteractivity = (boxContainer, infoBox) => {
    const box = boxContainer.getByName('box');

    box.on("pointerover", () => {
      if (!this.isAssigningUpgrade) {
        updateInfoBox(infoBox, 'Re-roll store for $1k');
        highlightCell(box);
      }
    });

    box.on("pointerout", () => {
      if (!this.isAssigningUpgrade) {
        clearInfoBox(infoBox);
      }

      clearCellHighlight(box);
    });
  }

  create() {
    this.createBackground();

    const squadEntities = [
      {
        name: 'Tanky',
        desc: 'This is the tank'
      },
      null,
      null,
      null
    ]

    const itemEntities = [
      {
        name: 'ItemA',
        desc: 'ItemA description',
        type: 'upgrade'
      },
      {
        name: 'ItemB',
        desc: 'ItemB description',
        type: 'upgrade'
      },
      {
        name: 'ItemC',
        desc: 'ItemC description',
        type: 'upgrade'
      },
      {
        name: 'ItemD',
        desc: 'ItemD description',
        type: 'upgrade'
      },
      {
        name: 'ItemE',
        desc: 'ItemE description',
        type: 'mutator'
      },
      {
        name: 'ItemF',
        desc: 'ItemF description',
        type: 'tank'
      }
    ]

    const infoBox = this.createInfoBox();
    const mutatorsBox = this.createMutatorsBox();
    const moneyIndicator = this.createMoneyIndicator();
    const rerollButton = this.createRerollButton();
    const squadCells = this.createSquadCells(squadEntities);
    const itemCells = this.createItemCells(itemEntities);

    this.assignSquadCellInteractivity(itemCells, squadCells, infoBox);
    this.assignItemCellInteractivity(itemCells, squadCells, infoBox);
    this.assignRerollInteractivity(rerollButton, infoBox);

    this.createDoneButton();
  }

  handleResumeGame = () => {
    this.scene.stop();
    this.scene.resume(GameScene);
  };
}

const resetAllCellSelections = cellContainers => {
  cellContainers.forEach(cellContainer => {
    cellContainer.getByName('cell')
      .setData('selected', false)
      .setStrokeStyle(0);
  })
}

const updateSquadCells = (squadCellContainers, squadEntities) => {

}

const updateItemCells = (itemCellContainers, itemEntities) => {

}

const selectCell = cell => {
  cell.setStrokeStyle(4, 0x27ae60);
  cell.setData('selected', true);
}

const highlightCell = cell => {
  cell.setStrokeStyle(4, 0xecf0f1);
}

const highlightCellAssignmentOption = cell => {
  cell.setStrokeStyle(4, 0xf39c12);
}

const highlightTankReconfigurationOption = cell => {
  cell.setStrokeStyle(4, 0x8e44ad);
}

const updateInfoBox = (infoBox, text) => {
  infoBox.getByName('infoBoxText').setText(text);
}

const clearInfoBox = infoBox => {
  infoBox.getByName('infoBoxText').setText('')
}

const clearCellHighlight = cell => {
  cell.setStrokeStyle(0);
}

const dequeueItemSelection = (scene, itemCellContainer, itemCellContainers, infoBox) => {
  const cell = itemCellContainer.getByName('cell');
  const entity = itemCellContainer.getData('entity');

  scene.isAssigningUpgrade = false;
  scene.queuedActionContainer = null;
  resetAllCellSelections(itemCellContainers);
  highlightCell(cell);
  updateInfoBox(infoBox, entity.desc);
}

const queueItemSelection = (scene, itemCellContainer, infoBox) => {
  const entity = itemCellContainer.getData('entity');

  scene.isAssigningUpgrade = true;
  scene.isReconfiguringTanks = false;
  scene.queuedActionContainer = itemCellContainer;

  updateInfoBox(infoBox, `Select tank to upgrade with ${entity.desc}`)
}

const confirmItemSelection = (scene, cellContainer, itemCellContainers, squadCellContainers) => {
  const cell = cellContainer.getByName('cell');
  const text = cellContainer.getByName('text');

  scene.isAssigningUpgrade = false;
  scene.queuedActionContainer = null;

  cell.setData('purchased', true);
  text.setText('[SOLD]');

  resetAllCellSelections(itemCellContainers);
  resetAllCellSelections(squadCellContainers);
}

const confirmUpgrade = (scene, itemCellContainers, squadCellContainers) => {
  scene.isAssigningUpgrade = false;

  const cell = scene.queuedActionContainer.getByName('cell');
  const text = scene.queuedActionContainer.getByName('text');

  cell.setData('purchased', true);
  text.setText('[SOLD]');

  resetAllCellSelections(itemCellContainers);
  resetAllCellSelections(squadCellContainers);
}

const isSelected = cell => cell.getData('selected');
const isNotSelected = cell => !isSelected(cell);

const isNotModifying = scene => !scene.isAssigningUpgrade && !scene.isReconfiguringTanks;

/* eslint-enable */
