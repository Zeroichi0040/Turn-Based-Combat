/** @typedef {import('./types.js').Session} Session */
/** @typedef {import('./types.js').Building} Building */
/** @typedef {import('./types.js').UnitType} UnitType */
import {buildings,units} from '../content/definitions.js';
import {hasGarrisonSpace} from './garrison.js';
import {addProducedUnit} from './locations.js';

/** An order repeats indefinitely. Capacity is derived, never a separate flag. */
/** @param {Building|null|undefined} building */
export function productionState(building){
  if(!building||!buildings[building.type]?.trainable.length)return 'unavailable';
  if(!building.production)return 'idle';
  return hasGarrisonSpace(building)?'training':'paused';
}
/** @param {Session} session @param {string} buildingId @param {UnitType} unitType */
export function assignProduction(session,buildingId,unitType){
  const building=session.buildings.get(buildingId);
  if(!building||building.production||!Object.hasOwn(units,unitType))return false;
  /** @type {readonly string[]} */ const trainable=buildings[building.type].trainable;
  if(!trainable.includes(unitType))return false;
  building.production={unitType,remaining:units[unitType].trainingTurns};
  session.revision++;return true;
}
/** @param {Session} session @param {string} buildingId */
export function cancelProduction(session,buildingId){
  const building=session.buildings.get(buildingId);
  if(!building?.production)return false;
  building.production=null;
  session.revision++;return true;
}
/** Called exactly once per turn advance, after resetting existing units. */
/** @param {Session} session */
export function advanceProduction(session){
  const completed=[];
  for(const building of session.buildings.values()){
    if(productionState(building)!=='training')continue;
    const order=building.production;if(!order)continue;
    order.remaining--;
    if(order.remaining>0)continue;
    const {id}=addProducedUnit(session,building,order.unitType);
    completed.push({buildingId:building.id,unitId:id,unitType:order.unitType});
    order.remaining=units[order.unitType].trainingTurns;
  }
  return completed;
}
