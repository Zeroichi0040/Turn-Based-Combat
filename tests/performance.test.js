import test from 'node:test';
import assert from 'node:assert/strict';
import {key,point,cardinal,newTerrain,canRemoveGrass} from '../src/core/grid.js';
import {createRenderScheduler} from '../src/rendering/render-scheduler.js';
import {createEditorMap,applyEdit} from '../src/editor/map.js';
import {createSession,entityAt,reachablePaths,moveUnit} from '../src/game/session.js';
function oracle(g,x,y){
 const rest=new Set(g);if(!rest.delete(key(x,y))||!rest.size)return false;
 const first=rest.values().next().value,queue=[first];rest.delete(first);
 for(let i=0;i<queue.length;i++){const p=point(queue[i]);for(const [a,b] of cardinal(p.x,p.y)){const k=key(a,b);if(rest.delete(k))queue.push(k);}}
 return rest.size===0;
}
test('early connectivity check matches full flood fill for varied connected maps',()=>{
 let seed=12345;const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed>>>8)%n;};
 for(let j=0;j<40;j++){
  const g=new Set(['0,0']);
  for(let i=0;i<90;i++){const p=point([...g][rand(g.size)]),[x,y]=cardinal(p.x,p.y)[rand(4)];g.add(key(x,y));}
  for(const k of g){const {x,y}=point(k);assert.equal(canRemoveGrass(g,x,y),oracle(g,x,y));}
 }
});
test('corner erase does not scan a large connected map',()=>{
 class Counted extends Set{checks=0;has(k){this.checks++;return super.has(k);}}
 const g=new Counted(newTerrain(200));assert.ok(canRemoveGrass(g,0,0));assert.ok(g.checks<30,g.checks);
});
test('pathfinding only needs indexed local occupancy',()=>{
 const m=createEditorMap();applyEdit(m,{mode:'place',category:'units',id:'swordsman'},4,4);
 const s=createSession(m),id=entityAt(s,4,4).entity.id;
 s.units.values=()=>{throw Error('global unit scan');};s.buildings.values=()=>{throw Error('global building scan');};
 assert.equal(reachablePaths(s,id).size,12);assert.ok(moveUnit(s,id,5,4));assert.equal(entityAt(s,4,4),null);assert.equal(entityAt(s,5,4).entity.id,id);
});
test('render requests coalesce and cancellation prevents stale draws',()=>{
 let draws=0,id=0;const callbacks=new Map();
 const clock={requestAnimationFrame(fn){callbacks.set(++id,fn);return id;},cancelAnimationFrame(i){callbacks.delete(i);}};
 const scheduler=createRenderScheduler(()=>draws++,clock);
 scheduler.request();scheduler.request();assert.equal(callbacks.size,1);
 const [i,fn]=[...callbacks][0];callbacks.delete(i);fn();assert.equal(draws,1);
 scheduler.request();scheduler.cancel();assert.equal(callbacks.size,0);
});
