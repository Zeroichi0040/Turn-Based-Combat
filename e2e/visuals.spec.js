import {test,expect} from '@playwright/test';
test('editor displays distinct native 32px sprite assets from the bundled application',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Edit',exact:true}).click();await page.getByRole('button',{name:'New Map'}).click();await page.getByRole('button',{name:'Create',exact:true}).click();
 const assets=async()=>page.locator('.asset-button img').evaluateAll(imgs=>imgs.map(i=>({src:i.src,w:i.naturalWidth,h:i.naturalHeight})));
 await expect(page.locator('.asset-button img')).toHaveCount(1);await expect.poll(async()=>(await assets())[0]?.w).toBe(32);
 const grass=await assets();
 await page.getByRole('button',{name:'Buildings'}).click();await expect.poll(async()=>(await assets()).every(i=>i.w===32&&i.h===32)).toBe(true);const buildings=await assets();
 await page.getByRole('button',{name:'Units'}).click();await expect.poll(async()=>(await assets())[0]?.w).toBe(32);const units=await assets();
 const all=[...grass,...buildings,...units];expect(all).toHaveLength(4);expect(new Set(all.map(i=>i.src)).size).toBe(4);expect(all.every(i=>i.w===32&&i.h===32)).toBe(true);
});
