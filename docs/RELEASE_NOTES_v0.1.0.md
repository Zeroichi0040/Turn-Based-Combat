# Turn-Based Combat v0.1.0

First official release of the desktop-first turn-based strategy sandbox and map editor.

## Features
- Create, edit, name, rename, save and delete expandable maps.
- Connected grass terrain, drag painting and layered erasing, generated 32×32 medieval pixel art.
- Smooth WASD/arrow navigation, mouse panning, zoom and dynamic camera bounds.
- Turn-based Swordsman movement with two-click route preview and confirmation.
- Town Hall and Barracks garrisons, direct transfers and recurring Swordsman production with automatic capacity pauses.
- Browser-local map persistence, unsaved-change protection and stale-editor save checks.
- Viewport-aware terrain rendering and a consistent strategy-game interface.

## Verification
Release-hardening CI passed 71 unit tests, 19 Chromium browser tests and the production build. All eight milestones were reviewed and approved by the owner.

## Getting started
Requires Node.js 22.12 or newer.
Download the source, extract it, then run:
```sh
npm install
npm run dev
```
Use Edit to create a map and Start to play a fresh session.

## Known limitations
Single-player desktop sandbox only: no combat damage, enemies, economy, multiplayer, mobile controls or gameplay saves. Maps are stored in the current browser/origin; clearing site data deletes them. No cloud backup or export yet. Chromium is the automated browser target; other browsers are not verified. Dependencies are not locked yet.
