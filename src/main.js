import './styles.css';
import {newTerrain} from './core/grid.js';
import {centerCamera,zoomAt} from './rendering/camera.js';
import {drawWorld} from './rendering/world.js';
import {bindCameraKeyboard} from './rendering/keyboard-pan.js';
const canvas=document.querySelector('#world'),ctx=canvas.getContext('2d');
const grass=newTerrain();
const sample=[{sprite:'townHall',x:2,y:3},{sprite:'barracks',x:5,y:3},{sprite:'swordsman',x:4,y:6}];
let camera=null,width=0,height=0,ratio=1,drag=null;
function render(){ctx.setTransform(ratio,0,0,ratio,0,0);drawWorld(ctx,width,height,camera,grass,sample);}
function reset(){camera=centerCamera(width,height);render();}
function resize(){
  const rect=canvas.getBoundingClientRect(),oldW=width,oldH=height;
  width=rect.width;height=rect.height;ratio=window.devicePixelRatio||1;
  canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
  if(!camera){reset();return;}
  camera={...camera,x:camera.x+(width-oldW)/2,y:camera.y+(height-oldH)/2};render();
}
new ResizeObserver(resize).observe(canvas);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==1&&e.button!==2)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);
  drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.classList.add('dragging');
});
canvas.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  camera={...camera,x:camera.x+e.clientX-drag.x,y:camera.y+e.clientY-drag.y};
  drag.x=e.clientX;drag.y=e.clientY;render();
});
function stop(e){if(drag?.id===e.pointerId){drag=null;canvas.classList.remove('dragging');}}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,stop);
canvas.addEventListener('wheel',e=>{
  e.preventDefault();if(!camera)return;
  const rect=canvas.getBoundingClientRect();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?height:1);
  camera=zoomAt(camera,e.clientX-rect.left,e.clientY-rect.top,Math.exp(-delta*.001));render();
},{passive:false});
bindCameraKeyboard({
  move(dx,dy){if(camera){camera={...camera,x:camera.x+dx,y:camera.y+dy};render();}},
  reset(){if(camera)reset();}
});
document.querySelector('#reset').addEventListener('click',e=>{reset();e.currentTarget.blur();});
resize();
