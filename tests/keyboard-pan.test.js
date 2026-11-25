import test from 'node:test';
import assert from 'node:assert/strict';
import {createPanKeys, bindCameraKeyboard, PAN_SPEED} from '../src/rendering/keyboard-pan.js';

test('diagonal motion has the same speed as cardinal motion', () => {
  const keys = createPanKeys();
  keys.press('w'); keys.press('D');
  const {x,y}=keys.vector();
  assert.ok(x<0 && y>0);
  assert.ok(Math.abs(Math.hypot(x,y)-1)<1e-12);
});
test('latest opposing key wins independently on each axis; repeat does not reorder', () => {
  const keys=createPanKeys();
  keys.press('w'); keys.press('s'); keys.press('a'); keys.press('d');
  assert.ok(!keys.press('w')); assert.ok(!keys.press('a'));
  assert.ok(keys.vector().x<0 && keys.vector().y<0);
  keys.release('s'); assert.ok(keys.vector().x<0 && keys.vector().y>0);
  keys.release('d'); assert.ok(keys.vector().x>0 && keys.vector().y>0);
  keys.release('w'); keys.release('a');
  assert.deepEqual(keys.vector(),{x:0,y:0}); assert.equal(keys.active,false);
});
test('arrow and WASD aliases remain separate held keys', () => {
  const keys=createPanKeys();
  keys.press('w'); keys.press('arrowup'); keys.press('s');
  keys.release('w'); assert.equal(keys.vector().y,-1);
  keys.release('s'); assert.equal(keys.vector().y,1);
  keys.clear(); assert.equal(keys.active,false);
});

function fixture() {
  const win=new EventTarget(),doc=new EventTarget(),frames=new Map();
  let now=0,id=0,x=0,y=0,resets=0;
  win.performance={now:()=>now};
  win.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
  win.cancelAnimationFrame=key=>frames.delete(key);
  const dispose=bindCameraKeyboard({win,doc,move(dx,dy){x+=dx;y+=dy;},reset(){resets++;}});
  const key=(type,key,extra={})=>{
    const event=Object.assign(new Event(type,{cancelable:true}),{key,repeat:false,...extra});
    win.dispatchEvent(event);return event;
  };
  function frame(ms=16) {
    now+=ms;
    const pending=[...frames.values()];frames.clear();
    for(const fn of pending)fn(now);
  }
  return {win,doc,key,frame,frames,dispose,elapse(ms){now+=ms;},get x(){return x;},get y(){return y;},get resets(){return resets;}};
}
test('motion starts on next display frame, no repeat needed, and stops on release',()=>{
  const f=fixture();
  assert.ok(f.key('keydown','w').defaultPrevented);
  f.frame(); assert.equal(f.y,PAN_SPEED*.016);
  f.frame(); assert.equal(f.y,PAN_SPEED*.032);
  f.key('keyup','w'); assert.equal(f.frames.size,0);
  f.frame(); assert.equal(f.y,PAN_SPEED*.032);
  f.dispose();
});
test('actual key events combine axes, resolve opposites, and restore earlier held key',()=>{
  const f=fixture();
  f.key('keydown','w'); f.key('keydown','d'); f.frame();
  assert.ok(f.x<0 && f.y>0);
  f.key('keydown','s'); f.key('keydown','w',{repeat:true});
  const y=f.y; f.frame(); assert.ok(f.y<y);
  f.key('keyup','s'); const y2=f.y; f.frame(); assert.ok(f.y>y2);
  f.dispose(); assert.equal(f.frames.size,0);
});
test('fast tap before first frame still pans for the held duration',()=>{
  const f=fixture();
  f.key('keydown','w'); f.elapse(8); f.key('keyup','w');
  assert.equal(f.y,PAN_SPEED*.008); assert.equal(f.frames.size,0);
  f.dispose();
});
test('blur and hidden page clear held keys; repeat cannot restart movement',()=>{
  const f=fixture();
  f.key('keydown','w'); f.frame(); f.win.dispatchEvent(new Event('blur'));
  assert.equal(f.frames.size,0);
  f.key('keydown','w',{repeat:true}); f.frame();
  assert.equal(f.y,PAN_SPEED*.016);
  f.key('keydown','d'); f.doc.hidden=true; f.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.frames.size,0); f.dispose();
});
test('focus on editable controls and modifiers stop navigation; Home resets once',()=>{
  const f=fixture();
  f.key('keydown','a');
  const event=new Event('focusin');
  Object.defineProperty(event,'target',{value:{isContentEditable:true}});
  f.doc.dispatchEvent(event); assert.equal(f.frames.size,0);
  f.key('keydown','w'); f.key('keydown','Control',{ctrlKey:true}); assert.equal(f.frames.size,0);
  f.key('keydown','Home'); f.key('keydown','Home',{repeat:true}); assert.equal(f.resets,1);
  f.dispose();
});
