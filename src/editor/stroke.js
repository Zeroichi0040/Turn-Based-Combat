import {key} from '../core/grid.js';
import {applyEdit} from './map.js';

/** Cardinal grid traversal between cell centers; no gaps on fast diagonal drags.
 * A tie steps horizontally first to keep terrain growth cardinally connected.
 */
export function* strokeCells(from,to) {
  let {x,y}=from;
  const dx=Math.abs(to.x-x),dy=Math.abs(to.y-y);
  const sx=Math.sign(to.x-x),sy=Math.sign(to.y-y);
  let ix=0,iy=0;
  yield {x,y};
  while (ix<dx||iy<dy) {
    if (ix<dx && (iy===dy||(2*ix+1)*dy<=(2*iy+1)*dx)) {x+=sx;ix++;}
    else {y+=sy;iy++;}
    yield {x,y};
  }
}

/** Placement attempts each cell once per stroke. Erase removes one layer on
 * each entry into a cell, including re-entry, but never repeatedly while hovering.
 */
export function createStroke(map,tool) {
  const visited=new Set();
  const selected={...tool};
  let previous=null;
  return {
    breakPath() { previous=null; },
    visit(tile) {
      let changed=false,last=null;
      for (const p of strokeCells(previous??tile,tile)) {
        const k=key(p.x,p.y);
        // The starting cell was already handled by the previous pointer sample.
        if (previous && p.x===previous.x && p.y===previous.y) continue;
        if (selected.mode!=='erase') {
          if (visited.has(k)) continue;

        }
        last=applyEdit(map,selected,p.x,p.y);
        if(last.changed&&selected.mode!=='erase')visited.add(k);
        changed ||= last.changed;
      }
      previous={...tile};
      return {changed,last};
    },
  };
}
