import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleTerrain} from '../src/rendering/visible-terrain.js';
import {newTerrain,key,point,terrainBounds} from '../src/core/grid.js';
import {createEditorMap,applyEdit} from '../src/editor/map.js';
function oracle(grass,c,w,h){
 const size=32*c.zoom;
 return [...grass].map(point).filter(({x,y})=>x*size+c.x+size>0&&y*size+c.y+size>0&&x*size+c.x<w&&y*size+c.y<h).map(p=>key(p.x,p.y)).sort();
}
test('visible terrain matches intersection checks at all zooms and signed positions',()=>{
 const grass=new Set([...newTerrain(30),'-1,0','-2,-2','0,-1','1000000,1000000']);
 for(const zoom of [.5,1,1.27,2,4])for(const [x,y] of [[0,0],[32,-64],[-183.25,19.5],[-32000000,-32000000]]){
  const c={x,y,zoom};
  assert.deepEqual([...visibleTerrain(grass,c,256,192)].map(p=>key(p.x,p.y)).sort(),oracle(grass,c,256,192));
 }
});
test('large terrain uses bounded viewport membership checks instead of full scans',()=>{
 class CountedSet extends Set{
  checks=0;
  has(k){this.checks++;return super.has(k);}
  [Symbol.iterator](){throw Error('Unexpected full terrain scan');}
 }
 const g=new CountedSet(newTerrain(200));
 assert.equal([...visibleTerrain(g,{x:0,y:0,zoom:2},640,480)].length,80);
 assert.equal(g.checks,80);
});
test('sparse wide view enumerates terrain rather than empty world coordinates',()=>{
 const g=new Set(['0,0','1000000,1000000']);
 assert.deepEqual([...visibleTerrain(g,{x:0,y:0,zoom:.5},1280,720)],[{x:0,y:0}]);
});
test('incremental editor bounds agree with full recomputation after expansion and erasure',()=>{
 const m=createEditorMap(),place={mode:'place',category:'tiles',id:'grass'},erase={mode:'erase'};
 for(const [tool,x,y] of [[place,-1,0],[place,-2,0],[place,10,9],[place,0,-1],[erase,4,4],[erase,-2,0],[erase,-1,0],[erase,10,9],[erase,0,-1]]){
  assert.equal(applyEdit(m,tool,x,y).changed,true);assert.deepEqual(m.bounds,terrainBounds(m.grass));
 }
});
