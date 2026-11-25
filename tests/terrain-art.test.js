import test from 'node:test';
import assert from 'node:assert/strict';
import {grassVariant,terrainEdges,GRASS_VARIANTS,EDGE} from '../src/rendering/terrain-art.js';
import {newTerrain} from '../src/core/grid.js';
test('grass variants are stable and bounded across signed coordinates',()=>{
 const variants=new Set();
 for(let y=-20;y<=20;y++)for(let x=-20;x<=20;x++){
  const v=grassVariant(x,y);assert.equal(v,grassVariant(x,y));assert.ok(Number.isInteger(v)&&v>=0&&v<GRASS_VARIANTS);variants.add(v);
 }
 assert.equal(variants.size,GRASS_VARIANTS);
});
test('exposed terrain edge mask responds to edits without changing topology',()=>{
 const g=newTerrain(3);
 assert.equal(terrainEdges(g,1,1),0);
 assert.equal(terrainEdges(g,0,0),EDGE.north|EDGE.west);
 assert.equal(terrainEdges(g,2,2),EDGE.east|EDGE.south);
 g.delete('1,0');assert.equal(terrainEdges(g,1,1),EDGE.north);
 g.add('1,0');assert.equal(terrainEdges(g,1,1),0);
 assert.equal(terrainEdges(new Set(['-1,-1']),-1,-1),15);
});
