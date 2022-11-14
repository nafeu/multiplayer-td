/*
  TODO: Fix issue where global types aren't detected in
        `bun run typecheck`
*/
declare const window: { location: { search: string } };

type TileCoordinates = {
  row: number;
  col: number;
};

type TileProperties = {
  collision: boolean,
  enemyPath: boolean,
  crossing: boolean
}

// should be "NonNegativeInteger" but that doesn't exist
type MapPath = Array<{ x: number; y: number }>;
