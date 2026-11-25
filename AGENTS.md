# Coding agent instructions

Read docs/GAME_RULES.md, docs/ARCHITECTURE.md, and docs/PROGRESS.md before changing behavior. The game rules are the product contract; update them only when the owner approves a change. Do not infer unapproved mechanics from the project name.

## Workflow
- Check the current branch and existing changes before editing. Start subsequent milestones from current main on a feature branch. Do not directly push to main or merge without explicit owner approval.
- Keep changes focused and reviewable. Preserve existing behavior unless a change is requested.
- Run npm test and npm run build. For UI changes add and run browser regression tests once the browser suite is introduced. Report exact commands, failures, and untested paths honestly.
- Update docs/PROGRESS.md with changes, verification, limitations and next steps.
- Prefer descriptive names, small cohesive modules, JSDoc types, pure logic and explicit state transitions. Avoid unnecessary frameworks, duplicate rules, speculative abstractions and global mutable state.
- Renderer and UI must not mutate authoritative game state. Content IDs are stable persisted identifiers. Keep save schema versioned and validate before loading.
- Use generated 32×32 sprites, nearest-neighbor scaling and consistent palettes. No external art assets without owner approval.
- Fix root causes; include a regression test for each behavioral bug.

Make no mistakes is an aspiration, not a test result. Verify assumptions and report uncertainty.
