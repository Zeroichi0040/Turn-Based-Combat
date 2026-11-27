/** @typedef {import('./types.js').Session} Session */
/** @typedef {import('./types.js').Unit} Unit */
/** @typedef {import('./types.js').Building} Building */
import {buildings} from '../content/definitions.js';

/** Map units own a position; stored units have null position and one garrison membership. */
/** @param {Session} session @param {string} id */
export function garrisonOf(session,id){
  const buildingId=session.membership.get(id);return buildingId?session.buildings.get(buildingId)??null:null;
}
/** @param {Building} building */
export function hasGarrisonSpace(building){
  return building.garrison.length<buildings[building.type].garrisonCapacity;
}
/** @param {Session} session @param {Unit} unit */
export function unitOrigin(session,unit){
  return unit.position??garrisonOf(session,unit.id)?.position??null;
}
/** Inspect first, request deployment on second selection only if ready. No mutation. */
/** @param {Session} session @param {string} buildingId @param {string|null} selectedId @param {string} unitId */
export function selectStoredUnit(session,buildingId,selectedId,unitId){
  const b=session.buildings.get(buildingId),u=session.units.get(unitId);
  if(!b?.garrison.includes(unitId)||!u)return {selectedId:null,deploy:false};
  return {selectedId:unitId,deploy:selectedId===unitId&&!u.spent};
}

/** Display a completed unit without creating another map occupant. */
/** @param {Session} session @param {Building} building */
export function displayedUnit(session,building){
  const id=building?.displayedUnitId;
  return id&&building.garrison.includes(id)?session.units.get(id)??null:null;
}
/** @param {Session} session @param {string} buildingId */
export function dismissDisplayedUnit(session,buildingId){
  const b=session.buildings.get(buildingId);if(b?.displayedUnitId!=null){b.displayedUnitId=null;session.revision++;}
}
