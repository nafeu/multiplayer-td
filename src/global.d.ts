/*
  TODO: Fix issue where global types aren't detected in
        `bun run typecheck`
*/
declare const window: { location: { search: string } };

type TileCoordinates = {
  i: number;
  j: number;
};

// should be "NonNegativeInteger" but that doesn't exist
type MapPath = Array<{ x: number; y: number }>;
