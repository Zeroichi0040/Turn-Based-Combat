# Progress

## Milestone 1 — foundation
Implemented in source: project shell, stable content definitions, sparse connected terrain model, generated 32×32 sprites, Canvas 2D preview with sample occupants, desktop pan/zoom, initial unit tests and CI configuration.

Verification: run npm test and npm run build; CI is configured to do so. Browser playtesting and CI results have not yet been recorded here. The sample preview is intentionally not an editor or game session.

## Foundation follow-up — keyboard navigation
Owner confirmed the initial foundation works locally. Replaced OS key-repeat panning with frame-clock motion, normalized diagonals, last-pressed priority per axis and focus/blur cleanup. Added regression tests for key state and event integration. Owner confirmed keyboard navigation feels good. Follow-up: clamp camera on pan, zoom, reset and resize to the terrain envelope plus three tiles per side; center axes that fit the viewport. Added five bounds regression tests. CI passed and the owner confirmed the camera bounds feel good. PR #1 merged.

## Milestone 2 — map editor
Implemented source: blank 10×10 editor, collapsible sprite category drawer, Place/Erase, validated occupants, cardinal grass expansion and connected erasure, drag interpolation and one placement attempt per cell per stroke, live terrain bounds and hover outline. Editor menu Resume works; Save and Exit are deliberately disabled until map management in milestone 3. Maps are transient in this milestone. Initial editor CI passed. Owner requested seven-tile camera padding, repeated erasure on tile re-entry (not on stationary events), and an overlay drawer. Implemented and updated regression coverage; Owner approved the revised editor; corrected an outdated camera test input before merge.

## Milestone 3 — map management
Implemented Start/Edit navigation, named map creation (blank names use unused New Map n), browser-local versioned saves, rename/delete confirmation, explicit save and unsaved-exit choices, read-only Start preview with independent hydrated map. New maps are saved immediately as blank scenarios; discard reverts to last save. Gameplay movement/turns are deferred. Seven new unit tests and three management browser workflows; verification pending.

## Next
4. Gameplay: selection, movement/pathfinding, turns and confirmations.
5. Garrison: building menus, entry, storage, deployment.
6. Production: recurring orders, capacity pause, cancel.
7. Sprites and UI polish: dedicated art and interface refinement after mechanics.
8. Release hardening: integration/browser tests, performance, bug fixes.

No combat, economy, enemies or mobile controls in initial scope.
