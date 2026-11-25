import test from 'node:test';
import assert from 'node:assert/strict';
import {key,newTerrain,canAddGrass,canRemoveGrass} from '../src/core/grid.js';
test('new terrain contains 100 unique tiles',()=>{const g=newTerrain();assert.equal(g.size,100);assert.ok(g.has('0,0'));assert.ok(g.has('9,9'));});
test('only cardinally adjacent grass can expand, including negative coordinates',()=>{const g=newTerrain(1);assert.ok(canAddGrass(g,-1,0));assert.ok(!canAddGrass(g,-1,-1));assert.ok(!canAddGrass(g,0,0));assert.ok(!canAddGrass(g,2,0));});
test('removing a bridge would disconnect terrain',()=>{const g=newTerrain();g.add(key(10,0));g.add(key(11,0));assert.equal(canRemoveGrass(g,10,0),false);assert.equal(canRemoveGrass(g,11,0),true);assert.equal(g.size,102);});
test('alternate paths permit removal; last tile is protected',()=>{assert.ok(canRemoveGrass(newTerrain(2),0,0));assert.ok(!canRemoveGrass(newTerrain(1),0,0));assert.ok(!canRemoveGrass(newTerrain(1),1,0));});
