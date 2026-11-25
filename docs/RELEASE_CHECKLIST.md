# Initial sandbox release checklist

## Automated checks
- npm test — logic, terrain connectivity, camera, storage, production, path previews and runtime invariants.
- npm run build — production bundling.
- npx playwright install chromium && npm run test:e2e — real desktop browser flows.
- Review CI on the exact PR head before merging.

## Final manual checks
- Existing saved maps open, save, rename and delete; unsaved exit choices work.
- Editor drag painting/erasing and overlay drawer work at different desktop zoom/window sizes.
- Movement arrows, cancellation, spent states and end-turn confirmation work.
- Both garrisons respect capacity; completed units can deploy directly; full Barracks pause and resume training.
- Building dialogs fit normal desktop screens without scrolling.
- Exit/reopen a game and verify the saved map is unchanged.

## Known limits
- Desktop mouse and keyboard; mobile controls not implemented.
- Single-player sandbox; no combat, opponents, economy, multiplayer or gameplay saves.
- Local storage has browser quota limits; no cloud sync or backup/export feature. Stale-editor checks prevent sequential overwrites, but localStorage is not a transactional multi-writer database.
- No artificial map-size cap; very large or dense maps still incur connectivity, persistence and entity iteration costs. Viewport optimization is not a measured FPS guarantee.
- CI uses Chromium. Other browsers and hardware require separate manual testing.
- No lockfile is committed yet; dependency resolution is not fully reproducible. Generate and verify a lockfile in a network-enabled checkout before distribution if required.

Version 0.1.0 approved by the owner. Release-hardening PR CI passed 71 unit tests, 19 Chromium browser tests and production build. The one-time initial release workflow only runs for the merged PR #8, verifies the merged commit, and publishes v0.1.0. Future releases require owner approval.
