import {key} from '../core/grid.js';

/** Centralized location mutations; occupancy and membership indexes mirror entities. */
export function entityAt(session,x,y){
  const entry=session.occupancy.get(key(x,y));
  if(!entry)return null;
  const entity=(entry.kind==='unit'?session.units:session.buildings).get(entry.id);
  return entity?{kind:entry.kind,entity}:null;
}
export function relocateUnit(session,unit,destination,building=null){
  if(unit.position)session.occupancy.delete(key(unit.position.x,unit.position.y));
  const sourceId=session.membership.get(unit.id);
  if(sourceId){
    const source=session.buildings.get(sourceId);
    source.garrison.splice(source.garrison.indexOf(unit.id),1);
    if(source.displayedUnitId===unit.id)source.displayedUnitId=null;
    session.membership.delete(unit.id);
  }
  if(building){
    building.garrison.push(unit.id);
    session.membership.set(unit.id,building.id);
    unit.position=null;
  }else{
    unit.position={...destination};
    session.occupancy.set(key(destination.x,destination.y),{kind:'unit',id:unit.id});
  }
  session.revision++;
}
export function addProducedUnit(session,building,type){
  const id='entity-'+session.nextId++,unit={id,type,position:null,spent:false};
  session.units.set(id,unit);
  relocateUnit(session,unit,building.position,building);
  building.displayedUnitId=id;
  return unit;
}
