import test from 'node:test';
import assert from 'node:assert/strict';
import {centerCameraOnBounds,clampCamera} from '../src/rendering/camera.js';
test('reset camera centers asymmetric maps with negative coordinates',()=>{
  const b={minX:-12,minY:4,maxX:7,maxY:8};
  const c=centerCameraOnBounds(800,600,b);
  assert.equal(c.x+(-12+10)*32*c.zoom,400);
  assert.equal(c.y+(4+2.5)*32*c.zoom,300);
  assert.deepEqual(clampCamera(c,800,600,b),c);
});
