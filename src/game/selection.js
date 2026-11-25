import {units,buildings} from '../content/definitions.js';
import {entityAt,reachableCells,moveUnit} from './session.js';

/** Selection is transient UI state; only validated movement mutates the session. */
export function selectTile(session,selection,x,y){
  if(selection?.kind==='unit'&&moveUnit(session,selection.id,x,y)){
    return {selection:null,message:units[session.units.get(selection.id).type].name+' moved. End the turn to move again.'};
  }
  const target=entityAt(session,x,y);
  if(!target){
    if(selection?.kind==='unit'&&!session.units.get(selection.id)?.spent){
      return {selection,message:'That tile is not reachable.'};
    }
    return {selection:null,message:'Select a unit to move.'};
  }
  const {kind,entity}=target;
  if(selection?.kind===kind&&selection.id===entity.id){
    if(kind==='building')return {selection,message:'Garrison controls arrive in milestone 5.'};
    return {selection:null,message:'Selection cleared.'};
  }
  const next={kind,id:entity.id};
  const name=(kind==='unit'?units:buildings)[entity.type].name;
  return {selection:next,message:kind==='unit'?(entity.spent?name+' has already moved this turn.':name+' selected. Choose a highlighted tile.'):name+' selected.'};
}
export function selectionOverlay(session,selection){
  if(!selection)return null;
  const entity=(selection.kind==='unit'?session.units:session.buildings).get(selection.id);
  if(!entity?.position)return null;
  return {selected:{...entity.position},reachable:selection.kind==='unit'?reachableCells(session,selection.id):new Set()};
}
