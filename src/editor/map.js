import {newTerrain, key, point, canAddGrass, canRemoveGrass, terrainBounds} from '../core/grid.js';
import {terrain, buildings, units} from '../content/definitions.js';

/** Editor state contains terrain and one optional occupant per cell. */
export function createEditorMap() {
  const grass = newTerrain();
  return {grass, occupants: new Map(), bounds: terrainBounds(grass), revision: 0};
}
export const categories = Object.freeze({
  tiles: terrain, buildings, units,
});
function changed(map, message) {
  map.revision++;
  return {changed:true,message};
}
const rejected = message => ({changed:false,message});

/** Validate and apply exactly one edit. Rendering never writes this state. */
export function applyEdit(map, tool, x, y) {
  if (!Number.isSafeInteger(x)||!Number.isSafeInteger(y)) return rejected('Invalid tile.');
  const k=key(x,y), occupant=map.occupants.get(k);
  if (tool.mode==='erase') {
    if (occupant) {
      map.occupants.delete(k);
      return changed(map,'Removed '+categories[occupant.category][occupant.id].name+'.');
    }
    if (!map.grass.has(k)) return rejected('Nothing to erase.');
    if (map.grass.size===1) return rejected('Keep at least one grass tile.');
    if (!canRemoveGrass(map.grass,x,y)) return rejected('Cannot disconnect the map.');
    map.grass.delete(k);
    const b=map.bounds;
    if(!b||x===b.minX||x===b.maxX||y===b.minY||y===b.maxY)map.bounds=terrainBounds(map.grass);
    return changed(map,'Grass erased.');
  }
  if (tool.mode!=='place'||!Object.hasOwn(categories,tool.category)||
      !Object.hasOwn(categories[tool.category],tool.id)) return rejected('Unknown editor tool.');
  if (tool.category==='tiles') {
    if (map.grass.has(k)) return rejected('Grass already present.');
    if (!canAddGrass(map.grass,x,y)) return rejected('Grass must touch existing grass on an edge.');
    map.grass.add(k);
    const b=map.bounds;
    map.bounds=b?{minX:Math.min(b.minX,x),minY:Math.min(b.minY,y),maxX:Math.max(b.maxX,x),maxY:Math.max(b.maxY,y)}:terrainBounds(map.grass);
    return changed(map,'Grass placed.');
  }
  if (!map.grass.has(k)) return rejected('Place on grass.');
  if (occupant && occupant.category!==tool.category) return rejected('Erase the existing occupant first.');
  if (occupant?.id===tool.id) return rejected('Already placed.');
  map.occupants.set(k,{category:tool.category,id:tool.id});
  return changed(map,categories[tool.category][tool.id].name+' placed.');
}

/** Adapt map occupants to the renderer without exposing mutable records. */
export function* renderOccupants(map,visible=null) {
  const entries=visible&&visible.length<map.occupants.size?visible.map(p=>{const k=key(p.x,p.y);return [k,map.occupants.get(k)];}).filter(([,o])=>o):map.occupants;
  for (const [k,o] of entries) yield {...point(k),sprite:categories[o.category][o.id].sprite};
}
