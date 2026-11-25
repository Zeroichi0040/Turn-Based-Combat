import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditorMap,applyEdit} from '../src/editor/map.js';
import {createSession,entityAt,moveUnit,reachableCells,endTurn,renderSession} from '../src/game/session.js';
import {selectTile,selectionOverlay} from '../src/game/selection.js';
import {garrisonOf,hasGarrisonSpace,selectStoredUnit} from '../src/game/garrison.js';
const place=(m,category,id,x,y)=>applyEdit(m,{mode:'place',category,id},x,y);
function setup(){
  const map=createEditorMap();
  place(map,'buildings','barracks',4,4);place(map,'buildings','townHall',6,4);
  for(const [x,y] of [[3,4],[4,3],[4,5],[5,4]])place(map,'units','swordsman',x,y);
  const s=createSession(map),at=(x,y)=>entityAt(s,x,y).entity;
  return {s,b:at(4,4),h:at(6,4),a:at(3,4),c:at(4,3),d:at(4,5),e:at(5,4)};
}
test('entry is immediate, consumes movement and removes map occupant',()=>{
  const {s,b,a}=setup();assert.ok(moveUnit(s,a.id,4,4));assert.equal(a.position,null);assert.equal(a.spent,true);
  assert.deepEqual(b.garrison,[a.id]);assert.equal(garrisonOf(s,a.id),b);
  assert.equal(entityAt(s,4,4).kind,'building');assert.equal(entityAt(s,3,4),null);
  assert.equal([...renderSession(s)].filter(o=>o.sprite==='swordsman').length,3);
  assert.equal([...renderSession(s)].find(o=>o.sprite==='barracks').garrisonCount,1);
});
test('barracks accepts a second unit but rejects a third; full building remains traversable',()=>{
  const {s,b,a,c,d}=setup();
  assert.ok(moveUnit(s,a.id,4,4));assert.ok(moveUnit(s,c.id,4,4));
  assert.equal(hasGarrisonSpace(b),false);
  const r=reachableCells(s,d.id);assert.ok(!r.has('4,4'));assert.ok(r.has('4,3'));
  assert.equal(moveUnit(s,d.id,4,4),false);assert.equal(d.spent,false);assert.equal(b.garrison.length,2);
  const result=selectTile(s,{kind:'unit',id:d.id},4,4);assert.equal(result.message,'Garrison is full.');
});
test('spent stored unit can be inspected but not deployed; next turn enables deployment',()=>{
  const {s,b,a}=setup();moveUnit(s,a.id,4,4);
  assert.deepEqual(selectStoredUnit(s,b.id,null,a.id),{selectedId:a.id,deploy:false});
  assert.equal(selectStoredUnit(s,b.id,a.id,a.id).deploy,false);assert.equal(reachableCells(s,a.id).size,0);
  endTurn(s);assert.equal(selectStoredUnit(s,b.id,a.id,a.id).deploy,true);
  assert.equal(selectStoredUnit(s,b.id,a.id,'missing').deploy,false);
});
test('deployment selection is only a projection and cancelling preserves membership',()=>{
  const {s,b,a}=setup();moveUnit(s,a.id,4,4);endTurn(s);
  const selected={kind:'unit',id:a.id},overlay=selectionOverlay(s,selected);
  assert.deepEqual(overlay.deployment,{x:4,y:4,sprite:'swordsman'});assert.ok(overlay.reachable.has('3,4'));
  assert.equal(a.position,null);assert.deepEqual(b.garrison,[a.id]);
  assert.equal(selectTile(s,selected,4,4).selection,null);assert.equal(selectionOverlay(s,null),null);
  assert.deepEqual(b.garrison,[a.id]);assert.equal(a.spent,false);
});
test('valid deployment moves out of garrison once and spends turn',()=>{
  const {s,b,a}=setup();moveUnit(s,a.id,4,4);endTurn(s);
  assert.equal(moveUnit(s,a.id,9,9),false);assert.deepEqual(b.garrison,[a.id]);
  assert.ok(moveUnit(s,a.id,3,4));assert.deepEqual(a.position,{x:3,y:4});
  assert.deepEqual(b.garrison,[]);assert.equal(a.spent,true);assert.equal(garrisonOf(s,a.id),null);
});
test('direct building transfer consumes movement and preserves identity',()=>{
  const {s,b,h,a}=setup();moveUnit(s,a.id,4,4);endTurn(s);
  assert.ok(reachableCells(s,a.id).has('6,4'));assert.ok(moveUnit(s,a.id,6,4));
  assert.deepEqual(b.garrison,[]);assert.deepEqual(h.garrison,[a.id]);assert.equal(a.position,null);assert.equal(a.spent,true);
});
test('town hall has four slots and starts empty in a fresh session',()=>{
  const map=createEditorMap();place(map,'buildings','townHall',4,4);
  for(const [x,y] of [[3,4],[4,3],[4,5],[5,4],[2,4]])place(map,'units','swordsman',x,y);
  const s=createSession(map),h=entityAt(s,4,4).entity;
  const ids=[[3,4],[4,3],[4,5],[5,4],[2,4]].map(([x,y])=>entityAt(s,x,y).entity.id);
  for(const id of ids.slice(0,4))assert.ok(moveUnit(s,id,4,4));
  assert.equal(h.garrison.length,4);assert.equal(hasGarrisonSpace(h),false);assert.equal(moveUnit(s,ids[4],4,4),false);
  assert.equal(entityAt(createSession(map),4,4).entity.garrison.length,0);
});
