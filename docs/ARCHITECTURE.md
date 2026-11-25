# Architecture

Vanilla JavaScript ES modules, Vite for dev/build, Canvas 2D for world rendering, DOM/CSS for interface, Node built-in test runner for pure logic. Browser tests will be added with interactive features.

Current modules:
- src/core/grid.js: sparse grass coordinates, terrain bounds and connectivity; no DOM.
- src/content/definitions.js: stable content IDs and definitions.
- src/rendering/camera.js: coordinate transforms, zoom/pan math and camera clamping; no DOM.
- src/rendering/keyboard-pan.js: held-key order, normalized direction, frame-based pan input and listener cleanup.
- src/rendering/sprites.js: shared-palette native 32×32 pixel art, cached by ID (grass additionally uses eight variants and 16 edge masks).
- src/rendering/terrain-art.js: deterministic coordinate hash and cardinal exposed-edge mask, pure rendering helpers; not persisted.
- src/rendering/world.js: draw visible terrain and occupants, never mutate map.
- src/editor/map.js: authoritative editor map and validated placement/erase commands; runtime occupants keyed by coordinate.
- src/editor/stroke.js: cardinal interpolation, placement deduplication and one-layer-per-entry erasure; tool frozen at stroke start. Break interpolation over overlays.
- src/ui/editor-drawer.js: sprite-based category rail and tool controls; drawer overlays a fixed-size viewport.
- src/storage/map-store.js: versioned local storage, strict validation, serialization/hydration and map CRUD; no DOM.
- src/ui/map-scene.js: reusable editor/gameplay wiring, pointer gestures and camera; freezes camera during painting, clamps after stroke.
- src/game/session.js: independent runtime entity state, BFS reachable destinations, validated movement and turn advancement.
- src/game/selection.js: transient selection transitions and renderer overlay projection.
- src/game/garrison.js: shared capacity, stored membership, origin and inspection helpers. Stored unit position is null, and exactly one building owns its ID; movement commits transfer atomically.
- src/game/production.js: validated recurring production orders, derived pause state, turn-based unit allocation. Unit IDs use the session counter; completed units enter the garrison directly.
- src/ui/garrison-dialog.js: capacity-driven slots, inspection, deployment and production controls; mutations delegated to rule functions.
- src/ui/production-dialog.js: nested training picker; two-step selection and validated order assignment.
- src/main.js: navigation, modal actions, dirty revision tracking and map persistence coordination.
- src/styles.css: shared medieval theme tokens and presentation; no external assets or fonts.

Further additions should follow existing game/ and ui/ boundaries.

Authoritative maps should contain terrain and editor occupants only; active sessions are separate copies with runtime unit IDs and state. Use plain serializable data for persistence and sparse sets/maps at runtime. Every future mutation should pass through a rule function that validates before committing; avoid duplicated validation in UI. UI selection and camera state are transient. Cache terrain bounds and refresh them after terrain edits; clamp all camera changes before drawing. Use a viewport transform rather than a world-sized canvas. Culling must not require allocating the entire coordinate bounds.
