import {buildings} from '../content/definitions.js';

/** Map units own a position; stored units have null position and one garrison membership. */
export function garrisonOf(session,id){
  return session.buildings.get(session.membership.get(id))??null;
}
export function hasGarrisonSpace(building){
  return building.garrison.length<buildings[building.type].garrisonCapacity;
}
export function unitOrigin(session,unit){
  return unit.position??garrisonOf(session,unit.id)?.position??null;
}
/** Inspect first, request deployment on second selection only if ready. No mutation. */
export function selectStoredUnit(session,buildingId,selectedId,unitId){
  const b=session.buildings.get(buildingId),u=session.units.get(unitId);
  if(!b?.garrison.includes(unitId)||!u)return {selectedId:null,deploy:false};
  return {selectedId:unitId,deploy:selectedId===unitId&&!u.spent};
}

/** Display a completed unit without creating another map occupant. */
export function displayedUnit(session,building){
  const id=building?.displayedUnitId;
  return id&&building.garrison.includes(id)?session.units.get(id)??null:null;
}
export function dismissDisplayedUnit(session,buildingId){
  const b=session.buildings.get(buildingId);if(b?.displayedUnitId!=null){b.displayedUnitId=null;session.revision++;}
}
