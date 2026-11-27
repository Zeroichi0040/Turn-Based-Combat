# Turn-Based Combat

A desktop-first, turn-based strategy sandbox and scenario editor inspired by classic tile-based strategy games.

## Run locally

Requires Node.js 22.12+.

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run typecheck
npm run test:e2e
```

Choose Edit to create, rename, delete or edit maps. New maps start with 10×10 grass. Use the overlay drawer to place or erase assets; re-enter a tile while erasing to remove its next layer. Save via the top-right menu; maps persist in this browser and origin. Clearing site data removes them. Existing v0.1.0 localStorage maps migrate once to transactional IndexedDB; the original localStorage data is retained as a backup. Conflicts offer Save as Copy. Start opens a fresh gameplay session of a saved map. Select a Swordsman, click a highlighted tile twice to preview then confirm movement, and confirm End Turn to restore movement. Move into a building with available space to garrison. Click a building twice to inspect its stored units; click a ready stored unit twice to deploy, then choose and confirm a destination or press Escape. In a Barracks, select the production slot twice, then select Swordsman twice to train one unit per turn. Newly trained units appear on their Barracks and can be selected directly. Clicking the same building again opens its garrison. Training pauses when full, resumes when space opens, and can be cancelled. Gameplay is not saved. Hold WASD or arrow keys to pan, middle/right drag to pan, scroll to zoom and Home to reset.

## Development

- [AGENTS.md](AGENTS.md): agent workflow and conventions
- [Game rules](docs/GAME_RULES.md): agreed behavior
- [Architecture](docs/ARCHITECTURE.md): module responsibilities
- [Progress](docs/PROGRESS.md): milestone tracking
- [Art direction](docs/ART_DIRECTION.md): sprite and UI conventions
- [Release checklist](docs/RELEASE_CHECKLIST.md): verification and known limits

Use feature branches and pull requests after the initial foundation. Do not merge without owner approval.
