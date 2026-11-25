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

The editor opens a blank 10×10 grass map. Choose an asset in the overlay left drawer, then click or drag on the map. Erase removes the occupant first, and grass when you leave and re-enter that tile or start another stroke. Hold WASD or arrow keys for smooth panning, or middle/right mouse drag; scroll to zoom; Home resets the camera. Save and Exit are disabled until map management is implemented; edits are not persistent yet.

## Development

- [AGENTS.md](AGENTS.md): agent workflow and conventions
- [Game rules](docs/GAME_RULES.md): agreed behavior
- [Architecture](docs/ARCHITECTURE.md): module responsibilities
- [Progress](docs/PROGRESS.md): milestone tracking

Use feature branches and pull requests after the initial foundation. Do not merge without owner approval.
