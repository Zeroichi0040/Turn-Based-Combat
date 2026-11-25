# Architecture

Vanilla JavaScript ES modules, Vite for dev/build, Canvas 2D for world rendering, DOM/CSS for interface, Node built-in test runner for pure logic. Browser tests will be added with interactive features.

Current modules:
- src/core/grid.js: sparse grass coordinates, terrain bounds and connectivity; no DOM.
- src/content/definitions.js: stable content IDs and definitions.
- src/rendering/camera.js: coordinate transforms, zoom/pan math and camera clamping; no DOM.
- src/rendering/keyboard-pan.js: held-key order, normalized direction, frame-based pan input and listener cleanup.
- src/rendering/sprites.js: generated pixel sprites cached by ID.
- src/rendering/world.js: draw visible terrain and occupants, never mutate map.
- src/editor/map.js: authoritative editor map and validated placement/erase commands; runtime occupants keyed by coordinate.
- src/editor/stroke.js: cardinal interpolation, placement deduplication and one-layer-per-entry erasure; tool frozen at stroke start. Break interpolation over overlays.
- src/ui/editor-drawer.js: sprite-based category rail and tool controls; drawer overlays a fixed-size viewport.
- src/storage/map-store.js: versioned local storage, strict validation, serialization/hydration and map CRUD; no DOM.
- src/ui/map-scene.js: reusable editor/read-only preview wiring, pointer gestures and camera; freezes camera during painting, clamps after stroke.
- src/main.js: navigation, modal actions, dirty revision tracking and map persistence coordination.
- src/styles.css: visual presentation.

Next modules (create as needed): game/ for turn/selection/garrison/production rules; ui/ for menus and dialogs.

Authoritative maps should contain terrain and editor occupants only; active sessions are separate copies with runtime unit IDs and state. Use plain serializable data for persistence and sparse sets/maps at runtime. Every future mutation should pass through a rule function that validates before committing; avoid duplicated validation in UI. UI selection and camera state are transient. Cache terrain bounds and refresh them after terrain edits; clamp all camera changes before drawing. Use a viewport transform rather than a world-sized canvas. Culling must not require allocating the entire coordinate bounds.
