# Visual direction — first pass

Reference direction: classic tile-based medieval strategy, not a modern web dashboard.
- Every world sprite is generated at 32×32 native pixels. No image downloads or fractional drawing inside sprites. Use nearest-neighbor scaling.
- Shared dark outlines, top-left light, muted olive terrain, warm terracotta civic roof, cool stone fortification, blue unit heraldry and steel armor.
- The terrain should support entities, not compete with them. Eight deterministic variants break repetition; edge shading follows actual grass boundaries without extending beyond terrain cells.
- Selection is a gold corner bracket. Reachable cells have a muted green wash and visible border; spent units and paused orders retain grayscale/dark treatment. Counts appear only on nonempty buildings.
- Menus: rectangular beveled controls, thin brass edges, dark timber/stone-inspired surfaces, recessed slots, restrained typography. Preserve semantic labels, interaction sequence, and overlay drawer geometry.
- Keep all artwork in code and reuse sprites for map, drawer, stored units and production. No rule or save schema changes during visual iteration.
- Visual review at default zoom, minimum and maximum zoom, smaller desktop window, editor and gameplay, empty/full garrisons, training/paused state and stacked dialogs before signoff.

Second pass: stable button dimensions per role, fixed modal dimensions per content class, wider overlay drawer, no redundant helper copy. Preserve essential warnings and state indicators. White route arrow previews a move until the destination is clicked again; newly completed Barracks units are represented on top of the building until inspected or moved.
