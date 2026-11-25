import {TILE_SIZE} from '../content/definitions.js';
import {GRASS_VARIANTS,EDGE} from './terrain-art.js';

const cache=new Map();
const P=Object.freeze({
  ink:'#292b31',shadow:'#3e4141',steelDark:'#525d66',steel:'#8b9ba4',steelLight:'#c2cdd0',shine:'#e5e5d8',
  oak:'#75503a',oakDark:'#49382d',oakLight:'#b28b59',gold:'#d3ab62',
  blueDark:'#304966',blue:'#476d90',blueLight:'#78a1b0',
  redDark:'#693a32',red:'#a45942',redLight:'#c97c55',
  stoneDark:'#666b65',stone:'#93978a',stoneLight:'#c5c3ac',mortar:'#77796c',
  plaster:'#d0bc8b',plasterShade:'#a88e65',grass:'#648649',
});

function surface(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=TILE_SIZE;
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  return {canvas,c,r(color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}};
}
function shadow(r,x,y,w){
  r('#192b2455',x+1,y-1,w-2,4);r('#192b2470',x,y,w,2);r('#192b2435',x+3,y+3,w-6,1);
}
function grass(r,variant,edges){
  r(P.grass,0,0,32,32);
  let seed=(0xa46d+Math.imul(variant+1,0x9e3779b1))>>>0;
  const random=n=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)%n;};
  // Low-contrast clusters instead of repeated high-contrast tufts.
  for(let i=0;i<28;i++){
    const x=random(30),y=random(30),color=['#608147','#698b4c','#6e8d50','#5d7d44'][random(4)];
    r(color,x,y,1+random(3),1);
  }
  for(let i=0;i<4;i++){
    const x=3+random(25),y=4+random(24);
    r('#506f3c',x,y,1,3);r('#789653',x+1,y+1,1,2);
    r('#6d8e4c',x-1,y+2,1,1);
  }
  if(variant===2||variant===6){const x=5+random(22),y=5+random(22);r('#9caa72',x,y,2,1);r('#a7a48a',x+1,y-1,1,1);}
  // Darken only exposed land edges; never paint outside the cell.
  const rim='#415d35',mid='#55753f',light='#789450';
  if(edges&EDGE.north){r(rim,0,0,32,1);r(light,1,1,30,1);}
  if(edges&EDGE.west){r(rim,0,0,1,32);r(mid,1,1,1,30);}
  if(edges&EDGE.east){r(mid,30,0,1,32);r(rim,31,0,1,32);}
  if(edges&EDGE.south){r(mid,0,29,32,1);r(rim,0,30,32,2);}
}
function townHall(r){
  shadow(r,2,27,28);
  // Stone foundation and timber-framed plaster front, shaded east wall.
  r(P.ink,4,13,25,15);r(P.stoneDark,4,26,25,3);r(P.stone,5,25,23,2);
  r(P.plaster,5,13,19,12);r(P.plasterShade,24,14,4,12);
  r(P.oakDark,5,13,2,13);r(P.oakDark,22,13,2,13);r(P.oak,7,16,15,1);
  r(P.oakLight,7,17,15,1);r(P.oakDark,5,24,19,2);
  // Stepped gabled terracotta roof with directional tile shading.
  for(let i=0;i<10;i++){
    const x=14-i,y=3+i,w=3+2*i;
    r(P.ink,x-1,y,w+2,2);r(P.red,x,y,w,2);
    r(P.redLight,x,y,Math.max(1,Math.floor(w*.58)),1);
    r(P.redDark,x+Math.floor(w*.68),y+1,Math.ceil(w*.32),1);
    if(i>2&&i%2===0)for(let k=x+3;k<x+w-1;k+=4)r(P.redDark,k,y,1,1);
  }
  r(P.ink,2,13,28,2);r(P.redDark,3,12,26,2);r(P.redLight,4,12,19,1);
  // Tall doorway, blue civic pennant and two windows.
  r(P.oakDark,12,19,7,7);r(P.oakDark,13,18,5,1);r(P.oak,13,20,5,6);
  r(P.oakLight,14,20,1,5);r(P.gold,17,23,1,1);
  for(const x of [8,19]){r(P.oakDark,x,19,3,4);r(P.blueDark,x+1,19,1,3);r(P.blueLight,x+1,20,1,1);r(P.oakLight,x-1,23,5,1);}
  r(P.ink,12,27,8,2);r(P.stoneLight,13,27,6,1);
  r(P.oakDark,15,0,1,5);r(P.blueDark,16,0,6,4);r(P.blue,16,0,5,3);r(P.gold,17,1,2,1);
}
function barracks(r){
  shadow(r,1,27,30);
  // Compact fortified stone block with visible battlements and side wall.
  r(P.ink,2,9,28,20);r(P.stone,3,10,23,17);r(P.stoneDark,26,10,3,17);
  r(P.stoneLight,3,9,25,2);r(P.stoneDark,3,26,26,2);
  for(let y=13;y<26;y+=4){
    r(P.mortar,3,y,23,1);
    for(let x=5+(y%8===1?0:3);x<26;x+=6)r(P.mortar,x,y-2,1,2);
  }
  for(const x of [2,10,18,26]){
    r(P.ink,x,5,5,6);r(P.stoneLight,x+1,5,3,2);r(P.stone,x+1,7,3,3);r(P.stoneDark,x+4,6,1,4);
  }
  r(P.stoneDark,3,10,26,1);
  // Recessed arch, flanking slit windows, blue banner and iron spear rack.
  r(P.ink,11,19,9,9);r(P.ink,12,17,7,2);r(P.ink,14,16,3,1);
  r(P.stoneLight,11,18,1,2);r(P.stoneLight,13,17,2,1);
  r(P.oakDark,13,20,5,7);r(P.oak,14,20,3,6);r(P.gold,17,23,1,1);
  for(const x of [6,23]){r(P.ink,x,14,2,5);r(P.stoneLight,x-1,19,4,1);}
  r(P.blueDark,19,11,5,8);r(P.blue,20,11,3,6);r(P.gold,21,13,1,3);r(P.gold,20,14,3,1);
  r(P.oakDark,15,1,1,7);r(P.blueDark,16,1,8,4);r(P.blueLight,16,1,7,1);r(P.blue,16,2,7,2);
  r(P.stoneLight,11,27,9,1);
}
function swordsman(r){
  shadow(r,5,27,22);
  // Boots and legs, then blue surcoat and steel shoulders.
  r(P.ink,10,23,5,6);r(P.ink,18,23,5,6);
  r(P.steelDark,11,23,3,4);r(P.steelDark,19,23,3,4);
  r(P.steel,11,23,1,3);r(P.steel,19,23,1,3);
  r(P.ink,9,12,14,12);r(P.blueDark,11,13,10,11);r(P.blue,11,13,7,9);
  r(P.steelDark,8,12,4,9);r(P.steel,9,12,3,5);r(P.steelLight,9,12,2,1);
  r(P.steelDark,21,12,4,8);r(P.steel,21,12,3,5);r(P.steelLight,21,12,2,1);
  r(P.oakDark,11,19,10,2);r(P.gold,15,19,2,2);r(P.blueLight,12,14,2,4);
  // Rounded stepped helmet silhouette, face and visor.
  r(P.ink,11,3,10,10);r(P.ink,13,2,6,1);r(P.ink,10,5,12,5);
  r(P.steelDark,11,5,10,5);r(P.steel,12,4,8,5);r(P.steelLight,13,3,5,2);
  r(P.steelLight,12,5,2,3);r(P.shine,13,4,2,1);r(P.ink,12,8,8,2);
  r('#c8a47c',14,10,5,2);r(P.steelDark,11,10,2,2);r(P.steelDark,19,10,2,2);
  // Heater shield, distinct blue/steel heraldry.
  r(P.ink,3,14,9,9);r(P.ink,5,23,5,2);r(P.ink,6,25,3,1);
  r(P.steel,4,15,7,7);r(P.steel,6,22,3,2);r(P.steelLight,4,15,6,1);
  r(P.blueDark,5,16,5,6);r(P.blue,5,16,3,5);r(P.gold,7,17,1,4);r(P.gold,6,18,3,1);
  // Upright blade, hand and crossguard.
  r(P.ink,26,3,3,16);r(P.steel,26,4,2,13);r(P.shine,27,4,1,12);r(P.steelLight,27,3,1,1);
  r(P.ink,23,17,8,3);r(P.gold,24,17,6,2);r(P.oakDark,26,19,2,5);
  r('#c8a47c',23,19,3,3);r(P.ink,25,24,4,1);
}

/** Art is generated once per bounded variant/mask and shared by world and UI. */
export function sprite(id,variant=0,edges=0){
  if(id==='grass'&&(!Number.isInteger(variant)||variant<0||variant>=GRASS_VARIANTS||!Number.isInteger(edges)||edges<0||edges>15))throw new RangeError('Invalid grass art variant');
  const cacheKey=id==='grass'?id+':'+variant+':'+edges:id;
  if(cache.has(cacheKey))return cache.get(cacheKey);
  const {canvas,r}=surface();
  if(id==='grass')grass(r,variant,edges);
  else if(id==='townHall')townHall(r);
  else if(id==='barracks')barracks(r);
  else if(id==='swordsman')swordsman(r);
  else throw new Error('Unknown sprite: '+id);
  cache.set(cacheKey,canvas);return canvas;
}
