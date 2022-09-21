# Dev Setup

Use `bun` for local development.

## Install
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

## Run Dev
Run dev server (served on [localhost:300X](http://localhost:3000))

```bash
bun dev
```

Dev server does hot reloading (restarting) by default

# Simplified v1 - Feature List

- 1 unit
  - unit has two states, moving & stationary

- 1 levels

Tasks

- implement form to enter a game + your username
- handle client connection + disconnection
- implement game lobby and room logic
- create a map
- implement player unit, connect with mouse inputs
- run game loop in all connected clients and sync
- figure out an effective simple multiplayer server architecture

- create a simple maze path
- implement 1 enemy
- implement projectiles
- implement hit detection
- create simple unit spritesheets
  - p1 : blue square
  - p2 : purple square
  - bg : black
  - path : red line
  - enemy : red circle
  - projectile : yellow circle
- implement super basic path finding (click to move)
- implement enemy detection & firing
- implement game