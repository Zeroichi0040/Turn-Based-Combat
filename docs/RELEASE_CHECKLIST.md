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
- IndexedDB remains browser/origin local and subject to quota and eviction. Transactional revision checks prevent lost updates. Conflicts offer Save as Copy. Legacy localStorage is retained, and corrupt legacy records can be exported; no general cloud sync/import feature.
- No artificial map-size cap; very large or dense maps still incur connectivity, persistence and entity iteration costs. Viewport optimization is not a measured FPS guarantee.
- CI uses Chromium. Other browsers and hardware require separate manual testing.
- Commit the npm lockfile; use npm ci. Run npm run typecheck and the built-app browser tests.

v0.1.0 was published successfully. Future releases require explicit owner approval. Update package.json and package-lock.json version together, add docs/RELEASE_NOTES_vX.Y.Z.md, merge after review, then manually dispatch Publish approved release on main with the approved version. The workflow verifies the exact commit and refuses an existing tag.
