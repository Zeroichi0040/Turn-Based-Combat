import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditorMap,applyEdit,renderOccupants} from '../src/editor/map.js';
import {createStroke,strokeCells} from '../src/editor/stroke.js';
import {key} from '../src/core/grid.js';
const place=(category,id)=>({mode:'place',category,id});
const grass=place('tiles','grass'),hall=place('buildings','townHall'),barracks=place('buildings','barracks'),unit=place('units','swordsman'),erase={mode:'erase'};
test('new editor map is empty of occupants with 100 grass cells',()=>{
  const m=createEditorMap();assert.equal(m.grass.size,100);assert.equal(m.occupants.size,0);assert.equal(m.revision,0);
});
test('grass expands only cardinally; negative bounds follow edits',()=>{
  const m=createEditorMap();assert.equal(applyEdit(m,grass,-1,-1).changed,false);
  assert.equal(applyEdit(m,grass,-1,0).changed,true);assert.equal(m.bounds.minX,-1);
  assert.equal(applyEdit(m,erase,-1,0).changed,true);assert.equal(m.bounds.minX,0);
});
test('occupants need grass; same category replaces and cross-category rejects',()=>{
  const m=createEditorMap();assert.equal(applyEdit(m,hall,-1,0).changed,false);
  assert.ok(applyEdit(m,hall,1,1).changed);assert.ok(applyEdit(m,barracks,1,1).changed);
  assert.equal(applyEdit(m,unit,1,1).changed,false);assert.equal(m.occupants.size,1);
  assert.deepEqual([...renderOccupants(m)],[{x:1,y:1,sprite:'barracks'}]);
});
test('universal eraser removes one layer; terrain placement does not erase occupants',()=>{
  const m=createEditorMap();applyEdit(m,unit,0,0);
  assert.equal(applyEdit(m,grass,0,0).changed,false);assert.ok(m.occupants.has('0,0'));
  assert.ok(applyEdit(m,erase,0,0).changed);assert.ok(m.grass.has('0,0'));
  assert.ok(applyEdit(m,erase,0,0).changed);assert.ok(!m.grass.has('0,0'));
});
test('disconnecting terrain and deleting last grass tile are rejected atomically',()=>{
  const m=createEditorMap();applyEdit(m,grass,10,0);applyEdit(m,grass,11,0);
  const revision=m.revision;assert.equal(applyEdit(m,erase,10,0).changed,false);assert.equal(m.revision,revision);
  assert.ok(m.grass.has('10,0'));assert.ok(m.grass.has('11,0'));
  m.grass=new Set(['0,0']);assert.equal(applyEdit(m,erase,0,0).changed,false);
});
test('eraser removes one layer per entry and does not repeat while stationary',()=>{
  const m=createEditorMap();applyEdit(m,unit,0,0);
  const stroke=createStroke(m,erase);
  stroke.visit({x:0,y:0});stroke.visit({x:0,y:0});
  assert.ok(m.grass.has('0,0'));assert.ok(!m.occupants.has('0,0'));
  stroke.visit({x:1,y:0});stroke.visit({x:0,y:0});
  assert.ok(!m.grass.has('0,0'));assert.ok(!m.grass.has('1,0'));
});
test('fast erase return pass removes terrain below occupants but keeps connectivity',()=>{
  const m=createEditorMap();
  for(let x=0;x<4;x++)applyEdit(m,unit,x,0);
  const stroke=createStroke(m,erase);
  stroke.visit({x:0,y:0});stroke.visit({x:3,y:0});
  assert.equal(m.occupants.size,0);assert.equal(m.grass.size,100);
  stroke.visit({x:0,y:0});
  assert.equal(m.grass.size,97);assert.ok(m.grass.has('3,0'));
});
test('breaking a stroke path prevents interpolation across an obstructed area',()=>{
  const m=createEditorMap(),stroke=createStroke(m,erase);
  stroke.visit({x:0,y:0});stroke.breakPath();stroke.visit({x:4,y:0});
  assert.equal(m.grass.size,98);assert.ok(m.grass.has('2,0'));
});
test('fast painting fills cardinal path between event samples',()=>{
  const m=createEditorMap();const stroke=createStroke(m,grass);
  stroke.visit({x:9,y:9});stroke.visit({x:13,y:12});
  const path=[...strokeCells({x:9,y:9},{x:13,y:12})];
  assert.equal(path.length,8);
  for(let i=1;i<path.length;i++)assert.equal(Math.abs(path[i].x-path[i-1].x)+Math.abs(path[i].y-path[i-1].y),1);
  assert.ok(path.every(p=>m.grass.has(key(p.x,p.y))));
});
test('invalid tools do not mutate editor state',()=>{
  const m=createEditorMap();assert.equal(applyEdit(m,place('buildings','toString'),0,0).changed,false);
  assert.equal(applyEdit(m,grass,NaN,0).changed,false);assert.equal(m.revision,0);
});
