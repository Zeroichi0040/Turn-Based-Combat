import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditorMap,applyEdit} from '../src/editor/map.js';
import {createSession,moveUnit,reachablePaths,endTurn} from '../src/game/session.js';
import {assignProduction,cancelProduction} from '../src/game/production.js';
import {serializeMap} from '../src/storage/map-store.js';
import {key,point} from '../src/core/grid.js';
import {buildings,units} from '../src/content/definitions.js';

function assertInvariants(s){
 const allIds=new Set(),positions=new Set(),stored=new Set();
 for(const [id,b] of s.buildings){
  assert.equal(id,b.id);assert.ok(!allIds.has(id));allIds.add(id);
  const p=key(b.position.x,b.position.y);
  assert.ok(s.grass.has(p));assert.ok(!positions.has(p));positions.add(p);
  assert.ok(b.garrison.length<=buildings[b.type].garrisonCapacity);
  if(b.displayedUnitId!==null)assert.ok(b.garrison.includes(b.displayedUnitId));
  if(b.production){
   assert.ok(buildings[b.type].trainable.includes(b.production.unitType));
   assert.ok(b.production.remaining>=1&&b.production.remaining<=units[b.production.unitType].trainingTurns);
  }
  for(const unitId of b.garrison){
   assert.ok(!stored.has(unitId));stored.add(unitId);
   assert.equal(s.units.get(unitId)?.position,null);
  }
 }
 for(const [id,u] of s.units){
  assert.equal(id,u.id);assert.ok(!allIds.has(id));allIds.add(id);
  assert.equal(typeof u.spent,'boolean');
  assert.equal(u.position===null,stored.has(id));
  if(u.position){
   const p=key(u.position.x,u.position.y);
   assert.ok(s.grass.has(p));assert.ok(!positions.has(p));positions.add(p);
  }
 }
}
test('mixed production, cancellation, transfers and movement preserve location and capacity invariants',()=>{
 const m=createEditorMap();
 for(const [id,x,y] of [['barracks',3,3],['barracks',5,3],['townHall',4,5]])
  applyEdit(m,{mode:'place',category:'buildings',id},x,y);
 for(const [x,y] of [[2,3],[3,4],[5,4],[4,4]])applyEdit(m,{mode:'place',category:'units',id:'swordsman'},x,y);
 const snapshot=serializeMap(m),s=createSession(m);
 let seed=20261125;
 const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 let moves=0,trained=0;
 for(let turn=0;turn<100;turn++){
  for(const b of s.buildings.values()){
   if(random(5)===0)cancelProduction(s,b.id);
   else if(!b.production)assignProduction(s,b.id,'swordsman');
  }
  for(const u of [...s.units.values()]){
   const paths=[...reachablePaths(s,u.id).entries()];
   if(paths.length&&random(4)!==0){
    const [k,path]=paths[random(paths.length)];
    assert.ok(path.length-1<=units[u.type].movement);
    for(let i=1;i<path.length;i++){
     assert.equal(Math.abs(path[i].x-path[i-1].x)+Math.abs(path[i].y-path[i-1].y),1);
     assert.ok(s.grass.has(key(path[i].x,path[i].y)));
    }
    const {x,y}=point(k);
    assert.ok(moveUnit(s,u.id,x,y));moves++;
    assert.ok(u.spent);assert.equal(reachablePaths(s,u.id).size,0);
   }
   assertInvariants(s);
  }
  const completed=endTurn(s);trained+=completed.length;
  for(const event of completed)assert.equal(s.units.get(event.unitId).spent,false);
  assertInvariants(s);
 }
 assert.ok(moves>0);assert.ok(trained>0);assert.equal(s.turn,101);
 assert.deepEqual(serializeMap(m),snapshot);
 assertInvariants(createSession(m));
});
