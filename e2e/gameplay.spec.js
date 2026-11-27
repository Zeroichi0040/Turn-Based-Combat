import {test,expect} from '@playwright/test';
import {resetGeometry as centerCameraOnBounds,settleFrame,readSavedMaps} from './helpers.js';
const initial={minX:0,minY:0,maxX:9,maxY:9};
async function tile(page,x,y){
 const box=await page.locator('#world').boundingBox(),c=centerCameraOnBounds(box.width,box.height,initial);
 await page.mouse.click(box.x+c.x+(x+.5)*32*c.zoom,box.y+c.y+(y+.5)*32*c.zoom);
}
test.beforeEach(async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Edit',exact:true}).click();
 await page.getByRole('button',{name:'New Map',exact:true}).click();await page.getByRole('button',{name:'Create',exact:true}).click();
 await page.getByRole('button',{name:'Units',exact:true}).click();await page.getByRole('button',{name:'Reset camera'}).click();await tile(page,4,4);
 await page.getByRole('button',{name:'Editor menu'}).click();await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.getByRole('button',{name:'Editor menu'}).click();await page.getByRole('button',{name:'Exit',exact:true}).click();
 await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Start',exact:true}).click();
 await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.locator('#turn-label')).toHaveText('Turn 1');
});
test('select, reject distant move, move once, end turn and move again',async({page})=>{
 await page.getByRole('button',{name:'Reset camera'}).click();
 await tile(page,4,4);await expect(page.locator('#status')).toContainText('Swordsman selected');
 await tile(page,7,4);await expect(page.locator('#status')).toHaveText('Select a unit to move.');
 await tile(page,5,5);await expect(page.locator('#status')).toHaveText('Select a unit to move.');
 await tile(page,4,4);await expect(page.locator('#status')).toContainText('Swordsman selected');
 await tile(page,5,5);await expect(page.locator('#status')).toHaveText('Confirm move');await tile(page,5,5);await expect(page.locator('#status')).toContainText('Swordsman moved');
 await tile(page,5,5);await expect(page.locator('#status')).toContainText('already moved');
 await page.getByRole('button',{name:'End turn',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'End Turn?'})).toBeVisible();
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('#turn-label')).toHaveText('Turn 1');
 await page.getByRole('button',{name:'End turn',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'End Turn',exact:true}).click();
 await expect(page.locator('#turn-label')).toHaveText('Turn 2');
 await tile(page,5,5);await tile(page,7,5);await tile(page,7,5);await expect(page.locator('#status')).toContainText('Swordsman moved');
});
test('exiting and starting again restores the saved layout and initial turn',async({page})=>{
 await page.getByRole('button',{name:'Reset camera'}).click();
 await tile(page,4,4);await tile(page,6,4);await tile(page,6,4);
 await page.getByRole('button',{name:'Game menu'}).click();await page.getByRole('button',{name:'Exit',exact:true}).click();
 await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.locator('#turn-label')).toHaveText('Turn 1');
 await page.getByRole('button',{name:'Reset camera'}).click();await tile(page,4,4);await expect(page.locator('#status')).toContainText('Swordsman selected');
});

test('white preview arrow is actually rendered and clears after confirmation',async({page})=>{
 await page.getByRole('button',{name:'Reset camera'}).click();
 await tile(page,4,4);await tile(page,6,4);await settleFrame(page);
 const box=await page.locator('#world').boundingBox(),c=centerCameraOnBounds(box.width,box.height,initial);
 const sample=()=>page.locator('#world').evaluate((canvas,p)=>{
   const r=canvas.width/canvas.getBoundingClientRect().width,ctx=canvas.getContext('2d');
   const data=ctx.getImageData(Math.round(p.x*r)-2,Math.round(p.y*r)-2,5,5).data;
   let whites=0;for(let i=0;i<data.length;i+=4)if(data[i]>245&&data[i+1]>245&&data[i+2]>245)whites++;
   return whites;
 },{x:c.x+5.5*32*c.zoom,y:c.y+4.5*32*c.zoom});
 expect(await sample()).toBeGreaterThan(0);
 await tile(page,6,4);await settleFrame(page);expect(await sample()).toBe(0);
});
