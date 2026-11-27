/** @typedef {import('./types.js').Session} Session */
/** @typedef {import('./types.js').Selection} Selection */
/** @typedef {import('./types.js').SelectionResult} SelectionResult */
/** @typedef {import('./types.js').SelectionOverlay} SelectionOverlay */
/** @typedef {import('./types.js').Building} Building */
import {units,buildings} from '../content/definitions.js';
import {key} from '../core/grid.js';
import {entityAt,reachablePaths,moveUnit} from './session.js';
import {garrisonOf,hasGarrisonSpace,unitOrigin,displayedUnit,dismissDisplayedUnit} from './garrison.js';

/** @param {Session} session @param {Building} building @returns {SelectionResult} */
function openBuilding(session,building){
  dismissDisplayedUnit(session,building.id);
  return {selection:{kind:'building',id:building.id},openBuildingId:building.id,message:buildings[building.type].name};
}
/** First destination click previews a route; only the matching second click commits. */
/** @param {Session} session @param {Selection|null} selection @param {number} x @param {number} y @returns {SelectionResult} */
export function selectTile(session,selection,x,y){
  const target=entityAt(session,x,y);
  if(selection?.kind==='unit'){
    const unit=session.units.get(selection.id),origin=unit&&unitOrigin(session,unit);
    if(unit&&origin?.x===x&&origin?.y===y){
      const source=garrisonOf(session,unit.id);
      if(source&&displayedUnit(session,source)?.id===unit.id)return openBuilding(session,source);
      return {selection:null,message:'Selection cleared.'};
    }
    const destination=key(x,y);
    if(unit&&reachablePaths(session,selection.id).has(destination)){
      if(selection.destination===destination&&moveUnit(session,selection.id,x,y)){
        const name=units[unit.type].name;
        return {selection:null,message:target?.kind==='building'?name+' garrisoned.':name+' moved.'};
      }
      return {selection:{kind:'unit',id:selection.id,destination},message:'Confirm move'};
    }
    if(unit&&!unit.spent&&target?.kind==='building'&&!hasGarrisonSpace(target.entity)&&reachablePaths(session,selection.id,{includeFullBuildings:true}).has(destination))
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
  const name=target.kind==='unit'?units[target.entity.type].name:buildings[target.entity.type].name;
  return {selection:{kind,id:entity.id},message:target.kind==='unit'&&target.entity.spent?name+' has already moved this turn.':name+' selected'};
}
/** @param {Session} session @param {Selection|null} selection @returns {SelectionOverlay|null} */
export function selectionOverlay(session,selection){
  if(!selection)return null;
  if(selection.kind==='building'){
    const b=session.buildings.get(selection.id);
    return b?{selected:{...b.position},reachable:new Set(),path:null,deployment:null}:null;
  }
  const unit=session.units.get(selection.id);if(!unit)return null;
  const origin=unitOrigin(session,unit);if(!origin)return null;
  const paths=reachablePaths(session,unit.id),deployment=garrisonOf(session,unit.id)&&!unit.spent;
  return {selected:{...origin},reachable:new Set(paths.keys()),path:selection.destination?paths.get(selection.destination)??null:null,
    deployment:deployment?{...origin,sprite:units[unit.type].sprite}:null};
}
