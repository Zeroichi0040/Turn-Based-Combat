import {test,expect} from '@playwright/test';
test('camera keyboard handler does not consume navigation outside a map or in a modal',async({page})=>{
 await page.goto('/');
 const consumed=()=>page.evaluate(()=>{const e=new KeyboardEvent('keydown',{key:'ArrowDown',cancelable:true,bubbles:true});document.body.dispatchEvent(e);return e.defaultPrevented;});
 expect(await consumed()).toBe(false);
 await page.getByRole('button',{name:'Edit',exact:true}).click();await page.getByRole('button',{name:'New Map'}).click();
 expect(await consumed()).toBe(false);
 await page.getByRole('button',{name:'Create',exact:true}).click();await expect(page.locator('#world')).toBeVisible();
 expect(await consumed()).toBe(true);
 await page.evaluate(()=>document.body.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowDown',bubbles:true})));
 await page.getByRole('button',{name:'Editor menu'}).click();expect(await consumed()).toBe(false);
});
