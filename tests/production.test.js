import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditorMap,applyEdit} from '../src/editor/map.js';
import {createSession,entityAt,endTurn,moveUnit,renderSession,reachableCells} from '../src/game/session.js';
import {assignProduction,cancelProduction,productionState} from '../src/game/production.js';
function setup(){
  const map=createEditorMap();
  for(const [id,x] of [['barracks',4],['townHall',6],['barracks',8]])applyEdit(map,{mode:'place',category:'buildings',id},x,4);
  applyEdit(map,{mode:'place',category:'units',id:'swordsman'},3,4);
  const s=createSession(map),at=x=>entityAt(s,x,4).entity;
  return {map,s,b:at(4),h:at(6),b2:at(8),u:at(3)};
}
test('only trainable types and eligible buildings accept one order',()=>{
  const {s,b,h}=setup();
  assert.equal(productionState(h),'unavailable');assert.equal(productionState(b),'idle');
  assert.equal(assignProduction(s,h.id,'swordsman'),false);
  assert.equal(assignProduction(s,b.id,'toString'),false);
  assert.equal(assignProduction(s,'missing','swordsman'),false);
  assert.ok(assignProduction(s,b.id,'swordsman'));assert.equal(assignProduction(s,b.id,'swordsman'),false);
  assert.equal(productionState(b),'training');assert.equal(b.garrison.length,0);
});
test('first next turn produces ready stored unit, repeats, then pauses at capacity',()=>{
  const {s,b}=setup();assignProduction(s,b.id,'swordsman');
  const first=endTurn(s);assert.equal(first.length,1);assert.equal(s.turn,2);
  const id=first[0].unitId,u=s.units.get(id);
  assert.equal(u.spent,false);assert.equal(u.position,null);assert.deepEqual(b.garrison,[id]);
  assert.ok(reachableCells(s,id).size>0);
  assert.equal([...renderSession(s)].filter(x=>x.sprite==='swordsman').length,1);
  const second=endTurn(s);assert.equal(second.length,1);assert.notEqual(second[0].unitId,id);
  assert.equal(b.garrison.length,2);assert.equal(productionState(b),'paused');
  assert.equal(endTurn(s).length,0);assert.equal(endTurn(s).length,0);
  assert.equal(b.garrison.length,2);assert.equal(s.units.size,3);
});
test('freeing space resumes but never produces until next turn',()=>{
  const {s,b}=setup();assignProduction(s,b.id,'swordsman');endTurn(s);endTurn(s);
  const id=b.garrison[0];assert.ok(moveUnit(s,id,4,3));
  assert.equal(productionState(b),'training');assert.equal(b.garrison.length,1);
  assert.equal(endTurn(s).length,1);assert.equal(b.garrison.length,2);
  assert.equal(productionState(b),'paused');
});
test('external arrivals fill capacity and pause an existing order',()=>{
  const {s,b,u}=setup();assignProduction(s,b.id,'swordsman');endTurn(s);
  assert.ok(moveUnit(s,u.id,4,4));assert.equal(productionState(b),'paused');
  assert.equal(endTurn(s).length,0);assert.equal(b.garrison.length,2);
});
test('cancel training or paused order without removing existing units',()=>{
  const {s,b}=setup();assignProduction(s,b.id,'swordsman');assert.ok(cancelProduction(s,b.id));
  assert.equal(endTurn(s).length,0);assert.equal(productionState(b),'idle');
  assignProduction(s,b.id,'swordsman');endTurn(s);endTurn(s);
  const ids=[...b.garrison];assert.ok(cancelProduction(s,b.id));assert.equal(cancelProduction(s,b.id),false);
  assert.deepEqual(b.garrison,ids);assert.ok(moveUnit(s,ids[0],4,3));
  assert.equal(endTurn(s).length,0);assert.equal(b.garrison.length,1);
});
test('multiple barracks train independently and fresh sessions have no production',()=>{
  const {s,b,b2,map}=setup();assignProduction(s,b.id,'swordsman');assignProduction(s,b2.id,'swordsman');
  const completed=endTurn(s);assert.equal(completed.length,2);assert.notEqual(completed[0].unitId,completed[1].unitId);
  assert.equal(b.garrison.length,1);assert.equal(b2.garrison.length,1);
  const fresh=createSession(map);assert.equal(entityAt(fresh,4,4).entity.production,null);assert.equal(fresh.units.size,1);
});
test('order started in full garrison waits until there is space',()=>{
  const {s,b,u}=setup();assignProduction(s,b.id,'swordsman');endTurn(s);assert.ok(moveUnit(s,u.id,4,4));
  cancelProduction(s,b.id);assert.ok(assignProduction(s,b.id,'swordsman'));
  assert.equal(productionState(b),'paused');assert.equal(endTurn(s).length,0);
  assert.ok(moveUnit(s,b.garrison[0],4,3));assert.equal(endTurn(s).length,1);
});
