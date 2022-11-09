/* eslint-disable @typescript-eslint/no-unsafe-return */
const isLoggingDisabledByDefault = window.location.search.includes('logs=off');

const DEFAULT_LOG_CONFIG = {
  _ENABLE_ALL: false,
  DEBUG_HUD__KEYBOARD_STATUS: false,
  DEBUG_HUD__UNIT_STATUS: true,
  GENERIC_DEBUG: true,
  UNIT_STATE_MACHINE: true,
  UNIT_ENTITY: true,
  PAUSE_MENU: false,
  POINTER_UI_DEBUG: true
};

const DISABLED_LOG_CONFIG = {
  _ENABLE_ALL: false,
  DEBUG_HUD__KEYBOARD_STATUS: false,
  DEBUG_HUD__UNIT_STATUS: false,
  GENERIC_DEBUG: false,
  UNIT_STATE_MACHINE: false,
  UNIT_ENTITY: false,
  PAUSE_MENU: false,
  POINTER_UI_DEBUG: false
}

const LOGGING_CONFIG = isLoggingDisabledByDefault ?
  DISABLED_LOG_CONFIG : DEFAULT_LOG_CONFIG

export const LOGGING_KEYS_ALL = Object.keys(LOGGING_CONFIG);

export type LOGGING_KEYS = keyof Omit<typeof LOGGING_CONFIG, '_ENABLE_ALL'>;

export function getLoggingConfig(key: LOGGING_KEYS) {
  return LOGGING_CONFIG[key];
}

export function setLoggingConfig(key: LOGGING_KEYS, value: boolean) {
  LOGGING_CONFIG[key] = value;
}

export function getLogger(key: LOGGING_KEYS) {
  return new Proxy(
    {
      assert: (...args: any[]) => {
        if (LOGGING_CONFIG._ENABLE_ALL || LOGGING_CONFIG[key]) {
          console.assert(...args);
        }
      },
      log: (...args: any[]) => {
        if (LOGGING_CONFIG._ENABLE_ALL || LOGGING_CONFIG[key]) {
          console.log(...args);
        }
      },
      warn: (...args: any[]) => {
        if (LOGGING_CONFIG._ENABLE_ALL || LOGGING_CONFIG[key]) {
          console.warn(...args);
        }
      },
      error: (...args: any[]) => {
        if (LOGGING_CONFIG._ENABLE_ALL || LOGGING_CONFIG[key]) {
          console.error(...args);
        }
      },
      info: (...args: any[]) => {
        if (LOGGING_CONFIG._ENABLE_ALL || LOGGING_CONFIG[key]) {
          console.info(...args);
        }
      },
    },
    {
      get(target, prop, receiver) {
        if (!target[prop]) {
          console.warn('!!! UNEXPECTED LOG TYPE', target, prop, receiver);
          return console[prop];
        }

        return target[prop];
      },
    }
  );
}
