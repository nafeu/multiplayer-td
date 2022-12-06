import Phaser from 'phaser';

import { BOARD_BACKGROUND_COLOR, BOARD_HEIGHT, BOARD_WIDTH } from './constants';
import {
  setLoggingConfig,
  getLoggingConfig,
  LOGGING_KEYS_ALL,
  LOGGING_KEYS,
} from './logger';
import { getSearchParamKey, hasDebugFlag, updateSearchParamKey } from './utils';

import { Game } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { PauseMenu } from './scenes/PauseMenu';
import { StoreMenu } from './scenes/StoreMenu';
import { GameOver } from './scenes/GameOver';
import { ConfigDebugMenu } from './scenes/ConfigDebugMenu';

const config: Phaser.Types.Core.GameConfig = {
  backgroundColor: BOARD_BACKGROUND_COLOR,
  dom: { createContainer: true },
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'content',
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
  },
  physics: {
    arcade: {
      debug: hasDebugFlag('show-physics-box'),
    },
    default: 'arcade',
  },
  scene: [MainMenu, Game, ConfigDebugMenu, PauseMenu, StoreMenu, GameOver],
};

new Phaser.Game(config);

function loadDebugLoggerConfigurations() {
  const LOG_CONFIG_KEY = '__log_config';
  const LOGGING_CONFIG: Record<string, boolean> = {};
  let loggingConfigOverrides: Record<string, boolean> = {};

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

  synchronizeConfigs();

  document.querySelector(
    '#logging-controls'
  )!.innerHTML = `<table style="margin: auto">
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

  function synchronizeConfigs() {
    LOGGING_KEYS_ALL.forEach((currKey) => {
      setLoggingConfig(currKey, LOGGING_CONFIG[currKey]);
    });
  }

  document
    .querySelector('#logging-controls')!
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
        });

        synchronizeConfigs();
        updateSearchParamKey(LOG_CONFIG_KEY, JSON.stringify(LOGGING_CONFIG));
      }

      setLoggingConfig(target.id as LOGGING_KEYS, target.checked);
      LOGGING_CONFIG[target.id] = target.checked;

      updateSearchParamKey(LOG_CONFIG_KEY, JSON.stringify(LOGGING_CONFIG));
    });
}

loadDebugLoggerConfigurations();
