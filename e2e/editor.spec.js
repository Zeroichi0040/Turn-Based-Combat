import {test,expect} from '@playwright/test';
import {centerCameraOnBounds} from '../src/rendering/camera.js';
const initial={minX:0,minY:0,maxX:9,maxY:9};
async function tile(page,x,y,bounds=initial){
  await page.getByRole('button',{name:'Reset camera'}).click();
  const box=await page.locator('#world').boundingBox();
  const c=centerCameraOnBounds(box.width,box.height,bounds);
  return {x:box.x+c.x+(x+.5)*32*c.zoom,y:box.y+c.y+(y+.5)*32*c.zoom};
}
async function clickTile(page,x,y,bounds){const p=await tile(page,x,y,bounds);await page.mouse.click(p.x,p.y);}
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('#map-stats')).toHaveText('100 grass · 0 occupants');});
test('drawer tabs, same-category replacement, cross-category rejection and universal erase',async({page})=>{
  await page.getByRole('button',{name:'Close drawer'}).click();
  await expect(page.locator('#drawer-panel')).toBeHidden();
  await page.getByRole('button',{name:'Buildings'}).click();
  await expect(page.locator('#drawer-panel')).toBeVisible();
  await clickTile(page,1,1);await expect(page.locator('#status')).toHaveText('Town Hall placed.');
  await page.getByRole('button',{name:'Barracks'}).click();await clickTile(page,1,1);
  await expect(page.locator('#status')).toHaveText('Barracks placed.');
  await page.getByRole('button',{name:'Units'}).click();await clickTile(page,1,1);
  await expect(page.locator('#status')).toHaveText('Erase the existing occupant first.');
  await page.getByRole('button',{name:'Erase',exact:true}).click();await clickTile(page,1,1);
  await expect(page.locator('#map-stats')).toHaveText('100 grass · 0 occupants');
  await clickTile(page,1,1);await expect(page.locator('#map-stats')).toHaveText('99 grass · 0 occupants');
});
test('grass expands cardinally and drag painting fills fast pointer gaps',async({page})=>{
  await clickTile(page,-1,-1);await expect(page.locator('#status')).toHaveText('Grass must touch existing grass on an edge.');
  const a=await tile(page,9,0),b={x:a.x+32*centerCameraOnBounds((await page.locator('#world').boundingBox()).width,(await page.locator('#world').boundingBox()).height,initial).zoom*2,y:a.y};
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y);await page.mouse.up();
  await expect(page.locator('#map-stats')).toHaveText('102 grass · 0 occupants');
  await page.getByRole('button',{name:'Erase',exact:true}).click();
  await clickTile(page,10,0,{...initial,maxX:11});
  await expect(page.locator('#status')).toHaveText('Cannot disconnect the map.');
});
test('editor modal resumes without losing edits and persistence is explicitly deferred',async({page})=>{
  await page.getByRole('button',{name:'Buildings'}).click();await clickTile(page,2,2);
  await page.getByRole('button',{name:'Editor menu'}).click();
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Save'})).toBeDisabled();
  await expect(dialog.getByRole('button',{name:'Exit'})).toBeDisabled();
  await dialog.getByRole('button',{name:'Resume'}).click();await expect(dialog).toBeHidden();
  await expect(page.locator('#map-stats')).toHaveText('100 grass · 1 occupants');
});
