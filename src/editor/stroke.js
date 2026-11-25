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

/** Each coordinate is attempted once per pointer stroke, even if revisited. */
export function createStroke(map,tool) {
  const visited=new Set();
  const selected={...tool};
  let previous=null;
  return {
    visit(tile) {
      let changed=false,last=null;
      for (const p of strokeCells(previous??tile,tile)) {
        const k=key(p.x,p.y);
        if (visited.has(k)) continue;
        visited.add(k);
        last=applyEdit(map,selected,p.x,p.y);
        changed ||= last.changed;
      }
      previous={...tile};
      return {changed,last};
    },
  };
}
