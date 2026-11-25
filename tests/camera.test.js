import test from 'node:test';
import assert from 'node:assert/strict';
import {screenToTile,screenToWorld,worldToScreen,zoomAt,createCamera,centerCamera,MAX_ZOOM,MIN_ZOOM} from '../src/rendering/camera.js';
test('camera inverse transforms',()=>{const c={x:17,y:-30,zoom:1.5};const s=worldToScreen(c,-32,96);assert.deepEqual(screenToWorld(c,s.x,s.y),{x:-32,y:96});});
test('negative world positions use floor',()=>{assert.deepEqual(screenToTile(createCamera(),-1,-65),{x:-1,y:-2});});
test('zoom anchors cursor and clamps limits',()=>{const c=createCamera(),p=screenToWorld(c,83,47);const z=zoomAt(c,83,47,100);assert.equal(z.zoom,MAX_ZOOM);assert.deepEqual(screenToWorld(z,83,47),p);assert.equal(zoomAt(c,0,0,.001).zoom,MIN_ZOOM);});
test('camera centers initial map',()=>{const c=centerCamera(800,600);assert.equal(c.x+160*c.zoom,400);assert.equal(c.y+160*c.zoom,300);});
