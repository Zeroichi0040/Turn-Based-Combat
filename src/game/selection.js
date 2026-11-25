import {units,buildings} from '../content/definitions.js';
import {entityAt,reachableCells,moveUnit} from './session.js';
import {garrisonOf,hasGarrisonSpace,unitOrigin} from './garrison.js';

/** Selection is transient UI state; only validated movement mutates the session. */
export function selectTile(session,selection,x,y){
  const target=entityAt(session,x,y);
  if(selection?.kind==='unit'){
    const unit=session.units.get(selection.id);
    const origin=unit&&unitOrigin(session,unit);
    if(origin?.x===x&&origin?.y===y)return {selection:null,message:'Selection cleared.'};
    if(moveUnit(session,selection.id,x,y)){
      const name=units[unit.type].name;
      return {selection:null,message:target?.kind==='building'?name+' garrisoned. End the turn to move again.':name+' moved. End the turn to move again.'};
    }
    if(unit&&!unit.spent&&target?.kind==='building'&&!hasGarrisonSpace(target.entity))
      return {selection,message:'Garrison is full.'};
    // A failed deployment leaves the stored unit in place and exits deployment
    // when another entity is selected; unreachable empty cells retain selection.
  }
  if(!target){
    if(selection?.kind==='unit'&&!session.units.get(selection.id)?.spent){
      return {selection,message:'That tile is not reachable.'};
    }
    return {selection:null,message:'Select a unit to move.'};
  }
  const {kind,entity}=target;
  if(selection?.kind===kind&&selection.id===entity.id){
    if(kind==='building')return {selection,openBuildingId:entity.id,message:buildings[entity.type].name+' garrison.'};
    return {selection:null,message:'Selection cleared.'};
  }
  const next={kind,id:entity.id};
  const name=(kind==='unit'?units:buildings)[entity.type].name;
  return {selection:next,message:kind==='unit'?(entity.spent?name+' has already moved this turn.':name+' selected. Choose a highlighted tile.'):name+' selected. Click again to open the garrison.'};
}
export function selectionOverlay(session,selection){
  if(!selection)return null;
  const entity=(selection.kind==='unit'?session.units:session.buildings).get(selection.id);
  if(!entity)return null;
  const origin=selection.kind==='unit'?unitOrigin(session,entity):entity.position;
  if(!origin)return null;
  const deployment=selection.kind==='unit'&&garrisonOf(session,entity.id)&&!entity.spent;
  return {selected:{...origin},reachable:selection.kind==='unit'?reachableCells(session,selection.id):new Set(),
    deployment:deployment?{...origin,sprite:units[entity.type].sprite}:null};
}
