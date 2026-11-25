import {units,buildings} from '../content/definitions.js';
import {key} from '../core/grid.js';
import {entityAt,reachablePaths,moveUnit} from './session.js';
import {garrisonOf,hasGarrisonSpace,unitOrigin,displayedUnit,dismissDisplayedUnit} from './garrison.js';

function openBuilding(session,building){
  dismissDisplayedUnit(session,building.id);
  return {selection:{kind:'building',id:building.id},openBuildingId:building.id,message:buildings[building.type].name};
}
/** First destination click previews a route; only the matching second click commits. */
export function selectTile(session,selection,x,y){
  const target=entityAt(session,x,y);
  if(selection?.kind==='unit'){
    const unit=session.units.get(selection.id),origin=unit&&unitOrigin(session,unit);
    if(origin?.x===x&&origin?.y===y){
      const source=garrisonOf(session,unit.id);
      if(source&&displayedUnit(session,source)?.id===unit.id)return openBuilding(session,source);
      return {selection:null,message:'Selection cleared.'};
    }
    const destination=key(x,y);
    if(reachablePaths(session,selection.id).has(destination)){
      if(selection.destination===destination&&moveUnit(session,selection.id,x,y)){
        const name=units[unit.type].name;
        return {selection:null,message:target?.kind==='building'?name+' garrisoned.':name+' moved.'};
      }
      return {selection:{kind:'unit',id:selection.id,destination},message:'Confirm move'};
    }
    if(unit&&!unit.spent&&target?.kind==='building'&&!hasGarrisonSpace(target.entity))
      return {selection:{kind:'unit',id:selection.id},message:'Garrison is full.'};
  }
  if(!target)return {selection:null,message:'Select a unit to move.'};
  const {kind,entity}=target;
  if(selection?.kind===kind&&selection.id===entity.id){
    if(kind==='building')return openBuilding(session,entity);
    return {selection:null,message:'Selection cleared.'};
  }
  const visible=kind==='building'?displayedUnit(session,entity):null;
  if(visible)return {selection:{kind:'unit',id:visible.id},message:units[visible.type].name+' selected'};
  const name=(kind==='unit'?units:buildings)[entity.type].name;
  return {selection:{kind,id:entity.id},message:kind==='unit'&&entity.spent?name+' has already moved this turn.':name+' selected'};
}
export function selectionOverlay(session,selection){
  if(!selection)return null;
  const entity=(selection.kind==='unit'?session.units:session.buildings).get(selection.id);
  if(!entity)return null;
  const origin=selection.kind==='unit'?unitOrigin(session,entity):entity.position;
  if(!origin)return null;
  const paths=selection.kind==='unit'?reachablePaths(session,selection.id):new Map();
  const deployment=selection.kind==='unit'&&garrisonOf(session,entity.id)&&!entity.spent;
  return {selected:{...origin},reachable:new Set(paths.keys()),path:paths.get(selection.destination)??null,
    deployment:deployment?{...origin,sprite:units[entity.type].sprite}:null};
}
