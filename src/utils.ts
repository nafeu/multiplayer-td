import { TILE_SIZE } from './constants';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export const clone = (b) => JSON.parse(JSON.stringify(b));

export const isDebugMode = !(
  window.location.href.indexOf('preview=true') != -1
);

export const getPositionByTile = (coordinate: number) => {
  return coordinate * TILE_SIZE + TILE_SIZE / 2;
};

const ID_MAP = {};

export const generateId = (key: string) => {
  ID_MAP[key] = (ID_MAP[key] ?? 0) + 1;
  return `${key}:${ID_MAP[key]}`;
};

export const getTileByPosition = (x: number, y: number) => {
  const j = Math.floor(x / TILE_SIZE);
  const i = Math.floor(y / TILE_SIZE);

  return { i, j }
}

export const sendUiAlert = (alertInfo: object) => {
  // TODO: Remove this and utilize a proper UI alert class
  console.info(alertInfo);
}
