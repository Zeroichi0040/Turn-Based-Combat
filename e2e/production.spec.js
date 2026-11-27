import {test,expect} from '@playwright/test';
import {resetGeometry as centerCameraOnBounds} from './helpers.js';
const bounds={minX:0,minY:0,maxX:9,maxY:9};
async function tile(page,x,y){
  const box=await page.locator('#world').boundingBox(),c=centerCameraOnBounds(box.width,box.height,bounds);
  await page.mouse.click(box.x+c.x+(x+.5)*32*c.zoom,box.y+c.y+(y+.5)*32*c.zoom);
}
async function openBuilding(page,x,name){
  // Escape clears any previous selection so the two clicks have deterministic meaning.
  await page.keyboard.press('Escape');await tile(page,x,4);await tile(page,x,4);
  await expect(page.getByRole('dialog',{name,exact:true})).toBeVisible();
}
async function closeBuilding(page){await page.getByRole('button',{name:'Close',exact:true}).click();}
async function turn(page){
  await page.getByRole('button',{name:'End turn',exact:true}).click();
  await page.getByRole('dialog',{name:'End Turn?'}).getByRole('button',{name:'End Turn',exact:true}).click();
}
async function order(page){
  const slot=page.getByRole('button',{name:'Empty production slot'});
  await slot.click();await expect(slot).toHaveAttribute('aria-pressed','true');
  await slot.click();
  const picker=page.getByRole('dialog',{name:'Train Unit'});
  await expect(picker).toBeVisible();
  const choice=picker.getByRole('button',{name:'Swordsman',exact:true});
  await choice.click();await expect(choice).toHaveAttribute('aria-pressed','true');
  await choice.click();await expect(picker).toBeHidden();
  await expect(page.getByRole('button',{name:'Swordsman production slot'})).toBeVisible();
}
test.beforeEach(async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByRole('button',{name:'New Map',exact:true}).click();await page.getByRole('button',{name:'Create',exact:true}).click();
  await page.getByRole('button',{name:'Buildings',exact:true}).click();
  await page.getByRole('button',{name:'Barracks',exact:true}).click();await tile(page,4,4);
  await page.getByRole('button',{name:'Town Hall',exact:true}).click();await tile(page,6,4);
  await page.getByRole('button',{name:'Editor menu'}).click();await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.getByRole('button',{name:'Editor menu'}).click();await page.getByRole('button',{name:'Exit',exact:true}).click();
  await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Start',exact:true}).click();
  await page.getByRole('button',{name:'Play',exact:true}).click();await page.getByRole('button',{name:'Reset camera'}).click();
});
test('training repeats, pauses at capacity and resumes after deployment',async({page})=>{
  await openBuilding(page,4,'Barracks');await order(page);
  await expect(page.locator('#garrison-count')).toHaveText('0 / 2 garrisoned');await closeBuilding(page);
  await turn(page);await openBuilding(page,4,'Barracks');
  await expect(page.getByRole('button',{name:'Swordsman slot 1 (ready)',exact:true})).toBeVisible();
  await closeBuilding(page);await turn(page);await openBuilding(page,4,'Barracks');
  await expect(page.locator('#garrison-count')).toHaveText('2 / 2 garrisoned');
  await expect(page.locator('#production-state')).toHaveText('Paused — garrison full');
  await expect(page.locator('#production-slot')).toHaveClass(/paused/);await closeBuilding(page);
  await turn(page);await openBuilding(page,4,'Barracks');await expect(page.locator('#garrison-count')).toHaveText('2 / 2 garrisoned');
  const ready=page.getByRole('button',{name:'Swordsman slot 1 (ready)',exact:true});
  await ready.click();await ready.click();await tile(page,3,4);await tile(page,3,4);
  await openBuilding(page,4,'Barracks');
  await expect(page.locator('#production-state')).toContainText('Training');await expect(page.locator('#garrison-count')).toHaveText('1 / 2 garrisoned');
  await closeBuilding(page);await turn(page);await openBuilding(page,4,'Barracks');
  await expect(page.locator('#garrison-count')).toHaveText('2 / 2 garrisoned');
});
test('picker back and cancellation do not train units; town hall has no production',async({page})=>{
  await openBuilding(page,6,'Town Hall');await expect(page.locator('#production-panel')).toBeHidden();await closeBuilding(page);
  await openBuilding(page,4,'Barracks');
  const slot=page.getByRole('button',{name:'Empty production slot'});
  await slot.click();await slot.click();
  await page.getByRole('dialog',{name:'Train Unit'}).getByRole('button',{name:'Back'}).click();
  await expect(slot).toBeVisible();await closeBuilding(page);
  await openBuilding(page,4,'Barracks');await order(page);
  await page.getByRole('button',{name:'Cancel production'}).click();await expect(slot).toBeVisible();
  await closeBuilding(page);await turn(page);await openBuilding(page,4,'Barracks');
  await expect(page.locator('#garrison-count')).toHaveText('0 / 2 garrisoned');
});

test('completed unit can be selected and deployed directly from barracks tile',async({page})=>{
 await openBuilding(page,4,'Barracks');await order(page);await closeBuilding(page);await turn(page);
 await tile(page,4,4);await expect(page.locator('#status')).toHaveText('Swordsman selected');
 await tile(page,3,4);await expect(page.locator('#status')).toHaveText('Confirm move');
 await tile(page,3,4);await expect(page.locator('#status')).toContainText('Swordsman moved');
 await openBuilding(page,4,'Barracks');await expect(page.locator('#garrison-count')).toHaveText('0 / 2 garrisoned');
});

async function assertNoOverflow(page){
  const dialog=page.locator('#garrison-dialog');
  const metrics=await dialog.evaluate(el=>({
    width:el.clientWidth,height:el.clientHeight,
    scrollWidth:el.scrollWidth,scrollHeight:el.scrollHeight,
    outerWidth:el.offsetWidth,outerHeight:el.offsetHeight,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.height);
  await expect(dialog.getByRole('button',{name:'Close',exact:true})).toBeInViewport();
  return [metrics.outerWidth,metrics.outerHeight];
}
test('building dialogs fit content and retain size across training states',async({page})=>{
  await openBuilding(page,4,'Barracks');const size=await assertNoOverflow(page);
  await order(page);expect(await assertNoOverflow(page)).toEqual(size);await closeBuilding(page);
  await turn(page);await turn(page);await openBuilding(page,4,'Barracks');
  await expect(page.locator('#production-state')).toHaveText('Paused — garrison full');
  expect(await assertNoOverflow(page)).toEqual(size);await closeBuilding(page);
  await openBuilding(page,6,'Town Hall');expect(await assertNoOverflow(page)).toEqual(size);
});
