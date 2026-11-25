# Progress

## Milestone 1 — foundation
Implemented in source: project shell, stable content definitions, sparse connected terrain model, generated 32×32 sprites, Canvas 2D preview with sample occupants, desktop pan/zoom, initial unit tests and CI configuration.

Verification: run npm test and npm run build; CI is configured to do so. Browser playtesting and CI results have not yet been recorded here. The sample preview is intentionally not an editor or game session.

## Foundation follow-up — keyboard navigation
Owner confirmed the initial foundation works locally. Replaced OS key-repeat panning with frame-clock motion, normalized diagonals, last-pressed priority per axis and focus/blur cleanup. Added regression tests for key state and event integration. Owner confirmed keyboard navigation feels good. Follow-up: clamp camera on pan, zoom, reset and resize to the terrain envelope plus three tiles per side; center axes that fit the viewport. Added five bounds regression tests. CI and browser playtesting of the bounds change remain to be verified.

## Next
2. Map editor: actual drawer, placement, universal eraser, drag strokes, validation.
3. Map management: versioned saves, create/rename/delete, main menu, unsaved exit.
4. Gameplay: selection, movement/pathfinding, turns and confirmations.
5. Garrison: building menus, entry, storage, deployment.
6. Production: recurring orders, capacity pause, cancel.
7. Release hardening: integration/browser tests, visual polish, performance.

No combat, economy, enemies or mobile controls in initial scope.
