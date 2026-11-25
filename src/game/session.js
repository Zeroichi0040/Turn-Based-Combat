import {key,point,cardinal,terrainBounds} from '../core/grid.js';
import {units,buildings} from '../content/definitions.js';
import {garrisonOf,hasGarrisonSpace,unitOrigin} from './garrison.js';

/** Runtime state is independent of the editor map and has stable entity IDs. */
export function createSession(map) {
  const grass=new Set(map.grass),unitMap=new Map(),buildingMap=new Map();
  let nextId=1;
  for(const [k,o] of map.occupants){
    const position=point(k),id='entity-'+nextId++;
    if(o.category==='units')unitMap.set(id,{id,type:o.id,position,spent:false});
    else buildingMap.set(id,{id,type:o.id,position,garrison:[]});
  }
  return {grass,bounds:terrainBounds(grass),units:unitMap,buildings:buildingMap,turn:1,nextId};
}
export function entityAt(session,x,y){
  for(const u of session.units.values())if(u.position?.x===x&&u.position?.y===y)return {kind:'unit',entity:u};
  for(const b of session.buildings.values())if(b.position.x===x&&b.position.y===y)return {kind:'building',entity:b};
  return null;
}
/** Reachable destinations by cardinal steps; occupied grass may be traversed. */
export function reachableCells(session,unitId){
  const u=session.units.get(unitId);
  if(!u||u.spent)return new Set();
  const origin=unitOrigin(session,u);
  if(!origin)return new Set();
  const start=key(origin.x,origin.y),visited=new Set([start]),queue=[{...origin,distance:0}],destinations=new Set();
  const blocked=new Set();
  for(const other of session.units.values())if(other.position)blocked.add(key(other.position.x,other.position.y));
  for(const b of session.buildings.values())if(!hasGarrisonSpace(b))blocked.add(key(b.position.x,b.position.y));
  const budget=units[u.type].movement;
  for(let i=0;i<queue.length;i++){
    const {x,y,distance}=queue[i];
    if(distance>=budget)continue;
    for(const [a,b] of cardinal(x,y)){
      const k=key(a,b);
      if(!session.grass.has(k)||visited.has(k))continue;
      visited.add(k);queue.push({x:a,y:b,distance:distance+1});
      if(!blocked.has(k))destinations.add(k);
    }
  }
  return destinations;
}
export function moveUnit(session,id,x,y){
  if(!reachableCells(session,id).has(key(x,y)))return false;
  const u=session.units.get(id),source=garrisonOf(session,id),target=entityAt(session,x,y);
  if(source)source.garrison.splice(source.garrison.indexOf(id),1);
  if(target?.kind==='building'){
    target.entity.garrison.push(id);u.position=null;
  }else u.position={x,y};
  u.spent=true;
  return true;
}
export function endTurn(session){
  session.turn++;
  for(const u of session.units.values())u.spent=false;
}
export function* renderSession(session){
  for(const b of session.buildings.values())yield {...b.position,sprite:buildings[b.type].sprite,garrisonCount:b.garrison.length};
  for(const u of session.units.values())if(u.position)yield {...u.position,sprite:units[u.type].sprite,spent:u.spent};
}
