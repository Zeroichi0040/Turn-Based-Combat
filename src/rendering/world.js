import {TILE_SIZE} from '../content/definitions.js';
import {point} from '../core/grid.js';
import {worldToScreen} from './camera.js';
import {sprite} from './sprites.js';
export function drawWorld(ctx,width,height,camera,grass,occupants=[]){
  ctx.fillStyle='#101210';ctx.fillRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
  const size=TILE_SIZE*camera.zoom;
  function draw(id,x,y){
    const p=worldToScreen(camera,x*TILE_SIZE,y*TILE_SIZE);
    if(p.x+size<=0||p.y+size<=0||p.x>=width||p.y>=height)return;
    const left=Math.round(p.x),top=Math.round(p.y);
    const w=Math.round(p.x+size)-left,h=Math.round(p.y+size)-top;
    ctx.drawImage(sprite(id),left,top,w,h);
    if(id==='grass'){ctx.strokeStyle='#263b2638';ctx.strokeRect(left+.5,top+.5,w-1,h-1);}
  }
  for(const k of grass){const p=point(k);draw('grass',p.x,p.y);}
  for(const o of occupants)draw(o.sprite,o.x,o.y);
}
