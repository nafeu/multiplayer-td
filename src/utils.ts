import { TILE_SIZE } from './constants';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export const clone = (b) => JSON.parse(JSON.stringify(b));

export const isDebugMode = !(window.location.href.indexOf('preview=true') != -1);

export const getPositionByTile = (coordinate: number) => {
  return coordinate * TILE_SIZE + TILE_SIZE / 2
}
