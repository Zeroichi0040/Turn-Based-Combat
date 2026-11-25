import {TILE_SIZE} from '../content/definitions.js';
import {point} from '../core/grid.js';
import {worldToScreen} from './camera.js';
import {sprite} from './sprites.js';
import {grassVariant,terrainEdges} from './terrain-art.js';
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
    if(id==='grass'){
      ctx.drawImage(sprite(id,grassVariant(x,y),terrainEdges(grass,x,y)),left,top,w,h);
      ctx.strokeStyle='#263b2626';ctx.strokeRect(left+.5,top+.5,w-1,h-1);
      return;
    }
    ctx.save();
    if(spent)ctx.filter='grayscale(1) brightness(0.42)';
    ctx.drawImage(sprite(id),left,top,w,h);
    ctx.restore();
  }
  function highlight(x,y,fill,stroke){
    const r=rect(x,y);if(!r)return;
    const {left,top,w,h}=r;
    if(fill){ctx.fillStyle=fill;ctx.fillRect(left,top,w,h);}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.strokeRect(left+1,top+1,Math.max(1,w-2),Math.max(1,h-2));ctx.lineWidth=1;}
  }
  for(const k of grass){const p=point(k);draw('grass',p.x,p.y);}
  for(const k of overlay?.reachable??[]){const p=point(k);highlight(p.x,p.y,'#c7cf7040','#b8cc81');}
  const counts=[];
  for(const o of occupants){
    if(o.representative&&overlay?.deployment?.x===o.x&&overlay.deployment.y===o.y)continue;
    draw(o.sprite,o.x,o.y,o.spent);if(Number.isInteger(o.garrisonCount)&&o.garrisonCount>0)counts.push(o);}
  if(overlay?.deployment){const d=overlay.deployment;draw(d.sprite,d.x,d.y);}
  // Count badges are drawn last so a deployment preview never obscures them.
  for(const o of counts){
    const r=rect(o.x,o.y);if(!r)continue;
    const font=Math.max(9,Math.min(14,Math.floor(size*.28))),label=String(o.garrisonCount);
    ctx.font='bold '+font+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    const w=Math.ceil(ctx.measureText(label).width)+6,h=font+4;
    const x=r.left+r.w-w-1,y=r.top+1;
    ctx.fillStyle='#171c19';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#a58a53';ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.fillStyle='#f1e0ad';ctx.fillText(label,x+w/2,y+h/2);
  }
  if(overlay?.selected){
    const {x,y}=overlay.selected,r=rect(x,y);
    if(r){
      const {left,top,w,h}=r,l=Math.max(3,Math.floor(Math.min(w,h)*.23));
      ctx.fillStyle='#f6d586';
      for(const [a,b,dx,dy] of [[left+1,top+1,1,1],[left+w-2,top+1,-1,1],[left+1,top+h-2,1,-1],[left+w-2,top+h-2,-1,-1]]){
        ctx.fillRect(dx>0?a:a-l+1,b,l,2);ctx.fillRect(a,dy>0?b:b-l+1,2,l);
      }
    }
  }
  if(overlay?.path?.length>1){
    const path=overlay.path.map(p=>worldToScreen(camera,(p.x+.5)*TILE_SIZE,(p.y+.5)*TILE_SIZE));
    const destination=overlay.path.at(-1);
    highlight(destination.x,destination.y,'#ffffff35','#fff');
    const a=path.at(-2),b=path.at(-1),length=Math.hypot(b.x-a.x,b.y-a.y);
    const dx=(b.x-a.x)/length,dy=(b.y-a.y)/length,head=Math.max(5,Math.min(15,size*.23));
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(path[0].x,path[0].y);
    for(const p of path.slice(1))ctx.lineTo(p.x,p.y);
    ctx.moveTo(b.x-dx*head-dy*head*.65,b.y-dy*head+dx*head*.65);
    ctx.lineTo(b.x,b.y);ctx.lineTo(b.x-dx*head+dy*head*.65,b.y-dy*head-dx*head*.65);
    ctx.strokeStyle='#192019';ctx.lineWidth=5;ctx.stroke();
    ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.stroke();ctx.restore();
  }
  if(cursor)highlight(cursor.x,cursor.y,null,cursor.mode==='erase'?'#db795e':'#e7cf82');
}
