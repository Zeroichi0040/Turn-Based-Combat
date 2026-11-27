import {key,point,cardinal,terrainBounds} from '../core/grid.js';
import {units,buildings} from '../content/definitions.js';
import {hasGarrisonSpace,unitOrigin,displayedUnit} from './garrison.js';
import {advanceProduction} from './production.js';
import {entityAt,relocateUnit} from './locations.js';
export {entityAt} from './locations.js';

/** Runtime state is independent of the editor map and has stable entity IDs. */
export function createSession(map) {
  const grass=new Set(map.grass),unitMap=new Map(),buildingMap=new Map(),occupancy=new Map();
  let nextId=1;
  for(const [k,o] of map.occupants){
    const position=point(k),id='entity-'+nextId++;
    occupancy.set(k,{kind:o.category==='units'?'unit':'building',id});
    if(o.category==='units')unitMap.set(id,{id,type:o.id,position,spent:false});
    else buildingMap.set(id,{id,type:o.id,position,garrison:[],production:null,displayedUnitId:null});
  }
  return {grass,bounds:terrainBounds(grass),units:unitMap,buildings:buildingMap,occupancy,membership:new Map(),revision:0,turn:1,nextId};
}
/** Reachable destinations by cardinal steps; occupied grass may be traversed. */
export function reachablePaths(session,unitId,{includeFullBuildings=false}={}){
  const u=session.units.get(unitId);
  if(!u||u.spent)return new Map();
  const origin=unitOrigin(session,u);
  if(!origin)return new Map();
  const start=key(origin.x,origin.y),visited=new Set([start]),queue=[{...origin,distance:0,path:[{...origin}]}],destinations=new Map();
  const budget=units[u.type].movement;
  for(let i=0;i<queue.length;i++){
    const {x,y,distance,path}=queue[i];
    if(distance>=budget)continue;
    for(const [a,b] of cardinal(x,y)){
      const k=key(a,b);
      if(!session.grass.has(k)||visited.has(k))continue;
      const nextPath=[...path,{x:a,y:b}];
      visited.add(k);queue.push({x:a,y:b,distance:distance+1,path:nextPath});
      const target=entityAt(session,a,b);
      if(!target||(target.kind==='building'&&(includeFullBuildings||hasGarrisonSpace(target.entity))))destinations.set(k,nextPath);
    }
  }
  return destinations;
}
export function reachableCells(session,id){return new Set(reachablePaths(session,id).keys());}
export function moveUnit(session,id,x,y){
  if(!reachablePaths(session,id).has(key(x,y)))return false;
  const u=session.units.get(id),target=entityAt(session,x,y);
  relocateUnit(session,u,{x,y},target?.kind==='building'?target.entity:null);
  u.spent=true;
  return true;
}
export function endTurn(session){
  session.turn++;session.revision++;
  for(const u of session.units.values())u.spent=false;
  return advanceProduction(session);
}
export function* renderSession(session,visible=null){
  const entries=visible&&visible.length<session.occupancy.size
    ? visible.map(p=>entityAt(session,p.x,p.y)).filter(Boolean)
    : (function*(){for(const b of session.buildings.values())yield {kind:'building',entity:b};for(const u of session.units.values())if(u.position)yield {kind:'unit',entity:u};})();
  for(const {kind,entity} of entries){
    if(kind==='building'){
      yield {...entity.position,sprite:buildings[entity.type].sprite,garrisonCount:entity.garrison.length};
      const u=displayedUnit(session,entity);
      if(u)yield {...entity.position,sprite:units[u.type].sprite,spent:u.spent,representative:true};
    }else yield {...entity.position,sprite:units[entity.type].sprite,spent:entity.spent};
  }
}
