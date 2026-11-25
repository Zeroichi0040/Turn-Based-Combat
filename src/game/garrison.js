import {buildings} from '../content/definitions.js';

/** Map units own a position; stored units have null position and one garrison membership. */
export function garrisonOf(session,id){
  for(const b of session.buildings.values())if(b.garrison.includes(id))return b;
  return null;
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
