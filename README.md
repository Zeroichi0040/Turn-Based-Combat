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

The initial foundation opens a 10×10 terrain preview with sample buildings and a Swordsman. Hold WASD or arrow keys for smooth camera panning (combine directions for diagonal motion; latest opposing key wins), or use middle/right mouse drag; zoom with the mouse wheel; press Home to reset the camera. This is a renderer preview, not yet the map editor or gameplay.

## Development

- [AGENTS.md](AGENTS.md): agent workflow and conventions
- [Game rules](docs/GAME_RULES.md): agreed behavior
- [Architecture](docs/ARCHITECTURE.md): module responsibilities
- [Progress](docs/PROGRESS.md): milestone tracking

Use feature branches and pull requests after the initial foundation. Do not merge without owner approval.
