import {test,expect} from '@playwright/test';
import {centerCameraOnBounds} from '../src/rendering/camera.js';
const bounds={minX:0,minY:0,maxX:9,maxY:9};
async function tile(page,x,y){
  const box=await page.locator('#world').boundingBox(),c=centerCameraOnBounds(box.width,box.height,bounds);
  await page.mouse.click(box.x+c.x+(x+.5)*32*c.zoom,box.y+c.y+(y+.5)*32*c.zoom);
}
async function turn(page){
  await page.getByRole('button',{name:'End turn',exact:true}).click();
  await page.getByRole('dialog',{name:'End Turn?'}).getByRole('button',{name:'End Turn',exact:true}).click();
}
async function openBuilding(page,x,y,name){
  await tile(page,x,y);await tile(page,x,y);
  await expect(page.getByRole('dialog',{name,exact:true})).toBeVisible();
}
test.beforeEach(async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByRole('button',{name:'New Map',exact:true}).click();await page.getByRole('button',{name:'Create',exact:true}).click();
  await page.getByRole('button',{name:'Buildings',exact:true}).click();
  await page.getByRole('button',{name:'Barracks',exact:true}).click();await tile(page,4,4);
  await page.getByRole('button',{name:'Town Hall',exact:true}).click();await tile(page,6,4);
  await page.getByRole('button',{name:'Units',exact:true}).click();await tile(page,3,4);await tile(page,4,3);await tile(page,4,5);
  await page.getByRole('button',{name:'Editor menu'}).click();await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.getByRole('button',{name:'Editor menu'}).click();await page.getByRole('button',{name:'Exit',exact:true}).click();
  await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Start',exact:true}).click();
  await page.getByRole('button',{name:'Play',exact:true}).click();await page.getByRole('button',{name:'Reset camera'}).click();
});
test('entry, spent inspection, ready deployment, cancel and direct transfer',async({page})=>{
  await tile(page,3,4);await tile(page,4,4);await expect(page.locator('#status')).toContainText('garrisoned');
  await openBuilding(page,4,4,'Barracks');
  const dialog=page.getByRole('dialog',{name:'Barracks',exact:true});
  await expect(dialog.locator('.garrison-slot')).toHaveCount(2);
  await expect(page.locator('#garrison-count')).toHaveText('1 / 2 garrisoned');
  const spent=dialog.getByRole('button',{name:'Swordsman slot 1 (spent)',exact:true});
  await spent.click();await spent.click();await expect(dialog).toBeVisible();await expect(spent).toHaveAttribute('aria-pressed','true');
  await dialog.getByRole('button',{name:'Close',exact:true}).click();await turn(page);
  await openBuilding(page,4,4,'Barracks');
  const ready=dialog.getByRole('button',{name:'Swordsman slot 1 (ready)',exact:true});
  await ready.click();await ready.click();await expect(dialog).toBeHidden();await expect(page.locator('#status')).toContainText('Deployment selected');
  await page.keyboard.press('Escape');await expect(page.locator('#status')).toHaveText('Selection cleared.');
  await openBuilding(page,4,4,'Barracks');await expect(page.locator('#garrison-count')).toHaveText('1 / 2 garrisoned');
  await ready.click();await ready.click();await tile(page,6,4);
  await expect(page.locator('#status')).toContainText('garrisoned');
  await openBuilding(page,6,4,'Town Hall');await expect(page.locator('#garrison-slots .garrison-slot')).toHaveCount(4);
  await expect(page.locator('#garrison-count')).toHaveText('1 / 4 garrisoned');
  await expect(page.getByRole('button',{name:'Swordsman slot 1 (spent)',exact:true})).toBeVisible();
});
test('full barracks rejects entry and allows traversal',async({page})=>{
  await tile(page,3,4);await tile(page,4,4);await tile(page,4,3);await tile(page,4,4);
  await tile(page,4,5);await tile(page,4,4);await expect(page.locator('#status')).toHaveText('Garrison is full.');
  await tile(page,4,3);await expect(page.locator('#status')).toContainText('Swordsman moved');
  await openBuilding(page,4,4,'Barracks');await expect(page.locator('#garrison-count')).toHaveText('2 / 2 garrisoned');
});
