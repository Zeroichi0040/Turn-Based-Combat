# Architecture

Vanilla JavaScript ES modules, Vite for dev/build, Canvas 2D for world rendering, DOM/CSS for interface, Node built-in test runner for pure logic. Browser tests will be added with interactive features.

Current modules:
- src/core/grid.js: sparse grass coordinates and connectivity; no DOM.
- src/content/definitions.js: stable content IDs and definitions.
- src/rendering/camera.js: coordinate transforms and zoom/pan math; no DOM.
- src/rendering/sprites.js: generated pixel sprites cached by ID.
- src/rendering/world.js: draw visible terrain and occupants, never mutate map.
- src/main.js: foundation preview wiring and desktop controls.
- src/styles.css: visual presentation.

Next modules (create as needed): editor/ for commands and drag strokes; game/ for turn/selection/garrison/production rules; storage/ for schema validation, migration and local persistence; ui/ for menus and dialogs.

Authoritative maps should contain terrain and editor occupants only; active sessions are separate copies with runtime unit IDs and state. Use plain serializable data for persistence and sparse sets/maps at runtime. Every future mutation should pass through a rule function that validates before committing; avoid duplicated validation in UI. UI selection and camera state are transient. Use a viewport transform rather than a world-sized canvas. Culling must not require allocating the entire coordinate bounds.
