# Multiplayer TD

An experimental rougelike multiplayer tower defense game built with Phaser.io

View most latest builds (off `main`) here: https://nafeu.com/multiplayer-td/

## Install

*Use `bun` for local development.*

First get [bun](https://bun.sh/) by running:

```bash
curl https://bun.sh/install | bash
```

installing existing dependencies (uses lockfile by default)
```bash
bun install
```

for adding dependencies
```bash
bun add new-dependency@version
```

## Development

Run dev server (served on [localhost:300X](http://localhost:3000))

```bash
bun dev
```

Activate githooks
```bash
cp -R hooks/ .git/hooks/
chmod ug+x .git/hooks/*
```

## Level Editing

Install [Tiled Editor](https://www.mapeditor.org/)

Open the `tilemaps.tile-project` file in Tiled, make edits to the map file and always export as a `.tmj` file into `public/assets/[LEVEL_NAME].tmj`

## Resources

#### Spritesheets

- [Tank Sprite](https://imgur.com/gallery/mewD6ts)
- [Texture Packer](https://free-tex-packer.com/app/)
