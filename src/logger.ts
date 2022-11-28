const LOGGING_CONFIG = {
  _ENABLE_ALL: false,
  CONFIG_DEBUG: true,
  DEBUG_HUD__KEYBOARD_STATUS: false,
  DEBUG_HUD__UNIT_STATUS: false,
  DEBUG_HUD__HOME_BASE_HP: false,
  GAME_SCENE: false,
  GENERIC_DEBUG: false,
  UNIT_STATE_MACHINE: false,
  UNIT_ENTITY: false,
  PAUSE_MENU: false,
  POINTER_UI_DEBUG: false,
};

export type LOGGING_KEYS = keyof Omit<typeof LOGGING_CONFIG, '_ENABLE_ALL'>;

export const LOGGING_KEYS_ALL = Object.keys(LOGGING_CONFIG) as LOGGING_KEYS[];

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
        if (!target[prop as keyof typeof target]) {
          console.warn('!!! UNEXPECTED LOG TYPE', target, prop, receiver);
          return console[prop as keyof typeof console];
        }

        return target[prop as keyof typeof target];
      },
    }
  );
}
