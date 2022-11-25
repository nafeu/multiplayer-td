import * as constants from './constants';

type ValidConfigs = typeof constants;
export type ValidConfigKeys = keyof ValidConfigs;

const overrides: Partial<ValidConfigs> = {};

export function fetchConfig(config: ValidConfigKeys) {
  return Object.hasOwn(overrides, config)
    ? overrides[config]
    : constants[config];
}

const ConfigProxy = new Proxy(constants, {
  get(target, handler, receiver) {
    return Object.hasOwn(overrides, handler as ValidConfigKeys)
      ? overrides[handler as ValidConfigKeys]
      : constants[handler as ValidConfigKeys];
  },
  set(target, handler, newValue) {
    overrides[handler as ValidConfigKeys] = newValue;
    return true;
  },
});

export const Config = ConfigProxy;
