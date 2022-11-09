import Phaser from 'phaser';

import { BOARD_BACKGROUND_COLOR, BOARD_HEIGHT, BOARD_WIDTH } from './constants';

import { Game } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { PauseMenu } from './scenes/PauseMenu';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'content',
  width: BOARD_WIDTH,
  height: BOARD_HEIGHT,
  backgroundColor: BOARD_BACKGROUND_COLOR,
  physics: {
    default: 'arcade',
  },
  scene: [MainMenu, Game, PauseMenu],
};

const game = new Phaser.Game(config);

import {
  setLoggingConfig,
  getLoggingConfig,
  LOGGING_KEYS_ALL,
  LOGGING_KEYS,
} from './logger';

(function loadDebugLoggerConfigurations() {
  const LOGGING_CONFIG = {};
  LOGGING_KEYS_ALL.forEach(
    (key) => (LOGGING_CONFIG[key] = getLoggingConfig(key as LOGGING_KEYS))
  );

  document.querySelector('#logging-controls').innerHTML = `<table>
        <tr>
          <th>Logging Key</th>
          <th>Enabled?</th>
        </tr>
        ${Object.keys(LOGGING_CONFIG)
          .map((value) => {
            return `

        <tr>
          <td>${value}</td>
          <td>
            <input id="${value}" type="checkbox" ${
              LOGGING_CONFIG[value] ? 'checked' : ''
            } />
          </td>
        </tr>
          `;
          })
          .join('')}</table>`;

  document
    .querySelector('#logging-controls')
    .addEventListener('click', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.type === 'checkbox') {
        setLoggingConfig(target.id as LOGGING_KEYS, target.checked);
      }
    });
})();
