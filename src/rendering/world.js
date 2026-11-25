import {TILE_SIZE} from '../content/definitions.js';
import {point} from '../core/grid.js';
import {worldToScreen} from './camera.js';
import {sprite} from './sprites.js';
export function drawWorld(ctx,width,height,camera,grass,occupants=[],cursor=null,overlay=null){
  ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
  ctx.lineWidth=1;
  const size=TILE_SIZE*camera.zoom;
  function rect(x,y){
    const p=worldToScreen(camera,x*TILE_SIZE,y*TILE_SIZE);
    if(p.x+size<=0||p.y+size<=0||p.x>=width||p.y>=height)return null;
    const left=Math.round(p.x),top=Math.round(p.y);
    return {left,top,w:Math.round(p.x+size)-left,h:Math.round(p.y+size)-top};
  }
  function draw(id,x,y,spent=false){
    const r=rect(x,y);if(!r)return;
    const {left,top,w,h}=r;
    ctx.save();
    if(spent)ctx.filter='grayscale(1) brightness(0.42)';
    ctx.drawImage(sprite(id),left,top,w,h);
    ctx.restore();
    if(id==='grass'){ctx.strokeStyle='#263b2638';ctx.strokeRect(left+.5,top+.5,w-1,h-1);}
  }
  function highlight(x,y,fill,stroke){
    const r=rect(x,y);if(!r)return;
    const {left,top,w,h}=r;
    if(fill){ctx.fillStyle=fill;ctx.fillRect(left,top,w,h);}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.strokeRect(left+1,top+1,Math.max(1,w-2),Math.max(1,h-2));ctx.lineWidth=1;}
  }
  for(const k of grass){const p=point(k);draw('grass',p.x,p.y);}
  for(const k of overlay?.reachable??[]){const p=point(k);highlight(p.x,p.y,'#dfd77555','#d8d77b');}
  for(const o of occupants)draw(o.sprite,o.x,o.y,o.spent);
  if(overlay?.selected){const {x,y}=overlay.selected;highlight(x,y,null,'#f7e1a0');}
  if(cursor)highlight(cursor.x,cursor.y,null,cursor.mode==='erase'?'#db795e':'#e7cf82');
}
