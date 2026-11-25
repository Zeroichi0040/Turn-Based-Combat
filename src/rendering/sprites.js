import {TILE_SIZE} from '../content/definitions.js';
const cache=new Map();
export function sprite(id){
  if(cache.has(id))return cache.get(id);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=TILE_SIZE;
  const c=canvas.getContext('2d');
  const r=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const pixels=(rows,palette,x=0,y=0)=>{
    rows.forEach((row,j)=>[...row].forEach((p,i)=>{if(palette[p])r(palette[p],x+i,y+j,1,1);}));
  };
  if(id==='grass'){
    r('#76994c',0,0,32,32);
    let seed=431;
    for(let i=0;i<35;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%32;seed=(seed*1664525+1013904223)>>>0;const y=(seed>>>8)%32;r(i%3===0?'#63863e':'#82a454',x,y,1+(i%2),1);}
    for(const [x,y] of [[4,7],[23,5],[14,24],[28,19],[8,17]]){r('#567b39',x,y,1,3);r('#8aaf5a',x+1,y+1,1,2);}
  }else if(id==='townHall'){
    r('#26322455',3,26,27,4);
    r('#5d4b36',5,12,23,16);r('#c6b58a',6,13,21,13);r('#a28d65',22,13,5,13);
    for(let i=0;i<9;i++){r('#693b32',14-i,3+i,4+i*2,2);r('#a95844',15-i,3+i,2+i*2,1);}
    r('#783e34',3,12,27,3);r('#433a2c',13,20,6,8);r('#8d7047',14,21,4,7);
    for(const x of [8,22]){r('#554c3c',x,17,3,4);r('#89a8b1',x+1,18,1,2);}
    r('#7c6e58',11,28,10,2);r('#d4c49d',6,15,16,1);
  }else if(id==='barracks'){
    r('#26322455',2,26,29,4);
    r('#554f49',3,9,26,20);r('#a6a29a',4,10,24,17);r('#827e76',23,10,5,17);
    r('#c3beb0',2,8,28,4);for(const x of [2,10,18,26])r('#bbb7ab',x,4,4,5);
    r('#4f4b44',12,19,8,10);r('#79644a',13,20,6,9);
    for(const x of [6,23]){r('#494b4c',x,14,3,4);r('#d2cbbc',x,18,3,1);}
    r('#6d6860',4,22,7,1);r('#6d6860',21,24,7,1);
    r('#665038',17,1,1,8);r('#416d99',18,1,7,4);r('#6b95b8',18,1,7,1);
  }else if(id==='swordsman'){
    r('#26322466',6,28,18,3);
    pixels([
      '....oooo....','...osssso...','..osssssso..','..ossshsso..','..offfffoo..','...offffo...','....oooo....',
      '..ooggggoo..','.oggggggggo.','oggbbbbggggo','oggbbbbbgggo','oggbbbbbgggo','.ogbbbbbggo.','..obbbbbo...',
      '..ogggggo...','..og..ogo...','..og..ogo...','..oo..ooo...'
    ],{o:'#41474c',s:'#b2bdc5',h:'#e1e5e7',f:'#d7b38a',g:'#909da8',b:'#416d9d'},7,4);
    r('#41474c',10,22,5,6);r('#77838a',11,22,3,4);r('#41474c',18,22,5,6);r('#77838a',19,22,3,4);
    r('#616970',25,3,3,15);r('#e1e5e7',26,3,1,14);r('#c2aa63',23,17,7,2);r('#795b38',25,19,2,5);
    r('#465366',4,14,6,9);r('#7593ad',5,15,4,6);r('#b5c0c7',6,16,2,3);
  }else throw new Error('Unknown sprite: '+id);
  cache.set(id,canvas);return canvas;
}
