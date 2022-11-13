import { Scene } from 'phaser';
import { TILE_SIZE } from './constants';

// canvas splicing trick stolen from here:
// https://codesandbox.io/s/3tuus?file=/src/Play.js
export function sliceFromTexture(
  scene: Scene,
  newTextureName: string,
  sourceTextureName: string,
  sourceTextureX: number,
  sourceTextureY: number
) {
  const grass = scene.textures.get(sourceTextureName);
  const source = grass.getSourceImage();

  const newT = scene.textures.createCanvas(newTextureName, 32, 32);

  const newCtx = (newT.getSourceImage() as HTMLCanvasElement).getContext('2d');

  if (!newCtx) {
    console.error('### COULD NOT SLICE NEW TEXTURE', newCtx);
    return;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
  newCtx.drawImage(
    source as HTMLImageElement,
    sourceTextureX,
    sourceTextureY,
    TILE_SIZE,
    TILE_SIZE,
    0,
    0,
    TILE_SIZE,
    TILE_SIZE
  );

  newT.refresh();
}
