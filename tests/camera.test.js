import test from 'node:test';
import assert from 'node:assert/strict';
import {screenToTile,screenToWorld,worldToScreen,zoomAt,createCamera,centerCamera,MAX_ZOOM,MIN_ZOOM,clampCamera} from '../src/rendering/camera.js';
test('camera inverse transforms',()=>{const c={x:17,y:-30,zoom:1.5};const s=worldToScreen(c,-32,96);assert.deepEqual(screenToWorld(c,s.x,s.y),{x:-32,y:96});});
test('negative world positions use floor',()=>{assert.deepEqual(screenToTile(createCamera(),-1,-65),{x:-1,y:-2});});
test('zoom anchors cursor and clamps limits',()=>{const c=createCamera(),p=screenToWorld(c,83,47);const z=zoomAt(c,83,47,100);assert.equal(z.zoom,MAX_ZOOM);assert.deepEqual(screenToWorld(z,83,47),p);assert.equal(zoomAt(c,0,0,.001).zoom,MIN_ZOOM);});
test('camera centers initial map',()=>{const c=centerCamera(800,600);assert.equal(c.x+160*c.zoom,400);assert.equal(c.y+160*c.zoom,300);});

import {newTerrain,terrainBounds,key} from '../src/core/grid.js';
test('camera cannot pan outside padded terrain envelope on either axis',()=>{
  const b=terrainBounds(newTerrain()),c={x:1e6,y:-1e6,zoom:2};
  assert.deepEqual(clampCamera(c,600,500,b),{x:192,y:-332,zoom:2});
  assert.deepEqual(clampCamera({...c,x:-1e6,y:1e6},600,500,b),{x:-232,y:192,zoom:2});
});
test('axes center independently when padded map fits viewport',()=>{
  const b=terrainBounds(newTerrain()),c={x:-999,y:999,zoom:1};
  assert.deepEqual(clampCamera(c,800,400,b),{x:240,y:96,zoom:1});
  assert.deepEqual(clampCamera(c,800,600,b),{x:240,y:140,zoom:1});
});
test('bounds track negative-coordinate expansion and subsequent erasure',()=>{
  const g=newTerrain(1);g.add(key(-1,0));g.add(key(-2,0));
  const c={x:999,y:0,zoom:4};
  assert.equal(clampCamera(c,300,300,terrainBounds(g)).x,640);
  g.delete(key(-2,0));
  assert.equal(clampCamera(c,300,300,terrainBounds(g)).x,512);
});
test('zoom and resize remain bounded and valid positions are unchanged',()=>{
  const b=terrainBounds(newTerrain()),c={x:-100,y:-100,zoom:2};
  assert.deepEqual(clampCamera(c,600,500,b),c);
  const z=clampCamera(zoomAt(c,0,0,.01),800,600,b);
  assert.deepEqual(z,{x:320,y:220,zoom:.5});
  assert.deepEqual(clampCamera(z,1000,800,b),{x:420,y:320,zoom:.5});
});
test('empty terrain has no bounds',()=>{const c=createCamera();assert.equal(terrainBounds(new Set()),null);assert.equal(clampCamera(c,100,100,null),c);});
