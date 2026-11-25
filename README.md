# Turn-Based Combat

A desktop-first, turn-based strategy sandbox and scenario editor inspired by classic tile-based strategy games.

## Run locally

Requires Node.js 22.12+.

```sh
npm install
npm run dev
npm test
npm run build
```

Choose Edit to create, rename, delete or edit maps. New maps start with 10×10 grass. Use the overlay drawer to place or erase assets; re-enter a tile while erasing to remove its next layer. Save via the top-right menu; maps persist in this browser and origin. Start opens a read-only preview of a saved map, using a separate working copy. Gameplay arrives in milestone 4. Hold WASD or arrow keys to pan, middle/right drag to pan, scroll to zoom and Home to reset.

## Development

- [AGENTS.md](AGENTS.md): agent workflow and conventions
- [Game rules](docs/GAME_RULES.md): agreed behavior
- [Architecture](docs/ARCHITECTURE.md): module responsibilities
- [Progress](docs/PROGRESS.md): milestone tracking

Use feature branches and pull requests after the initial foundation. Do not merge without owner approval.
