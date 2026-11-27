import {buildings,units} from '../content/definitions.js';
import {hasGarrisonSpace} from './garrison.js';
import {addProducedUnit} from './locations.js';

/** An order repeats indefinitely. Capacity is derived, never a separate flag. */
export function productionState(building){
  if(!building||!buildings[building.type]?.trainable.length)return 'unavailable';
  if(!building.production)return 'idle';
  return hasGarrisonSpace(building)?'training':'paused';
}
export function assignProduction(session,buildingId,unitType){
  const building=session.buildings.get(buildingId);
  if(!building||building.production||!buildings[building.type]?.trainable.includes(unitType)||
    !Object.hasOwn(units,unitType))return false;
  building.production={unitType,remaining:units[unitType].trainingTurns};
  session.revision++;return true;
}
export function cancelProduction(session,buildingId){
  const building=session.buildings.get(buildingId);
  if(!building?.production)return false;
  building.production=null;
  return true;
}
/** Called exactly once per turn advance, after resetting existing units. */
export function advanceProduction(session){
  const completed=[];
  for(const building of session.buildings.values()){
    if(productionState(building)!=='training')continue;
    const order=building.production;
    order.remaining--;
    if(order.remaining>0)continue;
    const {id}=addProducedUnit(session,building,order.unitType);
    completed.push({buildingId:building.id,unitId:id,unitType:order.unitType});
    order.remaining=units[order.unitType].trainingTurns;
  }
  return completed;
}
