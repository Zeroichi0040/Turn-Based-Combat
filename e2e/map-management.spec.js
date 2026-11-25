import {test,expect} from '@playwright/test';
import {centerCameraOnBounds} from '../src/rendering/camera.js';
async function create(page,name=''){
  await page.getByRole('button',{name:'New Map',exact:true}).click();
  await page.getByLabel('Map name').fill(name);
  await page.getByRole('button',{name:'Create',exact:true}).click();
  await expect(page.locator('#map-screen')).toBeVisible();
}
async function place(page){
  await page.getByRole('button',{name:'Buildings',exact:true}).click();
  await page.getByRole('button',{name:'Reset camera'}).click();
  const box=await page.locator('#world').boundingBox();
  const c=centerCameraOnBounds(box.width,box.height,{minX:0,minY:0,maxX:9,maxY:9});
  await page.mouse.click(box.x+c.x+4.5*32*c.zoom,box.y+c.y+4.5*32*c.zoom);
  await expect(page.locator('#map-stats')).toHaveText('100 grass · 1 occupants');
}
async function menu(page){await page.getByRole('button',{name:'Editor menu'}).click();}
test.beforeEach(async({page})=>{await page.goto('/');await page.getByRole('button',{name:'Edit',exact:true}).click();});
test('create default, save, reload, rename, preview and delete',async({page})=>{
  await create(page);await expect(page.locator('#scene-name')).toHaveText('New Map 1');await place(page);
  await menu(page);await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.locator('#status')).toHaveText('Map saved.');
  await page.reload();await page.getByRole('button',{name:'Edit',exact:true}).click();
  const row=page.locator('.saved-map');await expect(row).toContainText('100 grass · 1 occupants');
  await row.getByRole('button',{name:'Rename'}).click();await page.getByLabel('Map name').fill('Fort');
  await page.getByRole('dialog').getByRole('button',{name:'Rename',exact:true}).click();
  await expect(row).toContainText('Fort');
  await row.getByRole('button',{name:'Edit',exact:true}).click();await expect(page.locator('#map-stats')).toHaveText('100 grass · 1 occupants');
  await menu(page);await page.getByRole('button',{name:'Exit',exact:true}).click();
  await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Start',exact:true}).click();
  await row.getByRole('button',{name:'Play',exact:true}).click();await expect(page.locator('#scene-name')).toHaveText('Fort');
  await expect(page.locator('#drawer')).toBeHidden();await page.getByRole('button',{name:'Game menu'}).click();
  await expect(page.getByRole('button',{name:'Continue'})).toBeVisible();await page.getByRole('button',{name:'Exit',exact:true}).click();
  await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Edit',exact:true}).click();
  await row.getByRole('button',{name:'Delete'}).click();await page.getByRole('dialog').getByRole('button',{name:'Cancel'}).click();await expect(row).toHaveCount(1);
  await row.getByRole('button',{name:'Delete'}).click();await page.getByRole('dialog').getByRole('button',{name:'Delete'}).click();await expect(row).toHaveCount(0);
});
test('dirty exit cancel retains changes, discard reopens saved copy',async({page})=>{
  await create(page,'Discard test');await place(page);await menu(page);await page.getByRole('button',{name:'Exit',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Cancel'}).click();
  await expect(page.locator('#map-stats')).toHaveText('100 grass · 1 occupants');
  await menu(page);await page.getByRole('button',{name:'Exit',exact:true}).click();
  await page.getByRole('button',{name:'Discard',exact:true}).click();
  await page.locator('.saved-map').getByRole('button',{name:'Edit'}).click();
  await expect(page.locator('#map-stats')).toHaveText('100 grass · 0 occupants');
});
test('save on dirty exit persists changes',async({page})=>{
  await create(page,'Save test');await place(page);await menu(page);await page.getByRole('button',{name:'Exit',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.locator('.saved-map')).toContainText('100 grass · 1 occupants');
});
