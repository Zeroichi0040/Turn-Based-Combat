# v0.1.1 — Technical Debt and Stability

A maintenance release following the post-v0.1.0 audit. The existing gameplay and medieval visual direction are preserved.

## Data integrity
- Transactional IndexedDB storage with per-map records, a lightweight metadata catalog and revision-checked saves.
- Existing v0.1.0 maps migrate once. Original localStorage data is retained as a backup.
- Concurrent writes no longer silently overwrite unrelated maps; conflicting edits can be saved as a copy.
- Unreadable maps are isolated and can be exported without blocking healthy maps.

## Gameplay and input fixes
- Distant full buildings can be selected normally.
- Previously rejected grass placement can be retried within a drag stroke once connected.
- Camera keyboard input respects scene/modal activity; pointer gestures track their initiating mouse button.
- Gameplay rendering uses active session terrain and bounds.

## Performance and maintainability
- Early-exit terrain connectivity checks; indexed entity and garrison lookups; frame-coalesced rendering and revision-keyed movement-overlay caching.
- Centralized location mutations, JSDoc gameplay contracts and static checking.
- Consolidated CSS and extracted pointer lifecycle management.

## Verification and distribution
- Committed dependency lockfile and reproducible npm ci installation.
- 80 unit tests and 23 Chromium production-bundle browser tests passed on PR #9, and merged-main CI passed. Coverage includes transaction rollback, migration, conflicting saves, movement-arrow pixels and 300 simulated turns with gameplay invariants.
- Release pipeline retests the exact release commit before publishing.

## Upgrade notes
Use Node.js 22.12+ and run npm ci, then npm run dev. Map migration is one-way: returning to v0.1.0 exposes the original backup, not subsequent IndexedDB edits. Maps remain local to the browser and origin; clearing site data removes them. Actual FPS gains, non-Chromium browser compatibility and mobile controls are not verified. No new combat, opponents, economy, multiplayer or gameplay saves.
