import Phaser from 'phaser';

import { BOARD_BACKGROUND_COLOR, BOARD_HEIGHT, BOARD_WIDTH } from './constants';

import { Game } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { PauseMenu } from './scenes/PauseMenu';
import { GameOver } from './scenes/GameOver';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'content',
  width: BOARD_WIDTH,
  height: BOARD_HEIGHT,
  backgroundColor: BOARD_BACKGROUND_COLOR,
  physics: {
    default: 'arcade',
  },
  scene: [MainMenu, Game, PauseMenu, GameOver],
};

new Phaser.Game(config);

import {
  setLoggingConfig,
  getLoggingConfig,
  LOGGING_KEYS_ALL,
  LOGGING_KEYS,
} from './logger';
import { getSearchParamKey, updateSearchParamKey } from './utils';

(function loadDebugLoggerConfigurations() {
  const LOG_CONFIG_KEY = '__log_config';
  const LOGGING_CONFIG: Record<string, boolean> = {};
  let loggingConfigOverrides = {};

  const searchParams = getSearchParamKey(LOG_CONFIG_KEY) ?? '{}';
  try {
    loggingConfigOverrides = JSON.parse(searchParams) as Record<
      string,
      boolean
    >;
  } catch (e) {
    console.error('Logging Config Parsing failed?', {
      e,
      LOG_CONFIG_KEY,
      searchParams,
    });
  }

  LOGGING_KEYS_ALL.forEach(
    (key) =>
      (LOGGING_CONFIG[key] =
        loggingConfigOverrides[key] ?? getLoggingConfig(key as LOGGING_KEYS))
  );

  let isAllEnabled = true;
  LOGGING_KEYS_ALL.forEach(
    (key) => (isAllEnabled = isAllEnabled && LOGGING_CONFIG[key])
  );

  document.querySelector('#logging-controls').innerHTML = `<table>
        <tr>
          <th>Logging Key</th>
          <th><input id="enable-all" type="checkbox" title="enable/disable all" ${
            isAllEnabled ? 'checked' : ''
          }/>
        </tr>
        ${Object.keys(LOGGING_CONFIG)
          .map((value) => {
            return `

        <tr>
          <td>${value}</td>
          <td>
            <input id="${value}" class="config-checkbox" type="checkbox" ${
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
      if (target.type !== 'checkbox') return;

      if (target.id === 'enable-all') {
        [].forEach.call(
          document.querySelectorAll('.config-checkbox'),
          (el: HTMLInputElement) => {
            el.checked = target.checked;
          }
        );

        LOGGING_KEYS_ALL.forEach((key) => {
          LOGGING_CONFIG[key] = target.checked;
          setLoggingConfig(key as LOGGING_KEYS, target.checked);
        });

        updateSearchParamKey(LOG_CONFIG_KEY, JSON.stringify(LOGGING_CONFIG));
      }

      setLoggingConfig(target.id as LOGGING_KEYS, target.checked);
      LOGGING_CONFIG[target.id] = target.checked;

      updateSearchParamKey(LOG_CONFIG_KEY, JSON.stringify(LOGGING_CONFIG));
    });
})();
