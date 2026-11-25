import {key} from '../core/grid.js';

/** Stable decorative variation, independent of camera, edits and save order. */
export const GRASS_VARIANTS=8;
export function grassVariant(x,y){
  // Hash the full coordinate string instead of truncating large coordinates.
  let hash=2166136261;
  for(const ch of key(x,y)){hash=Math.imul(hash^ch.charCodeAt(0),16777619);}
  hash^=hash>>>16;
  return (hash>>>0)%GRASS_VARIANTS;
}
export const EDGE=Object.freeze({north:1,east:2,south:4,west:8});
export function terrainEdges(grass,x,y){
  return (grass.has(key(x,y-1))?0:EDGE.north)|
    (grass.has(key(x+1,y))?0:EDGE.east)|
    (grass.has(key(x,y+1))?0:EDGE.south)|
    (grass.has(key(x-1,y))?0:EDGE.west);
}
