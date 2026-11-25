import {test,expect} from '@playwright/test';
test('generated assets are native 32px, cached, distinct and deterministic',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {sprite}=await import('/src/rendering/sprites.js');
  const ids=['grass','townHall','barracks','swordsman'],images=ids.map(id=>sprite(id));
  const alpha=(canvas,x,y)=>canvas.getContext('2d').getImageData(x,y,1,1).data[3];
  return {
   sizes:images.map(c=>[c.width,c.height]),
   unique:new Set(images.map(c=>c.toDataURL())).size,
   transparent:images.slice(1).every(c=>alpha(c,0,0)===0),
   grassOpaque:images[0].getContext('2d').getImageData(0,0,32,32).data.every((v,i)=>i%4!==3||v===255),
   cached:sprite('grass',3,5)===sprite('grass',3,5),
   variants:new Set(Array.from({length:8},(_,i)=>sprite('grass',i).toDataURL())).size,
   edges:sprite('grass',0,1).toDataURL()!==sprite('grass',0,0).toDataURL(),
  };
 });
 expect(result.sizes).toEqual([[32,32],[32,32],[32,32],[32,32]]);
 expect(result.unique).toBe(4);expect(result.transparent).toBe(true);
 expect(result.grassOpaque).toBe(true);expect(result.cached).toBe(true);
 expect(result.variants).toBe(8);expect(result.edges).toBe(true);
});
