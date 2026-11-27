# Architecture

Vanilla JavaScript ES modules, Vite for dev/build, Canvas 2D for world rendering, DOM/CSS for interface, Node built-in test runner for pure logic. Playwright Chromium tests cover real UI workflows. CI runs unit tests, production build and browser tests.

Current modules:
- src/core/grid.js: sparse grass coordinates, terrain bounds and connectivity; no DOM.
- src/content/definitions.js: stable content IDs and definitions.
- src/rendering/camera.js: coordinate transforms, zoom/pan math and camera clamping; no DOM.
- src/rendering/keyboard-pan.js: held-key order, normalized direction, frame-based pan input and listener cleanup.
- src/rendering/sprites.js: shared-palette native 32×32 pixel art, cached by ID (grass additionally uses eight variants and 16 edge masks).
- src/rendering/terrain-art.js: deterministic coordinate hash and cardinal exposed-edge mask, pure rendering helpers; not persisted.
- src/rendering/visible-terrain.js: choose sparse scan or viewport membership queries based on estimated work, never allocate world bounds.
- src/rendering/world.js: draw visible terrain and occupants, never mutate map.
- src/editor/map.js: authoritative editor map and validated placement/erase commands; runtime occupants keyed by coordinate.
- src/editor/stroke.js: cardinal interpolation, placement deduplication and one-layer-per-entry erasure; tool frozen at stroke start. Break interpolation over overlays.
- src/ui/editor-drawer.js: sprite-based category rail and tool controls; drawer overlays a fixed-size viewport.
- src/storage/map-store.js: versioned IndexedDB records, metadata catalog, migration, validation, serialization/hydration and revision-checked CRUD; no DOM.
- src/ui/map-scene.js: editor/gameplay coordination, camera and UI lifecycle; freezes camera during painting, clamps after stroke.
- src/game/session.js: independent runtime entity state, BFS reachable paths and destinations, validated movement and turn advancement.
- src/game/selection.js: transient selection, pending destination and path projection; second matching click commits validated movement. Opening a building dismisses its presentation-only representative ID.
- src/game/garrison.js: shared capacity, stored membership, origin and inspection helpers. Stored unit position is null, and exactly one building owns its ID; movement commits transfer atomically.
- src/game/production.js: validated recurring production orders, derived pause state, turn-based unit allocation. Unit IDs use the session counter; completed units enter the garrison directly; latest completion ID controls the map representative, never a second occupant.
- src/ui/garrison-dialog.js: capacity-driven slots, inspection, deployment and production controls; mutations delegated to rule functions.
- src/ui/production-dialog.js: nested training picker; two-step selection and validated order assignment.
- src/main.js: navigation, modal actions, dirty revision tracking and map persistence coordination.
- src/styles.css: shared medieval theme tokens and presentation; no external assets or fonts.

Further additions should follow existing game/ and ui/ boundaries.

Authoritative maps should contain terrain and editor occupants only; active sessions are separate copies with runtime unit IDs and state. Use plain serializable data for persistence and sparse sets/maps at runtime. Every future mutation should pass through a rule function that validates before committing; avoid duplicated validation in UI. UI selection and camera state are transient. Cache terrain bounds and refresh them after terrain edits; clamp all camera changes before drawing. Use a viewport transform rather than a world-sized canvas. Culling must not require allocating the entire coordinate bounds.

## Audit remediation
- Storage: database.js wraps IndexedDB request/transaction completion. map-store.js owns migration, metadata catalog, isolated records and revision-checked commands. Each mutation updates record and catalog atomically. Original legacy localStorage is untouched. The catalog does not hydrate terrain. Corrupt legacy records and records found damaged on load are isolated and exportable.
- game/types.js provides JSDoc contracts; typecheck covers gameplay and grid/content with strict null checks (legacy implicit parameters permitted). game/locations.js centralizes occupancy and membership updates, session revision invalidates overlay cache. Indexes must stay consistent with authoritative entities.
- map-input.js owns pointer gestures and button ownership, map-scene.js coordinates rendering and UI. render-scheduler.js coalesces frame requests; gameplay uses session terrain and bounds. Terrain removal uses early neighbor connectivity with a connected-map precondition.
- Playwright uses production preview, not source imports; independent coordinate helpers, pixel arrow checks, migration and concurrent-save tests. npm ci uses committed lockfile.
