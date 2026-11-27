# Progress

## Milestone 1 — foundation
Implemented in source: project shell, stable content definitions, sparse connected terrain model, generated 32×32 sprites, Canvas 2D preview with sample occupants, desktop pan/zoom, initial unit tests and CI configuration.

Verification: run npm test and npm run build; CI is configured to do so. Browser playtesting and CI results have not yet been recorded here. The sample preview is intentionally not an editor or game session.

## Foundation follow-up — keyboard navigation
Owner confirmed the initial foundation works locally. Replaced OS key-repeat panning with frame-clock motion, normalized diagonals, last-pressed priority per axis and focus/blur cleanup. Added regression tests for key state and event integration. Owner confirmed keyboard navigation feels good. Follow-up: clamp camera on pan, zoom, reset and resize to the terrain envelope plus three tiles per side; center axes that fit the viewport. Added five bounds regression tests. CI passed and the owner confirmed the camera bounds feel good. PR #1 merged.

## Milestone 2 — map editor
Implemented source: blank 10×10 editor, collapsible sprite category drawer, Place/Erase, validated occupants, cardinal grass expansion and connected erasure, drag interpolation and one placement attempt per cell per stroke, live terrain bounds and hover outline. Editor menu Resume works; Save and Exit are deliberately disabled until map management in milestone 3. Maps are transient in this milestone. Initial editor CI passed. Owner requested seven-tile camera padding, repeated erasure on tile re-entry (not on stationary events), and an overlay drawer. Implemented and updated regression coverage; Owner approved the revised editor; corrected an outdated camera test input before merge.

## Milestone 3 — map management
Implemented Start/Edit navigation, named map creation (blank names use unused New Map n), browser-local versioned saves, rename/delete confirmation, explicit save and unsaved-exit choices, read-only Start preview with independent hydrated map. New maps are saved immediately as blank scenarios; discard reverts to last save. Gameplay movement/turns are deferred. Seven new unit tests and three management browser workflows. Owner approved the milestone; stale Exit assertion corrected.

## Milestone 4 — gameplay and turns
Implemented independent runtime sessions, stable entity IDs, Swordsman selection and legal destination highlights, cardinal BFS pathfinding through occupied grass, one movement per turn, spent sprite shading, end-turn confirmation and turn counter. Building inspection is available; entry/garrison menus are deferred to milestone 5. No runtime saves. Added seven gameplay unit tests and two Playwright workflows; CI passed and owner approved PR #4, merged.

## Milestone 5 — garrison system
Implemented shared capacity-aware entry, deployment and direct transfer; stored unit IDs and null map positions; counts visible on buildings, 2 Barracks slots and 4 Town Hall slots, inspect/select-again, spent shading and cancellation without mutation. Full buildings remain traversable. Production slot and training are deferred to milestone 6. Seven new logic tests and two browser workflows; initial garrison CI passed. Owner requested deselection on unreachable empty tiles and hidden zero-count map badges; implemented with updated selection tests and a new badge browser regression. Latest CI passed; owner approved PR #5 and it was merged.

## Milestone 6 — unit production
Implemented recurring capacity-aware Barracks orders, one-turn Swordsman training, immediate readiness, paused sprite shading, automatic resumption after deployment and dedicated cancellation. Training picker uses two separate selections and a nested modal; Town Hall has no production slot. No gameplay saves. Seven unit tests and two browser workflows added; CI passed and owner approved PR #6, merged.

## Milestone 7 — first visual pass
Reworked all four native 32×32 generated sprites with a shared medieval palette, distinct silhouettes and top-left lighting. Eight deterministic grass variants plus cardinal exposed-edge masks; no save changes, cache bounded to 128 terrain variants. Refined selection corners, reachable tile highlights, count badges, square beveled controls, recessed slots, menus and crest. No gameplay rule changes. Added two terrain-art unit tests and one browser sprite test. Initial visual CI passed unit/build but failed the overlay snapshot check. Owner requested stable control/modal sizes, a wider drawer, removal of redundant helper labels, two-click route preview/confirmation and direct selection of completed Barracks units. Implemented these, updated existing tests and added regression coverage; Owner approved the visual direction and new gameplay behavior, with one Barracks scrollbar remaining. Expanded the fixed building modal to 540×360 and added browser overflow checks across idle, training and paused states plus Town Hall. Previous CI passed 65 unit tests/build and 16 of 17 browser tests; replaced the unstable encoded-canvas comparison with direct render-coordinate checks. Latest CI passed and owner approved PR #7; merged.

## Milestone 8 — release hardening
Implemented bounded visible-terrain iteration, incremental editor bounds, unchanged-resize and camera-boundary redraw avoidance, stale editor snapshot detection, menu-error cleanup and navigation recovery. Added deterministic 100-turn invariant stress coverage, viewport correctness/work-count tests, and two-tab save regression. No changes to approved gameplay, sprite art or saved-map schema. CI passed: 71 unit tests, 19 Chromium browser tests and production build. Owner approved merge and publication of v0.1.0. One-time release workflow verifies the merged commit before publication.

No combat, economy, enemies or mobile controls in initial scope.

## Post-release audit remediation — proposed v0.1.1
Four passes on fix/technical-debt: transactional per-map IndexedDB with retained legacy backup and quarantine, conflict recovery, selection/paint/keyboard/pointer fixes and session terrain; early connectivity, indexed locations, visible entity queries and frame scheduling; typed gameplay contracts, pointer lifecycle extraction and consolidated layout; production-bundle browser tests, multi-seed invariants, lockfile and manually dispatched release workflow. Initial persistence/input CI passed. Performance commit passed 77 unit tests and build; a frame-timing assertion needed updating. Type checking caught a registry inference issue, corrected. Final PR #9 CI passed: 80 unit tests, 23 production Chromium browser tests, static checking, locked installation and build. Owner merged PR #9; main CI passed. Owner explicitly authorized publication of v0.1.1. Release metadata and notes are prepared; publication is verified separately by the release workflow.
