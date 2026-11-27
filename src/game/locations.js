/** @typedef {import('./types.js').Session} Session */
/** @typedef {import('./types.js').Point} Point */
/** @typedef {import('./types.js').Unit} Unit */
/** @typedef {import('./types.js').UnitType} UnitType */
/** @typedef {import('./types.js').Building} Building */
/** @typedef {import('./types.js').EntityLookup} EntityLookup */
import {key} from '../core/grid.js';

/** Centralized location mutations; occupancy and membership indexes mirror entities. */
/** @param {Session} session @param {number} x @param {number} y @returns {EntityLookup|null} */
export function entityAt(session,x,y){
  const entry=session.occupancy.get(key(x,y));
  if(!entry)return null;
  if(entry.kind==='unit'){const entity=session.units.get(entry.id);return entity?{kind:'unit',entity}:null;}
  const entity=session.buildings.get(entry.id);return entity?{kind:'building',entity}:null;
}
/** @param {Session} session @param {Unit} unit @param {Point} destination @param {Building|null} building */
export function relocateUnit(session,unit,destination,building=null){
  const sourceId=session.membership.get(unit.id),source=sourceId?session.buildings.get(sourceId):null;
  if(sourceId&&(!source||!source.garrison.includes(unit.id)))throw Error('Invalid garrison membership');
  if(unit.position)session.occupancy.delete(key(unit.position.x,unit.position.y));
  if(source){
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
/** @param {Session} session @param {Building} building @param {UnitType} type */
export function addProducedUnit(session,building,type){
  const id='entity-'+session.nextId++;
  /** @type {Unit} */ const unit={id,type,position:null,spent:false};
  session.units.set(id,unit);
  relocateUnit(session,unit,building.position,building);
  building.displayedUnitId=id;
  return unit;
}
