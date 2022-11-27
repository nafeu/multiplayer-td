import * as constants from './constants';

type ValidConfigs = typeof constants;
export type ValidConfigKeys = keyof ValidConfigs;

const overrides: Partial<ValidConfigs> = {};

type MutableConfigs = {
  -readonly [P in keyof ValidConfigs]: ValidConfigs[P];
};

export function fetchConfig(config: ValidConfigKeys) {
  return Object.hasOwn(overrides, config)
    ? overrides[config]
    : constants[config];
}

export function writeConfig(key: ValidConfigKeys, newValue: any) {
  (overrides as MutableConfigs)[key] = newValue;
  return true;
}

const ConfigProxy = new Proxy(constants, {
  get(target, handler, receiver) {
    return Object.hasOwn(overrides, handler as ValidConfigKeys)
      ? overrides[handler as ValidConfigKeys]
      : constants[handler as ValidConfigKeys];
  },
});

export const Config = ConfigProxy;
